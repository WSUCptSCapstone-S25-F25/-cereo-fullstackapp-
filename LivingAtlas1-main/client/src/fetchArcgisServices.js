// save as fetchArcgisServices.js
const fs = require('fs');
const BASE_URL = 'https://gis.ecology.wa.gov/serverext/rest/services/';

async function fetchServices(url, folder = '') {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const res = await fetch(url + '?f=json');
    const data = await res.json();
    let services = [];
    if (data.folders) {
        for (const subfolder of data.folders) {
            const subfolderUrl = url + subfolder + '/';
            services = services.concat(await fetchServices(subfolderUrl, folder ? folder + '/' + subfolder : subfolder));
        }
    }
    if (data.services) {
        for (const svc of data.services) {
            if (svc.type === 'MapServer') {
                services.push({
                    key: `${folder}_${svc.name.split('/').pop()}_MapServer`.replace(/[^\w]/g, '_'),
                    label: `${svc.name.split('/').pop()} (MapServer)`,
                    url: `${BASE_URL}${folder ? folder + '/' : ''}${svc.name.split('/').pop()}/MapServer`,
                    folder: folder || 'Root'
                });
            }
        }
    }
    return services;
}

(async () => {
    const allServices = await fetchServices(BASE_URL);
    fs.writeFileSync('arcgis_services.json', JSON.stringify(allServices, null, 2));
    console.log('Saved to ./src/arcgis_services.json');
})();