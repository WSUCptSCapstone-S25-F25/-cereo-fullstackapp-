// Utility functions to show/hide colored area layers on the map

// Mapbox layer IDs for colored areas
const LAYER_IDS = {
    River: 'vector-tileset',
    Watershed: 'watershed-areas-fill', // Change this if your actual watershed layer id is different
    Places: ['urban-areas-fill', 'urban-areas-outline'],
};

/**
 * Set visibility for a single area category.
 * @param {string} category - "River" | "Watershed" | "Places"
 * @param {boolean} visible
 */
export function setAreaVisibility(category, visible) {
    const mapboxMap = window?.atlasMapInstance;
    if (!mapboxMap) return;

    const ids = LAYER_IDS[category];
    if (!ids) return;

    if (Array.isArray(ids)) {
        ids.forEach(id => {
            if (mapboxMap.getLayer(id)) {
                mapboxMap.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
            }
        });
    } else {
        if (mapboxMap.getLayer(ids)) {
            mapboxMap.setLayoutProperty(ids, 'visibility', visible ? 'visible' : 'none');
        }
    }
}

/**
 * Set visibility for all area categories at once.
 * @param {{River: boolean, Watershed: boolean, Places: boolean}} areaVisibility
 */
export function applyAreaVisibility(areaVisibility) {
    Object.entries(areaVisibility).forEach(([category, visible]) => {
        setAreaVisibility(category, visible);
    });
}