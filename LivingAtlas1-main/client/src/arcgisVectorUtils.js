import mapboxgl from 'mapbox-gl';

// Handler refs for event cleanup
export const handlerRefs = {};

// Track currently hovered feature per source for hover effects
const hoveredFeatures = {};

/**
 * Add a vector layer for any ArcGIS service.
 * @param {mapboxgl.Map} map
 * @param {Object} layer - Should include .id and .serviceUrl
 * @param {Function} showArcgisPopup
 */
export function addArcgisVectorLayer(map, layer, showArcgisPopup) {
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
        paint: {
            'fill-color': ['case', ['boolean', ['feature-state', 'hover'], false], 'rgba(25, 118, 210, 0.25)', 'rgba(0,0,0,0)'],
            'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0],
            'fill-outline-color': ['case', ['boolean', ['feature-state', 'hover'], false], 'rgba(25, 118, 210, 0.8)', 'rgba(0,0,0,0)']
        },
        filter: ['==', '$type', 'Polygon']
    });

    // Add line layer for lines with hover highlight
    map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
            'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], 'rgba(25, 118, 210, 0.8)', 'rgba(0,0,0,0)'],
            'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 4, 8]
        },
        filter: ['==', '$type', 'LineString']
    });

    // Add circle layer for points with hover highlight
    map.addLayer({
        id: circleLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
            'circle-radius': ['case', ['boolean', ['feature-state', 'hover'], false], 8, 12],
            'circle-color': ['case', ['boolean', ['feature-state', 'hover'], false], 'rgba(25, 118, 210, 0.5)', 'rgba(0,0,0,0)'],
            'circle-stroke-color': ['case', ['boolean', ['feature-state', 'hover'], false], 'rgba(25, 118, 210, 0.9)', 'rgba(0,0,0,0)'],
            'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0]
        },
        filter: ['==', '$type', 'Point']
    });

    // Hover helper: clear previous hover state and set new one
    function setHover(layerId, e) {
        // Clear previous hovered feature for this source
        if (hoveredFeatures[sourceId] != null) {
            map.setFeatureState({ source: sourceId, id: hoveredFeatures[sourceId] }, { hover: false });
        }
        if (e.features.length > 0) {
            hoveredFeatures[sourceId] = e.features[0].id;
            map.setFeatureState({ source: sourceId, id: e.features[0].id }, { hover: true });
        }
        map.getCanvas().style.cursor = 'pointer';
    }

    function clearHover() {
        if (hoveredFeatures[sourceId] != null) {
            map.setFeatureState({ source: sourceId, id: hoveredFeatures[sourceId] }, { hover: false });
            hoveredFeatures[sourceId] = null;
        }
        map.getCanvas().style.cursor = '';
    }

    // Define handlers
    const handleArcgisPopup = (e) => showArcgisPopup(e, layer);
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