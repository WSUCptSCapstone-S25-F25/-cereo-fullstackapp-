export function filterUploadPanelData({ services, serviceLayers, searchType, keyword }) {
    if (!keyword) return null; // Show all if no keyword

    const lowerKeyword = keyword.toLowerCase();

    // Helper to check if a string contains the keyword
    const matches = (str) => str && str.toLowerCase().includes(lowerKeyword);

    // Filter logic
    let filteredFolders = {};
    let expandedFolders = new Set();
    let expandedServices = new Set();

    // Track which items matched the keyword for bold highlighting
    let matchedFolderNames = new Set();
    let matchedServiceKeys = new Set();
    let matchedLayerIds = {};  // { serviceKey: Set of layer ids }

    services.forEach(service => {
        const folder = service.folder || 'Root';
        const layers = serviceLayers[service.key] || [];

        let folderMatch = matches(folder);
        let serviceMatch = matches(service.label);

        let matchedLayers = [];
        if (searchType === 'layer') {
            matchedLayers = layers.filter(layer => matches(layer.name));
        } else {
            matchedLayers = layers;
        }

        let showService = false;
        if (searchType === 'folder' && folderMatch) {
            showService = true;
            expandedFolders.add(folder);
            matchedFolderNames.add(folder);
        }
        if (searchType === 'service' && serviceMatch) {
            showService = true;
            expandedFolders.add(folder);
            expandedServices.add(service.key);
            matchedServiceKeys.add(service.key);
        }
        if (searchType === 'layer' && matchedLayers.length > 0) {
            showService = true;
            expandedFolders.add(folder);
            expandedServices.add(service.key);
            matchedLayerIds[service.key] = new Set(matchedLayers.map(l => l.id));
        }
        if (searchType === 'any') {
            if (folderMatch) matchedFolderNames.add(folder);
            if (serviceMatch) matchedServiceKeys.add(service.key);
            const layersMatchingKeyword = layers.filter(l => matches(l.name));
            if (layersMatchingKeyword.length > 0) {
                matchedLayerIds[service.key] = new Set(layersMatchingKeyword.map(l => l.id));
            }
            if (folderMatch || serviceMatch || layersMatchingKeyword.length > 0) {
                showService = true;
                if (folderMatch) expandedFolders.add(folder);
                if (serviceMatch || layersMatchingKeyword.length > 0) {
                    expandedFolders.add(folder);
                    expandedServices.add(service.key);
                }
            }
        }

        if (showService) {
            filteredFolders[folder] = filteredFolders[folder] || [];
            filteredFolders[folder].push({
                ...service,
                layers: searchType === 'layer' ? matchedLayers : layers
            });
        }
    });

    return { filteredFolders, expandedFolders, expandedServices, matchedFolderNames, matchedServiceKeys, matchedLayerIds, keyword: lowerKeyword };
}