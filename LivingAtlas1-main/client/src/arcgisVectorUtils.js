import mapboxgl from 'mapbox-gl';

// Handler refs for event cleanup
export const handlerRefs = {};

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
        map.off('mouseenter', fillLayerId, refs.handleCursorPointer);
        map.off('mouseleave', fillLayerId, refs.handleCursorDefault);
        map.off('click', lineLayerId, refs.handleArcgisPopup);
        map.off('mouseenter', lineLayerId, refs.handleCursorPointer);
        map.off('mouseleave', lineLayerId, refs.handleCursorDefault);
        map.off('click', circleLayerId, refs.handleArcgisPopup);
        map.off('mouseenter', circleLayerId, refs.handleCursorPointer);
        map.off('mouseleave', circleLayerId, refs.handleCursorDefault);
    }

    // ArcGIS FeatureServer GeoJSON endpoint
    const geojsonUrl = `${layer.serviceUrl}/${layer.id}/query?where=1=1&outFields=*&f=geojson`;

    // Add source
    map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonUrl
    });

    // Add fill layer for polygons
    map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
            'fill-color': 'rgba(0,0,0,0)',
            'fill-opacity': 0
        },
        filter: ['==', '$type', 'Polygon']
    });

    // Add line layer for lines
    map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
            'line-color': 'rgba(0,0,0,0)',
            'line-width': 8 // make it easier to click
        },
        filter: ['==', '$type', 'LineString']
    });

    // Add circle layer for points
    map.addLayer({
        id: circleLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
            'circle-radius': 12, // make it easier to click
            'circle-color': 'rgba(0,0,0,0)'
        },
        filter: ['==', '$type', 'Point']
    });

    // Define handlers and store them in the ref
    const handleArcgisPopup = (e) => showArcgisPopup(e, layer);
    const handleCursorPointer = () => { map.getCanvas().style.cursor = 'pointer'; };
    const handleCursorDefault = () => { map.getCanvas().style.cursor = ''; };
    handlerRefs[`${serviceKey}-${layer.id}`] = { handleArcgisPopup, handleCursorPointer, handleCursorDefault };

    // Add event listeners for all three geometry types
    map.on('click', fillLayerId, handleArcgisPopup);
    map.on('mouseenter', fillLayerId, handleCursorPointer);
    map.on('mouseleave', fillLayerId, handleCursorDefault);

    map.on('click', lineLayerId, handleArcgisPopup);
    map.on('mouseenter', lineLayerId, handleCursorPointer);
    map.on('mouseleave', lineLayerId, handleCursorDefault);

    map.on('click', circleLayerId, handleArcgisPopup);
    map.on('mouseenter', circleLayerId, handleCursorPointer);
    map.on('mouseleave', circleLayerId, handleCursorDefault);
}