const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://gis.ecology.wa.gov/serverext/rest/services/Authoritative';

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    return res.json();
}

async function fetchAllServices() {
    const url = `${BASE_URL}?f=json`;
    const data = await fetchJson(url);
    return [
        ...(data.services || [])
    ];
}

async function fetchAllLayers(service) {
    const url = `${BASE_URL}/${service.name}/${service.type}/layers?f=json`;
    const data = await fetchJson(url);
    return (data.layers || []).map(layer => ({
        ...layer,
        service
    }));
}

async function fetchLayerFeatures(service, layer) {
    // Try to fetch all features as GeoJSON
    const url = `${BASE_URL}/${service.name}/${service.type}/${layer.id}/query?where=1=1&outFields=*&f=geojson`;
    const data = await fetchJson(url);
    return data;
}

async function main() {
    const services = await fetchAllServices();
    console.log(`Found ${services.length} services under Authoritative.`);

    for (const service of services) {
        // Only process MapServer and FeatureServer
        if (!['MapServer', 'FeatureServer'].includes(service.type)) continue;
        console.log(`\nService: ${service.name} (${service.type})`);

        let layers;
        try {
            layers = await fetchAllLayers(service);
        } catch (e) {
            console.warn(`  Could not fetch layers for ${service.name}: ${e.message}`);
            continue;
        }

        for (const layer of layers) {
            console.log(`  Layer: ${layer.name} (ID: ${layer.id})`);
            try {
                const features = await fetchLayerFeatures(service, layer);
                // Save to disk as GeoJSON
                const dir = path.join(__dirname, 'arcgis_data', service.name.replace(/\//g, '_'));
                fs.mkdirSync(dir, { recursive: true });
                const file = path.join(dir, `layer_${layer.id}_${layer.name.replace(/[^a-z0-9]/gi, '_')}.geojson`);
                fs.writeFileSync(file, JSON.stringify(features, null, 2));
                console.log(`    Saved ${features.features ? features.features.length : 0} features to ${file}`);
            } catch (e) {
                console.warn(`    Could not fetch features for layer ${layer.name}: ${e.message}`);
            }
        }
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});