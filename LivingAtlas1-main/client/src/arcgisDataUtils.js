export const AQ_SERVICE_URL = "https://gis.ecology.wa.gov/serverext/rest/services/Authoritative/AQ/MapServer";

export function getArcgisTileUrl(layerIds = []) {
    let layersParam = '';
    if (layerIds.length > 0) {
        layersParam = '&layers=show:' + layerIds.join(',');
    }
    return `${AQ_SERVICE_URL}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=true&f=image${layersParam}`;
}

export async function fetchArcgisLayers() {
    const res = await fetch(`${AQ_SERVICE_URL}/layers?f=json`);
    const data = await res.json();
    return data.layers || [];
}

export async function fetchArcgisLegend() {
    const res = await fetch(`${AQ_SERVICE_URL}/legend?f=json`);
    return res.json();
}