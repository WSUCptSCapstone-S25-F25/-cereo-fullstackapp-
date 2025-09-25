import api from './api';

const STATE_MAP = {
  WA: 'washington',
  ID: 'idaho',
  OR: 'oregon',
};

// Fetch ArcGIS services from backend by state code (e.g. 'WA', 'ID', 'OR')
export async function fetchArcgisServicesByState(stateCode, { type = 'MapServer' } = {}) {
  const params = {};
  if (stateCode) params.state = STATE_MAP[stateCode] || stateCode;
  if (type) params.type = type;

  const res = await api.get('/arcgis/services', { params });
  const list = res.data && (res.data.data || res.data);
  return Array.isArray(list) ? list : [];
}

// Fetch all ArcGIS services from backend
export async function fetchAllArcgisServices({ type = 'MapServer' } = {}) {
  const res = await api.get('/arcgis/services', { params: { type } });
  const list = res.data && (res.data.data || res.data);
  return Array.isArray(list) ? list : [];
}

// Fetch ArcGIS services for multiple states and return as an object keyed by state code
export async function fetchServicesByStateMap(codes = ['WA', 'ID', 'OR'], { type = 'MapServer' } = {}) {
  const results = {};
  for (const code of codes) {
    results[code] = await fetchArcgisServicesByState(code, { type });
  }
  return results;
}