import mapboxgl from 'mapbox-gl';

// Handler refs for event cleanup
export const handlerRefs = {};

// Track currently hovered feature per source for hover effects
const hoveredFeatures = {};

// Track clicked/pinned feature per source (stays highlighted while popup is open)
const pinnedFeatures = {};

/**
 * Add a vector layer for any ArcGIS service.
 * @param {mapboxgl.Map} map
 * @param {Object} layer - Should include .id and .serviceUrl
 * @param {Function} showArcgisPopup
 */
export function addArcgisVectorLayer(map, layer, showArcgisPopup, { minzoom, maxzoom } = {}) {
    const serviceKey = layer.serviceKey || '';
    const sourceId = `arcgis-vector-source-${serviceKey}-${layer.id}`;
    const fillLayerId = `arcgis-vector-layer-${serviceKey}-${layer.id}`;
    const lineLayerId = `${fillLayerId}-outline`;
    const circleLayerId = `${fillLayerId}-circle`;

    // Remove if already exists
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
    if (map.getLayer(circleLayerId)) map.removeLayer(circleLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // Remove previous event listeners to prevent duplicates
    const refs = handlerRefs[`${serviceKey}-${layer.id}`];
    if (refs) {
        map.off('click', fillLayerId, refs.handleArcgisPopup);
        map.off('mousemove', fillLayerId, refs.handleFillMouseMove);
        map.off('mouseleave', fillLayerId, refs.handleFillMouseLeave);
        map.off('click', lineLayerId, refs.handleArcgisPopup);
        map.off('mousemove', lineLayerId, refs.handleLineMouseMove);
        map.off('mouseleave', lineLayerId, refs.handleLineMouseLeave);
        map.off('click', circleLayerId, refs.handleArcgisPopup);
        map.off('mousemove', circleLayerId, refs.handleCircleMouseMove);
        map.off('mouseleave', circleLayerId, refs.handleCircleMouseLeave);
    }

    // ArcGIS FeatureServer GeoJSON endpoint
    const geojsonUrl = `${layer.serviceUrl}/${layer.id}/query?where=1=1&outFields=*&f=geojson`;

    // Add source with generateId for feature-state hover support
    map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonUrl,
        generateId: true
    });

    // Add fill layer for polygons with hover highlight
    map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        ...(minzoom != null && { minzoom }),
        ...(maxzoom != null && { maxzoom }),
        paint: {
            'fill-color': ['case', ['boolean', ['feature-state', 'hover'], false], 'rgba(25, 118, 210, 0.35)', 'rgba(25, 118, 210, 0.15)'],
            'fill-opacity': 1,
            'fill-outline-color': ['case', ['boolean', ['feature-state', 'hover'], false], 'rgba(25, 118, 210, 0.8)', 'rgba(25, 118, 210, 0.5)']
        },
        filter: ['==', '$type', 'Polygon']
    });

    // Add line layer for lines with hover highlight
    map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        ...(minzoom != null && { minzoom }),
        ...(maxzoom != null && { maxzoom }),
        paint: {
            'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], 'rgba(25, 118, 210, 0.9)', 'rgba(25, 118, 210, 0.6)'],
            'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 4, 2]
        },
        filter: ['==', '$type', 'LineString']
    });

    // Add circle layer for points with hover highlight
    map.addLayer({
        id: circleLayerId,
        type: 'circle',
        source: sourceId,
        ...(minzoom != null && { minzoom }),
        ...(maxzoom != null && { maxzoom }),
        paint: {
            'circle-radius': ['case', ['boolean', ['feature-state', 'hover'], false], 8, 5],
            'circle-color': ['case', ['boolean', ['feature-state', 'hover'], false], 'rgba(25, 118, 210, 0.5)', 'rgba(25, 118, 210, 0.3)'],
            'circle-stroke-color': ['case', ['boolean', ['feature-state', 'hover'], false], 'rgba(25, 118, 210, 0.9)', 'rgba(25, 118, 210, 0.6)'],
            'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 1.5, 0.5]
        },
        filter: ['==', '$type', 'Point']
    });

    // Hover helper: clear previous hover state and set new one
    function setHover(layerId, e) {
        // Clear previous hovered feature (but not pinned one)
        if (hoveredFeatures[sourceId] != null && hoveredFeatures[sourceId] !== pinnedFeatures[sourceId]) {
            map.setFeatureState({ source: sourceId, id: hoveredFeatures[sourceId] }, { hover: false });
        }
        if (e.features.length > 0) {
            hoveredFeatures[sourceId] = e.features[0].id;
            map.setFeatureState({ source: sourceId, id: e.features[0].id }, { hover: true });
        }
        map.getCanvas().style.cursor = 'pointer';
    }

    function clearHover() {
        // Don't clear hover on pinned feature
        if (hoveredFeatures[sourceId] != null && hoveredFeatures[sourceId] !== pinnedFeatures[sourceId]) {
            map.setFeatureState({ source: sourceId, id: hoveredFeatures[sourceId] }, { hover: false });
        }
        hoveredFeatures[sourceId] = null;
        map.getCanvas().style.cursor = '';
    }

    function pinFeature(featureId) {
        pinnedFeatures[sourceId] = featureId;
        if (featureId != null) {
            map.setFeatureState({ source: sourceId, id: featureId }, { hover: true });
        }
    }

    function unpinFeature() {
        const pinnedId = pinnedFeatures[sourceId];
        if (pinnedId != null) {
            // Only clear if not currently being hovered
            if (hoveredFeatures[sourceId] !== pinnedId) {
                map.setFeatureState({ source: sourceId, id: pinnedId }, { hover: false });
            }
            pinnedFeatures[sourceId] = null;
        }
    }

    // Define handlers
    const handleArcgisPopup = (e) => {
        // Prevent duplicate popup when click hits multiple layers for the same feature
        if (e.originalEvent._arcgisPopupHandled) return;
        e.originalEvent._arcgisPopupHandled = true;

        const feature = e.features[0];
        if (feature) {
            pinFeature(feature.id);
        }
        const popup = showArcgisPopup(e, layer);
        // Listen for popup close to unpin feature
        if (popup && typeof popup.then === 'function') {
            // showArcgisPopup is async, handle the returned promise
            popup.then(p => {
                if (p && p.on) {
                    p.on('close', () => unpinFeature());
                }
            });
        } else if (popup && popup.on) {
            popup.on('close', () => unpinFeature());
        }
    };
    const handleFillMouseMove = (e) => setHover(fillLayerId, e);
    const handleFillMouseLeave = () => clearHover();
    const handleLineMouseMove = (e) => setHover(lineLayerId, e);
    const handleLineMouseLeave = () => clearHover();
    const handleCircleMouseMove = (e) => setHover(circleLayerId, e);
    const handleCircleMouseLeave = () => clearHover();

    // Store handler refs for cleanup
    handlerRefs[`${serviceKey}-${layer.id}`] = {
        handleArcgisPopup,
        handleFillMouseMove, handleFillMouseLeave,
        handleLineMouseMove, handleLineMouseLeave,
        handleCircleMouseMove, handleCircleMouseLeave
    };

    // Add event listeners for all three geometry types
    map.on('click', fillLayerId, handleArcgisPopup);
    map.on('mousemove', fillLayerId, handleFillMouseMove);
    map.on('mouseleave', fillLayerId, handleFillMouseLeave);

    map.on('click', lineLayerId, handleArcgisPopup);
    map.on('mousemove', lineLayerId, handleLineMouseMove);
    map.on('mouseleave', lineLayerId, handleLineMouseLeave);

    map.on('click', circleLayerId, handleArcgisPopup);
    map.on('mousemove', circleLayerId, handleCircleMouseMove);
    map.on('mouseleave', circleLayerId, handleCircleMouseLeave);
}
/**
 * Apply an OBJECTID-based filter to existing vector layers.
 * Only features whose OBJECTID is in objectIds will be shown.
 */
export function updateArcgisVectorLayerFilter(map, serviceKey, layerId, objectIds) {
    const baseId = `arcgis-vector-layer-${serviceKey}-${layerId}`;
    const fillId = baseId;
    const lineId = `${baseId}-outline`;
    const circleId = `${baseId}-circle`;
    if (!objectIds || objectIds.length === 0) {
        const hide = ['==', ['literal', 1], ['literal', 0]];
        if (map.getLayer(fillId)) map.setFilter(fillId, hide);
        if (map.getLayer(lineId)) map.setFilter(lineId, hide);
        if (map.getLayer(circleId)) map.setFilter(circleId, hide);
        return;
    }
    const objFilter = ['in', ['get', 'OBJECTID'], ['literal', objectIds]];
    if (map.getLayer(fillId)) map.setFilter(fillId, ['all', ['==', '$type', 'Polygon'], objFilter]);
    if (map.getLayer(lineId)) map.setFilter(lineId, ['all', ['==', '$type', 'LineString'], objFilter]);
    if (map.getLayer(circleId)) map.setFilter(circleId, ['all', ['==', '$type', 'Point'], objFilter]);
}

/**
 * Reset vector layer filters to default (show all features by geometry type).
 */
export function resetArcgisVectorLayerFilter(map, serviceKey, layerId) {
    const baseId = `arcgis-vector-layer-${serviceKey}-${layerId}`;
    const fillId = baseId;
    const lineId = `${baseId}-outline`;
    const circleId = `${baseId}-circle`;
    if (map.getLayer(fillId)) map.setFilter(fillId, ['==', '$type', 'Polygon']);
    if (map.getLayer(lineId)) map.setFilter(lineId, ['==', '$type', 'LineString']);
    if (map.getLayer(circleId)) map.setFilter(circleId, ['==', '$type', 'Point']);
}