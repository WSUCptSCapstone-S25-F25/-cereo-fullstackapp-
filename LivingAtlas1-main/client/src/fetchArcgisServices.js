// Node script to crawl ArcGIS REST "services" directories and save MapServer/FeatureServer endpoints
// Usage (from client/src): node fetchArcgisServices.js

const fs = require('fs');
const path = require('path');

// Lazy import to work in Node without ESM
const fetchDynamic = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// REST server roots
const SERVERS = {
  WA: 'https://gis.ecology.wa.gov/serverext/rest/services/',
  ID: 'https://gis.idwr.idaho.gov/hosting/rest/services/',
  OR: 'https://navigator.state.or.us/arcgis/rest/services/'
};

// Output files (kept next to existing arcgis_services.json for WA-only)
const OUTPUT_FILES = {
  WA: path.join(__dirname, 'arcgis_services_wa.json'),
  ID: path.join(__dirname, 'arcgis_services_id.json'),
  OR: path.join(__dirname, 'arcgis_services_or.json')
};

// Recursively fetch folders/services under a base URL
async function fetchServicesRecursive(baseUrl, currentPath = '') {
  const url = baseUrl + currentPath + (currentPath.endsWith('/') ? '' : '') + '?f=json';
  const res = await fetchDynamic(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();

  let services = [];

  // Recurse into subfolders
  if (Array.isArray(data.folders)) {
    for (const sub of data.folders) {
      const subPath = (currentPath ? currentPath : '') + sub + '/';
      const subServices = await fetchServicesRecursive(baseUrl, subPath);
      services = services.concat(subServices);
    }
  }

  // Collect services in this folder
  if (Array.isArray(data.services)) {
    for (const svc of data.services) {
      // svc.name can be like "Folder/Service" or just "Service" depending on endpoint
      const nameParts = svc.name.split('/');
      const serviceName = nameParts[nameParts.length - 1];

      // Determine folder label for record
      const folderLabel = currentPath ? currentPath.replace(/\/$/, '') : (nameParts.length > 1 ? nameParts.slice(0, -1).join('/') : 'Root');

      if (svc.type === 'MapServer' || svc.type === 'FeatureServer') {
        services.push({
          key: `${(folderLabel || 'Root')}_${serviceName}_${svc.type}`.replace(/[^\w]/g, '_'),
          label: `${serviceName} (${svc.type})`,
          url: `${baseUrl}${currentPath}${serviceName}/${svc.type}`,
          folder: folderLabel || 'Root',
          type: svc.type
        });
      }
    }
  }

  return services;
}

async function fetchAndSave(serverKey) {
  const baseUrl = SERVERS[serverKey];
  const outFile = OUTPUT_FILES[serverKey];

  console.log(`[fetchArcgisServices] Fetching ${serverKey} from ${baseUrl}`);
  const list = await fetchServicesRecursive(baseUrl, '');
  // Sort for stable diffs
  list.sort((a, b) => a.folder.localeCompare(b.folder) || a.label.localeCompare(b.label));

  fs.writeFileSync(outFile, JSON.stringify(list, null, 2));
  console.log(`[fetchArcgisServices] Saved ${list.length} services to ${path.basename(outFile)}`);
}

(async () => {
  try {
    await fetchAndSave('WA'); // Washington
    await fetchAndSave('ID'); // Idaho
    await fetchAndSave('OR'); // Oregon

    console.log('[fetchArcgisServices] Done.');
    console.log('Outputs:');
    console.log(' - arcgis_services_wa.json (Washington)');
    console.log(' - arcgis_services_id.json (Idaho)');
    console.log(' - arcgis_services_or.json (Oregon)');
    console.log('Note: arcgis_services.json remains your Washington-only legacy file.');
  } catch (err) {
    console.error('[fetchArcgisServices] Error:', err);
    process.exit(1);
  }
})();