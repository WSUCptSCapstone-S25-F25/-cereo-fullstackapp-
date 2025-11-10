export function filterRemovedServicesData({ services, searchType, keyword }) {
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
        const layers = service.layers_removed || [];

        let folderMatch = matches(folder);
        let serviceMatch = matches(service.label);

        let matchedLayers = [];
        if (searchType === 'layer') {
            // Search in layer names
            matchedLayers = layers.filter(layer => {
                if (typeof layer === 'string') {
                    return matches(layer);
                } else if (layer && layer.name) {
                    return matches(layer.name);
                }
                return false;
            });
        } else {
            matchedLayers = layers;
        }

        let showService = false;
        
        // Determine if service should be shown based on search type
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
        
        if (searchType === 'any') {
            const hasLayerMatch = layers.some(layer => {
                if (typeof layer === 'string') {
                    return matches(layer);
                } else if (layer && layer.name) {
                    return matches(layer.name);
                }
                return false;
            });
            
            if (folderMatch || serviceMatch || hasLayerMatch) {
                showService = true;
                if (folderMatch) expandedFolders.add(folder);
                if (serviceMatch || hasLayerMatch) {
                    expandedFolders.add(folder);
                    expandedServices.add(service.key);
                }
            }
        }

        // Additional search in service metadata
        if (!showService && searchType === 'any') {
            // Check service state
            if (matches(service.state)) {
                showService = true;
                expandedFolders.add(folder);
            }
            
            // Check service URL
            if (matches(service.url)) {
                showService = true;
                expandedFolders.add(folder);
            }
            
            // Check who removed it
            if (service.removed_by && matches(service.removed_by)) {
                showService = true;
                expandedFolders.add(folder);
            }
        }

        if (showService) {
            filteredFolders[folder] = filteredFolders[folder] || [];
            filteredFolders[folder].push({
                ...service,
                layers_removed: searchType === 'layer' ? matchedLayers : layers
            });
        }
    });

    return { filteredFolders, expandedFolders, expandedServices };
}


export function highlightSearchTerm(text, keyword) {
    if (!text || !keyword) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}