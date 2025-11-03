/**
 * ArcGIS Services Update Functionality
 * 
 * This module handles updating ArcGIS services in the database by synchronizing
 * with the ArcGIS REST servers. It only adds new services and preserves existing
 * ones to avoid conflicts with user renaming functionality.
 */

import api from './api';

// REST server roots - same as fetchArcgisServices_direct_db.js
const SERVERS = {
  WA: 'https://gis.ecology.wa.gov/serverext/rest/services/',
  ID: 'https://gis.idwr.idaho.gov/hosting/rest/services/',
  OR: 'https://navigator.state.or.us/arcgis/rest/services/'
};

const STATE_NAMES = { WA: 'washington', ID: 'idaho', OR: 'oregon' };

const SUPPORTED_TYPES = ['MapServer', 'FeatureServer'];

// Basic sleep utility
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Resilient fetch with retries and timeout
async function resilientFetch(url, opts = {}, { retries = 3, baseDelay = 500 } = {}) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(url, {
                ...opts,
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (response.ok) {
                return response;
            } else if (response.status >= 500 && attempt < retries - 1) {
                // Retry on server errors
                await delay(baseDelay * Math.pow(2, attempt));
                continue;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            if (attempt === retries - 1) {
                throw error;
            }
            await delay(baseDelay * Math.pow(2, attempt));
        }
    }
}

// Fetch services recursively from ArcGIS REST API
async function fetchServicesRecursive(baseUrl, currentPath = '', stateName, onProgress = null) {
    const url = `${baseUrl}${currentPath}?f=json`;
    
    if (onProgress) {
        onProgress(`Fetching: ${currentPath || 'root'}`);
    }

    let data;
    try {
        const response = await resilientFetch(url);
        data = await response.json();
    } catch (error) {
        console.warn(`[arcgisUpdateServices] Failed to fetch ${url}:`, error);
        return [];
    }

    let services = [];

    // Process folders recursively
    if (Array.isArray(data.folders)) {
        for (const folderName of data.folders) {
            await delay(100); // Rate limiting
            const folderServices = await fetchServicesRecursive(
                baseUrl, 
                `${currentPath}${folderName}/`, 
                stateName, 
                onProgress
            );
            services.push(...folderServices);
        }
    }

    // Process services in current folder
    if (Array.isArray(data.services)) {
        for (const svc of data.services) {
            const nameParts = (svc.name || '').split('/');
            const serviceName = nameParts[nameParts.length - 1];
            const folderLabel = currentPath ? 
                currentPath.replace(/\/$/, '') : 
                (nameParts.length > 1 ? nameParts.slice(0, -1).join('/') : 'Root');

            if (SUPPORTED_TYPES.includes(svc.type) && serviceName) {
                // Generate the same key format as fetchArcgisServices_direct_db.js
                const key = `${(folderLabel || 'Root')}_${serviceName}_${svc.type}`.replace(/[^\w]/g, '_');
                
                services.push({
                    key: key,
                    label: `${serviceName} (${svc.type})`,
                    url: `${baseUrl}${currentPath}${serviceName}/${svc.type}`,
                    folder: folderLabel || 'Root',
                    type: svc.type,
                    state: stateName
                });
            }
        }
    }

    return services;
}

// Fetch existing service keys from database
async function fetchExistingServiceKeys(stateCode) {
    try {
        const stateName = STATE_NAMES[stateCode];
        const response = await api.get('/arcgis/services', {
            params: { state: stateName }
        });
        
        if (response.data && Array.isArray(response.data)) {
            return new Set(response.data.map(service => service.service_key || service.key));
        }
        return new Set();
    } catch (error) {
        console.error(`[arcgisUpdateServices] Failed to fetch existing services for ${stateCode}:`, error);
        return new Set();
    }
}

// Add new services to database via backend API
async function addNewServicesToDatabase(newServices, onProgress = null) {
    if (newServices.length === 0) {
        return { success: true, added: 0 };
    }

    try {
        if (onProgress) {
            onProgress(`Adding ${newServices.length} new services to database...`);
        }

        // Add services via backend API endpoint
        const response = await api.post('/arcgis/services/bulk-add', {
            services: newServices
        });

        return {
            success: true,
            added: newServices.length,
            data: response.data
        };
    } catch (error) {
        console.error('[arcgisUpdateServices] Failed to add services to database:', error);
        return {
            success: false,
            error: error.message || 'Failed to add services to database'
        };
    }
}

// Main update function for a specific state
export async function updateArcgisServicesForState(stateCode, onProgress = null) {
    const stateName = STATE_NAMES[stateCode];
    const serverUrl = SERVERS[stateCode];

    if (!stateName || !serverUrl) {
        throw new Error(`Invalid state code: ${stateCode}`);
    }

    if (onProgress) {
        onProgress(`Starting update for ${stateCode}...`);
    }

    try {
        // Step 1: Fetch existing service keys from database
        if (onProgress) {
            onProgress(`Fetching existing services for ${stateCode}...`);
        }
        const existingKeys = await fetchExistingServiceKeys(stateCode);

        // Step 2: Fetch all current services from ArcGIS REST API
        if (onProgress) {
            onProgress(`Scanning ArcGIS REST API for ${stateCode}...`);
        }
        const currentServices = await fetchServicesRecursive(serverUrl, '', stateName, onProgress);

        // Step 3: Filter out services that already exist (by key)
        const newServices = currentServices.filter(service => !existingKeys.has(service.key));

        if (onProgress) {
            onProgress(`Found ${newServices.length} new services for ${stateCode}`);
        }

        // Step 4: Add new services to database
        if (newServices.length > 0) {
            const result = await addNewServicesToDatabase(newServices, onProgress);
            
            if (result.success) {
                if (onProgress) {
                    onProgress(`Successfully added ${result.added} new services for ${stateCode}`);
                }
                return {
                    success: true,
                    state: stateCode,
                    totalFound: currentServices.length,
                    existingCount: existingKeys.size,
                    newCount: newServices.length,
                    added: result.added
                };
            } else {
                throw new Error(result.error);
            }
        } else {
            if (onProgress) {
                onProgress(`No new services found for ${stateCode}`);
            }
            return {
                success: true,
                state: stateCode,
                totalFound: currentServices.length,
                existingCount: existingKeys.size,
                newCount: 0,
                added: 0
            };
        }
    } catch (error) {
        if (onProgress) {
            onProgress(`Error updating ${stateCode}: ${error.message}`);
        }
        throw error;
    }
}

// Update services for all states
export async function updateAllArcgisServices(onProgress = null) {
    const states = ['WA', 'ID', 'OR'];
    const results = [];

    for (const stateCode of states) {
        try {
            const result = await updateArcgisServicesForState(stateCode, onProgress);
            results.push(result);
            
            // Add delay between states to avoid overwhelming the servers
            if (stateCode !== states[states.length - 1]) {
                await delay(1000);
            }
        } catch (error) {
            results.push({
                success: false,
                state: stateCode,
                error: error.message
            });
        }
    }

    return results;
}

// Update services for currently selected state only
export async function updateCurrentStateServices(selectedState, onProgress = null) {
    return await updateArcgisServicesForState(selectedState, onProgress);
}