export function filterUploadPanelData({ services, serviceLayers, searchType, keyword }) {
    if (!keyword) return null; // Show all if no keyword

    const lowerKeyword = keyword.toLowerCase();

    // Helper to check if a string contains the keyword
    const matches = (str) => str && str.toLowerCase().includes(lowerKeyword);

    // Filter logic
    let filteredFolders = {};
    let expandedFolders = new Set();
    let expandedServices = new Set();

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
        }
        if (searchType === 'service' && serviceMatch) {
            showService = true;
            expandedFolders.add(folder);
            expandedServices.add(service.key);
        }
        if (searchType === 'layer' && matchedLayers.length > 0) {
            showService = true;
            expandedFolders.add(folder);
            expandedServices.add(service.key);
        }
        if (searchType === 'any' && (folderMatch || serviceMatch || matchedLayers.some(l => matches(l.name)))) {
            showService = true;
            if (folderMatch) expandedFolders.add(folder);
            if (serviceMatch || matchedLayers.length > 0) {
                expandedFolders.add(folder);
                expandedServices.add(service.key);
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

    return { filteredFolders, expandedFolders, expandedServices };
}