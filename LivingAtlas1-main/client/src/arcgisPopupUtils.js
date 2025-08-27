import mapboxgl from 'mapbox-gl';

/**
 * Show a popup for a feature from any ArcGIS service.
 * @param {Object} e - Mapbox event
 * @param {Object} layer - Layer object (should include .id and .serviceUrl)
 */
export async function showArcgisPopup(e, layer) {
    const feature = e.features[0];
    let layerMeta = {};
    const serviceUrl = layer.serviceUrl; // must be passed in layer object

    try {
        const resp = await fetch(`${serviceUrl}/${layer.id}?f=json`);
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