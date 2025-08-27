import mapboxgl from 'mapbox-gl';
import { AQ_SERVICE_URL } from './arcgisDataUtils';

// Handler refs for event cleanup
export const handlerRefs = {};

export function addArcgisVectorLayer(map, layer, showArcgisPopup) {
    const sourceId = `arcgis-vector-source-${layer.id}`;
    const fillLayerId = `arcgis-vector-layer-${layer.id}`;
    const lineLayerId = `${fillLayerId}-outline`;

    // Remove if already exists
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // Remove previous event listeners to prevent duplicates
    const refs = handlerRefs[layer.id];
    if (refs) {
        map.off('click', fillLayerId, refs.handleArcgisPopup);
        map.off('mouseenter', fillLayerId, refs.handleCursorPointer);
        map.off('mouseleave', fillLayerId, refs.handleCursorDefault);
        map.off('click', lineLayerId, refs.handleArcgisPopup);
        map.off('mouseenter', lineLayerId, refs.handleCursorPointer);
        map.off('mouseleave', lineLayerId, refs.handleCursorDefault);
    }

    // ArcGIS FeatureServer GeoJSON endpoint
    const geojsonUrl = `${AQ_SERVICE_URL}/${layer.id}/query?where=1=1&outFields=*&f=geojson`;

    // Add source
    map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonUrl
    });

    // Add fully transparent fill layer for click detection
    map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
            'fill-color': 'rgba(0,0,0,0)',
            'fill-opacity': 0
        }
    });

    // Add fully transparent line layer for click detection
    map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
            'line-color': 'rgba(0,0,0,0)',
            'line-width': 1
        }
    });

    // Define handlers and store them in the ref
    const handleArcgisPopup = (e) => showArcgisPopup(e, layer);
    const handleCursorPointer = () => { map.getCanvas().style.cursor = 'pointer'; };
    const handleCursorDefault = () => { map.getCanvas().style.cursor = ''; };
    handlerRefs[layer.id] = { handleArcgisPopup, handleCursorPointer, handleCursorDefault };

    // Add event listeners
    map.on('click', fillLayerId, handleArcgisPopup);
    map.on('mouseenter', fillLayerId, handleCursorPointer);
    map.on('mouseleave', fillLayerId, handleCursorDefault);

    map.on('click', lineLayerId, handleArcgisPopup);
    map.on('mouseenter', lineLayerId, handleCursorPointer);
    map.on('mouseleave', lineLayerId, handleCursorDefault);
}

export async function showArcgisPopup(e, layer) {
    const feature = e.features[0];
    let layerMeta = {};
    try {
        const resp = await fetch(`${AQ_SERVICE_URL}/${layer.id}?f=json`);
        layerMeta = await resp.json();
    } catch (err) {
        layerMeta = {};
    }
    const layerName = layerMeta.name || layer.name || "Layer";
    const layerDescription = layerMeta.description || "";

    // Collapse logic for long descriptions
    const descShort = layerDescription.length > 120 ? layerDescription.slice(0, 120) + "..." : layerDescription;
    const hasLongDesc = layerDescription.length > 120;
    const descId = `desc-${layer.id}-${feature.properties.OBJECTID || Math.floor(Math.random()*100000)}`;

    let html = `
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="margin:0;font-size:1.1em;">${layerName}</h3>
      <button onclick="this.closest('.mapboxgl-popup').remove()" style="background:none;border:none;font-size:1.3em;cursor:pointer;">&times;</button>
    </div>
    ${layerDescription ? `
      <div style="font-size:0.95em;color:#444;margin-bottom:6px;">
        <span id="${descId}">${descShort}</span>
        ${hasLongDesc ? `<a href="#" id="${descId}-toggle" style="margin-left:8px;font-size:0.95em;">Show more</a>` : ""}
      </div>
    ` : ""}
    <table>
      <tbody>
        ${Object.entries(feature.properties).map(([key, value]) =>
          `<tr>
            <td style="font-weight:bold;padding-right:6px;vertical-align:top;">${key}</td>
            <td style="word-break:break-word;overflow-wrap:anywhere;">${String(value)}</td>
          </tr>`
        ).join('')}
      </tbody>
    </table>
  </div>
`;

    const popup = new mapboxgl.Popup({ offset: 20, closeButton: true })
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(e.target._map || e.target);

    // Add collapse/expand logic after popup is added to DOM
    if (hasLongDesc) {
        setTimeout(() => {
            const descSpan = document.getElementById(descId);
            const toggleLink = document.getElementById(`${descId}-toggle`);
            let expanded = false;
            if (descSpan && toggleLink) {
                toggleLink.onclick = function(ev) {
                    ev.preventDefault();
                    expanded = !expanded;
                    descSpan.textContent = expanded ? layerDescription : descShort;
                    toggleLink.textContent = expanded ? "Show less" : "Show more";
                };
            }
        }, 100);
    }
}