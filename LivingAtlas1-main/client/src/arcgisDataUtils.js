const AQ_SERVICE_URL = "https://gis.ecology.wa.gov/serverext/rest/services/Authoritative/AQ/MapServer";

export async function fetchArcgisLayers() {
    const res = await fetch(`${AQ_SERVICE_URL}/layers?f=json`);
    const data = await res.json();
    return data.layers || [];
}

export async function fetchArcgisLegend() {
    const res = await fetch(`${AQ_SERVICE_URL}/legend?f=json`);
    return res.json();
}