import api from './api';

const STATE_MAP = {
  WA: 'washington',
  ID: 'idaho',
  OR: 'oregon',
};

// Normalize records from API to exactly match local JSON shape
function adaptServices(list = []) {
  console.log('[arcgisServicesDb] adaptServices input length:', Array.isArray(list) ? list.length : 'non-array', list?.slice?.(0, 3));
  const safe = Array.isArray(list) ? list : [];
  const adapted = safe
    .map(s => ({
      key: s.key,
      label: s.label,
      url: s.url,
      folder: s.folder || 'Root',
      type: s.type,
      state: s.state,
    }))
    .filter(s => !!(s.key && s.label && s.url && s.type))
    .sort((a, b) => a.folder.localeCompare(b.folder) || a.label.localeCompare(b.label));
  console.log('[arcgisServicesDb] adaptServices output length:', adapted.length, adapted.slice(0, 3));
  return adapted;
}

// Normalize removed services records from API - preserves removed-specific fields
function adaptRemovedServices(list = []) {
  console.log('[arcgisServicesDb] adaptRemovedServices input:', { 
    type: typeof list, 
    isArray: Array.isArray(list), 
    length: Array.isArray(list) ? list.length : 'N/A',
    sample: Array.isArray(list) ? list.slice(0, 2) : list
  });
  
  if (!Array.isArray(list)) {
    console.warn('[arcgisServicesDb] adaptRemovedServices: input is not an array, returning empty array');
    return [];
  }
  
  const adapted = list
    .map((s, index) => {
      if (!s || typeof s !== 'object') {
        console.warn(`[arcgisServicesDb] adaptRemovedServices: invalid item at index ${index}:`, s);
        return null;
      }
      
      return {
        key: s.key,
        label: s.label,
        url: s.url,
        folder: s.folder || 'Root',
        type: s.type,
        state: s.state,
        removed_date: s.removed_date,
        removed_by: s.removed_by,
        layers_removed: s.layers_removed || [],
      };
    })
    .filter(s => {
      if (!s) return false;
      const isValid = !!(s.key && s.label && s.url && s.type);
      if (!isValid) {
        console.warn('[arcgisServicesDb] adaptRemovedServices: filtering out invalid service:', s);
      }
      return isValid;
    })
    .sort((a, b) => {
      // Sort by removal date (newest first), then by folder and label
      const dateA = new Date(a.removed_date || 0);
      const dateB = new Date(b.removed_date || 0);
      return dateB - dateA || (a.folder || '').localeCompare(b.folder || '') || (a.label || '').localeCompare(b.label || '');
    });
  
  console.log('[arcgisServicesDb] adaptRemovedServices output:', {
    length: adapted.length,
    sample: adapted.slice(0, 2)
  });
  return adapted;
}

// Try multiple endpoint paths to handle different server mounts
async function tryGetServices(params, paths) {
  let lastErr;
  for (const p of paths) {
    const label = `[arcgisServicesDb] GET ${p} ${params.state || 'ALL'}`;
    try {
      console.log('[arcgisServicesDb] trying', p, 'with params', params);
      console.time(label);
      const res = await api.get(p, { params });
      console.timeEnd(label);
      const raw = res?.data && (res.data.data || res.data);
      console.log('[arcgisServicesDb] success from', p, 'sample:', Array.isArray(raw) ? raw.slice(0, 3) : raw);
      return adaptServices(raw);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.warn('[arcgisServicesDb] path failed:', p, { status, data });
      try { console.timeEnd(label); } catch (_) {}
      lastErr = err;
      // continue to next path on 404 or 405; break on CORS/network only if no more paths
      continue;
    }
  }
  if (lastErr) throw lastErr;
  return [];
}

// Fetch ArcGIS services from backend by state code (e.g. 'WA', 'ID', 'OR')
export async function fetchArcgisServicesByState(stateCode, { type = 'MapServer' } = {}) {
  const params = {};
  if (stateCode) params.state = STATE_MAP[stateCode] || stateCode;
  if (type) params.type = type;

  const base = api?.defaults?.baseURL;
  console.log('[arcgisServicesDb] fetchArcgisServicesByState start', { stateCode, mappedState: params.state, type, baseURL: base });
  try {
    const adapted = await tryGetServices(params, [
      '/arcgis/services',
      '/arcgis/services/',
      '/api/arcgis/services',
      '/api/arcgis/services/',
    ]);
    const filtered = type && type.toLowerCase() !== 'all'
      ? adapted.filter(s => s.type === type)
      : adapted;

    console.log('[arcgisServicesDb] returning', filtered.length, 'services for', params.state || 'ALL');
    return filtered;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.warn('[arcgisServicesDb] fetchArcgisServicesByState failed:', err?.message || err, { status, data });
    return [];
  }
}

// Fetch all ArcGIS services from backend
export async function fetchAllArcgisServices({ type = 'MapServer' } = {}) {
  console.log('[arcgisServicesDb] fetchAllArcgisServices start', { type });
  try {
    const adapted = await tryGetServices({ type }, [
      '/arcgis/services',
      '/arcgis/services/',
      '/api/arcgis/services',
      '/api/arcgis/services/',
    ]);
    const filtered = type && type.toLowerCase() !== 'all'
      ? adapted.filter(s => s.type === type)
      : adapted;

    console.log('[arcgisServicesDb] returning ALL count:', filtered.length);
    return filtered;
  } catch (err) {
    console.warn('[arcgisServicesDb] fetchAllArcgisServices failed:', err?.message || err);
    return [];
  }
}

// Fetch ArcGIS services for multiple states and return as an object keyed by state code
export async function fetchServicesByStateMap(codes = ['WA', 'ID', 'OR'], { type = 'MapServer' } = {}) {
  console.log('[arcgisServicesDb] fetchServicesByStateMap start', { codes, type });
  const results = {};
  for (const code of codes) {
    results[code] = await fetchArcgisServicesByState(code, { type });
    console.log(`[arcgisServicesDb] fetched ${results[code].length} for ${code}`);
  }
  return results;
}

// Remove an ArcGIS service by its key
export async function removeArcgisService(serviceKey, { removedBy = null, layersRemoved = [] } = {}) {
    try {
        console.log(`[arcgisServicesDb] Removing service ${serviceKey}...`);
        
        const requestBody = {
            service_key: serviceKey,
            removed_by: removedBy,
            layers_removed: layersRemoved
        };
        
        const response = await api.post('/arcgis/services/remove', requestBody);
        
        console.log(`[arcgisServicesDb] Successfully removed service ${serviceKey}`);
        return response.data;
        
    } catch (error) {
        console.error(`[arcgisServicesDb] Failed to remove service ${serviceKey}:`, error);
        
        // Provide more specific error details
        const errorMsg = error?.response?.data?.detail || error?.message || 'Network error';
        const enhancedError = new Error(`Failed to remove service ${serviceKey}: ${errorMsg}`);
        enhancedError.originalError = error;
        
        throw enhancedError;
    }
}

// Rename a folder for all services in that folder
export async function renameFolderServices(oldFolderName, newFolderName, stateCode) {
    try {
        console.log(`[arcgisServicesDb] Renaming folder ${oldFolderName} to ${newFolderName} for state ${stateCode}...`);
        
        const requestBody = {
            old_folder_name: oldFolderName,
            new_folder_name: newFolderName,
            state: stateCode
        };
        
        const response = await api.put('/arcgis/services/rename-folder', requestBody);
        
        console.log(`[arcgisServicesDb] Successfully renamed folder ${oldFolderName} to ${newFolderName}`);
        return response.data;
        
    } catch (error) {
        console.error(`[arcgisServicesDb] Failed to rename folder ${oldFolderName}:`, error);
        throw error;
    }
}

// Rename a specific service
export async function renameService(serviceKey, newLabel) {
    try {
        console.log(`[arcgisServicesDb] Renaming service ${serviceKey} to ${newLabel}...`);
        
        const requestBody = {
            service_key: serviceKey,
            new_label: newLabel
        };
        
        const response = await api.put('/arcgis/services/rename', requestBody);
        
        console.log(`[arcgisServicesDb] Successfully renamed service ${serviceKey} to ${newLabel}`);
        return response.data;
        
    } catch (error) {
        console.error(`[arcgisServicesDb] Failed to rename service ${serviceKey}:`, error);
        throw error;
    }
}

// Fetch removed ArcGIS services from backend
export async function fetchRemovedArcgisServices(stateCode = null, { type = 'MapServer' } = {}) {
    const params = {};
    
    if (stateCode) {
        params.state = stateCode;
    }
    if (type && type.toLowerCase() !== 'all') {
        params.type = type;
    }
    
    const path = '/arcgis/services/removed';
    const label = `[arcgisServicesDb] GET ${path} ${params.state || 'ALL'}`;
    
    try {
        console.log('[arcgisServicesDb] Fetching removed services from:', path, 'with params:', params);
        console.time(label);
        
        const res = await api.get(path, { params });
        console.timeEnd(label);
        
        // Handle response data - it could be directly an array or wrapped in a data property
        const raw = Array.isArray(res.data) ? res.data : res.data?.data || res.data;
        console.log('[arcgisServicesDb] Removed services response:', {
            status: res.status,
            dataType: typeof raw,
            isArray: Array.isArray(raw),
            length: Array.isArray(raw) ? raw.length : 'N/A',
            sample: Array.isArray(raw) ? raw.slice(0, 2) : raw
        });
        
        return adaptRemovedServices(raw);
        
    } catch (err) {
        const status = err?.response?.status;
        const data = err?.response?.data;
        const errorDetail = data?.detail || data?.message || 'Unknown error';
        
        console.error('[arcgisServicesDb] Failed to fetch removed services:', {
            path,
            status,
            errorDetail,
            fullError: err.message
        });
        
        try { console.timeEnd(label); } catch (_) {}
        throw new Error(`Failed to fetch removed services (${status}): ${errorDetail}`);
    }
}

// Restore an ArcGIS service from removed back to active services
export async function restoreArcgisService(serviceKey) {
    try {
        console.log(`[arcgisServicesDb] Restoring service ${serviceKey}...`);
        
        const requestBody = {
            service_key: serviceKey
        };
        
        const response = await api.post('/arcgis/services/restore', requestBody);
        
        console.log(`[arcgisServicesDb] Successfully restored service ${serviceKey}`);
        return response.data;
        
    } catch (error) {
        console.error(`[arcgisServicesDb] Failed to restore service ${serviceKey}:`, error);
        throw error;
    }
}

// Permanently delete a removed ArcGIS service
export async function permanentlyDeleteRemovedService(serviceKey) {
    try {
        console.log(`[arcgisServicesDb] Permanently deleting removed service ${serviceKey}...`);
        
        const requestBody = {
            service_key: serviceKey
        };
        
        const response = await api.delete('/arcgis/services/removed', { data: requestBody });
        
        console.log(`[arcgisServicesDb] Successfully deleted removed service ${serviceKey}`);
        return response.data;
        
    } catch (error) {
        console.error(`[arcgisServicesDb] Failed to delete removed service ${serviceKey}:`, error);
        throw error;
    }
}

// Clear all removed ArcGIS services
export async function clearAllRemovedServices() {
    try {
        console.log(`[arcgisServicesDb] Clearing all removed services...`);
        
        const response = await api.delete('/arcgis/services/removed/all');
        
        console.log(`[arcgisServicesDb] Successfully cleared all removed services`);
        return response.data;
        
    } catch (error) {
        console.error(`[arcgisServicesDb] Failed to clear all removed services:`, error);
        throw error;
    }
}