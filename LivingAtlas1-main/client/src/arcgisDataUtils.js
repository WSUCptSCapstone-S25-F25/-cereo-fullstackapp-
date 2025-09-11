import WA_ARCGIS_SERVICES from './arcgis_services_wa.json';
import ID_ARCGIS_SERVICES from './arcgis_services_id.json';
import OR_ARCGIS_SERVICES from './arcgis_services_or.json';

// Utility to get services by state
export const ARCGIS_SERVICES_BY_STATE = {
    WA: WA_ARCGIS_SERVICES.filter(s => s.type === 'MapServer'),
    ID: ID_ARCGIS_SERVICES.filter(s => s.type === 'MapServer'),
    OR: OR_ARCGIS_SERVICES.filter(s => s.type === 'MapServer')
};

// Utility to get service by key and state
export function getServiceByKey(state, key) {
    return ARCGIS_SERVICES_BY_STATE[state].find(s => s.key === key);
}

// Fetch layers for a given service
export async function fetchArcgisLayers(serviceUrl) {
    const res = await fetch(`${serviceUrl}/layers?f=json`);
    const data = await res.json();
    return data.layers || [];
}

// Fetch legend for a given service
export async function fetchArcgisLegend(serviceUrl) {
    const res = await fetch(`${serviceUrl}/legend?f=json`);
    return res.json();
}

// Get tile URL for a given service and layer IDs
export function getArcgisTileUrl(serviceUrl, layerIds = []) {
    let layersParam = '';
    if (layerIds.length > 0) {
        layersParam = '&layers=show:' + layerIds.join(',');
    }
    return `${serviceUrl}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=true&f=image${layersParam}`;
}