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
        throw error;
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