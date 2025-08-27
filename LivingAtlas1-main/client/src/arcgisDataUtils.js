import ARCGIS_SERVICES from './arcgis_services.json';
export { ARCGIS_SERVICES };

// Utility to get service by key
export function getServiceByKey(key) {
    return ARCGIS_SERVICES.find(s => s.key === key);
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