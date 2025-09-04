const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const SERVICES = require('./arcgis_services.json').filter(s => s.type === 'MapServer');

const OUT_DIR = path.join(__dirname, 'ArcgisData');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

function isJsonResponse(headers) {
    const ct = headers.get('content-type');
    return ct && ct.includes('application/json');
}

async function fetchJson(url) {
    try {
        const res = await fetch(url);
        if (!isJsonResponse(res.headers)) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

async function fetchGeoJson(url, maxSizeMB = 10) {
    try {
        const res = await fetch(url);
        if (!isJsonResponse(res.headers)) return { error: 'Not JSON' };
        const buf = await res.buffer();
        if (buf.length > maxSizeMB * 1024 * 1024) {
            return { error: `Too large (${(buf.length/1024/1024).toFixed(1)} MB)` };
        }
        return JSON.parse(buf.toString());
    } catch (e) {
        return { error: e.message };
    }
}

(async () => {
    for (const svc of SERVICES) {
        const svcName = `${svc.folder}_${svc.label.replace(/[^a-zA-Z0-9_]/g, '')}`;
        const outFile = path.join(OUT_DIR, `${svcName}.json`);
        if (fs.existsSync(outFile)) {
            console.log(`Skipping ${svc.label}, already exists.`);
            continue;
        }
        console.log(`Fetching ${svc.label}...`);
        const layersMeta = await fetchJson(`${svc.url}/layers?f=json`);
        const legend = await fetchJson(`${svc.url}/legend?f=json`);
        let layersData = [];
        if (layersMeta && Array.isArray(layersMeta.layers)) {
            for (const lyr of layersMeta.layers) {
                const layerInfo = await fetchJson(`${svc.url}/${lyr.id}?f=json`);
                let geojson = null;
                // Only try to fetch features for FeatureLayer or Table
                if (layerInfo && (layerInfo.type === 'Feature Layer' || layerInfo.type === 'Table')) {
                    const qUrl = `${svc.url}/${lyr.id}/query?where=1=1&outFields=*&f=geojson`;
                    geojson = await fetchGeoJson(qUrl);
                }
                layersData.push({
                    id: lyr.id,
                    name: lyr.name,
                    info: layerInfo,
                    geojson: geojson
                });
            }
        }
        const out = {
            service: svc,
            layersMeta,
            legend,
            layersData
        };
        fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
        console.log(`Saved: ${outFile}`);
    }
    console.log('Done!');
})();