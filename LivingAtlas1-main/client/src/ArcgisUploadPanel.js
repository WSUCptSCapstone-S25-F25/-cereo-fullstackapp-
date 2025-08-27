import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import mapboxgl from 'mapbox-gl';
import { addArcgisVectorLayer, showArcgisPopup, handlerRefs } from './arcgisVectorUtils';

const AUTHORITATIVE_BASE = "https://gis.ecology.wa.gov/serverext/rest/services/Authoritative";

function ArcgisUploadPanel({
    isOpen,
    onClose,
    mapInstance,
    arcgisLayerAdded: propArcgisLayerAdded,
    setArcgisLayerAdded: setPropArcgisLayerAdded,
}) {
    const [folderExpanded, setFolderExpanded] = useState(false);
    const [itemExpanded, setItemExpanded] = useState(false);
    const [arcgisLayers, setArcgisLayers] = useState([]);
    const [arcgisLegend, setArcgisLegend] = useState(null);
    const [checkedArcgisLayerIds, setCheckedArcgisLayerIds] = useState([]);
    const [authoritativeServices, setAuthoritativeServices] = useState([]);
    const [serviceLayers, setServiceLayers] = useState({}); // { serviceName: [layers] }
    const [serviceLegends, setServiceLegends] = useState({}); // { serviceName: legend }
    const handlerRefs = React.useRef({});

    // Fetch layers and legend
    useEffect(() => {
        if (isOpen) {
            const SERVICE_URL = "https://gis.ecology.wa.gov/serverext/rest/services/Authoritative/AQ/MapServer";
            fetch(`${SERVICE_URL}/layers?f=json`)
                .then(res => res.json())
                .then(data => {
                    setArcgisLayers(prevLayers => {
                        if (JSON.stringify(prevLayers) !== JSON.stringify(data.layers || [])) {
                            setCheckedArcgisLayerIds([]);
                        }
                        return data.layers || [];
                    });
                });
            fetch(`${SERVICE_URL}/legend?f=json`)
                .then(res => res.json())
                .then(data => setArcgisLegend(data));
        }
    }, [isOpen]);

    // Add ArcGIS Layer
    const addArcgisLayer = (layerIds = checkedArcgisLayerIds) => {
        const map = mapInstance();
        if (!map) return;

        if (map.getLayer('arcgis-raster-layer')) map.removeLayer('arcgis-raster-layer');
        if (map.getSource('arcgis-raster')) map.removeSource('arcgis-raster');

        let layersParam = '';
        if (layerIds.length > 0) {
            layersParam = '&layers=show:' + layerIds.join(',');
        }

        map.addSource('arcgis-raster', {
            type: 'raster',
            tiles: [
                `https://gis.ecology.wa.gov/serverext/rest/services/Authoritative/AQ/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=true&f=image${layersParam}`
            ],
            tileSize: 256,
            minzoom: 6,
            maxzoom: 12
        });
        map.addLayer({
            id: 'arcgis-raster-layer',
            type: 'raster',
            source: 'arcgis-raster',
            paint: {
                'raster-opacity': 0.35
            }
        });
        setPropArcgisLayerAdded(true);
    };

    // Remove ArcGIS Layer
    const removeArcgisLayer = () => {
        const map = mapInstance();
        if (!map) return;
        if (map.getLayer('arcgis-raster-layer')) map.removeLayer('arcgis-raster-layer');
        if (map.getSource('arcgis-raster')) map.removeSource('arcgis-raster');
        setPropArcgisLayerAdded(false);
    };

    // Checkbox handlers
    const handleLayerCheckbox = (layerId) => {
        let newChecked;
        if (checkedArcgisLayerIds.includes(layerId)) {
            newChecked = checkedArcgisLayerIds.filter(id => id !== layerId);
        } else {
            newChecked = [...checkedArcgisLayerIds, layerId];
        }
        setCheckedArcgisLayerIds(newChecked);
        if (propArcgisLayerAdded) {
            addArcgisLayer(newChecked);
        }
    };

    const handleSelectAll = () => {
        if (checkedArcgisLayerIds.length === arcgisLayers.length) {
            setCheckedArcgisLayerIds([]);
            if (propArcgisLayerAdded) removeArcgisLayer();
        } else {
            const allIds = arcgisLayers.map(l => l.id);
            setCheckedArcgisLayerIds(allIds);
            if (propArcgisLayerAdded) addArcgisLayer(allIds);
        }
    };

    // Effect for checked layers
    useEffect(() => {
        const map = mapInstance();
        if (!map) return;

        // Remove all vector layers first
        arcgisLayers.forEach(layer => {
            const layerId = `arcgis-vector-layer-${layer.id}`;
            const outlineId = `${layerId}-outline`;
            const sourceId = `arcgis-vector-source-${layer.id}`;
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getLayer(outlineId)) map.removeLayer(outlineId);
            if (map.getSource(sourceId)) map.removeSource(sourceId);
        });

        // Add vector layers for checked layers
        checkedArcgisLayerIds.forEach(id => {
            const layer = arcgisLayers.find(l => l.id === id);
            if (layer) addArcgisVectorLayer(map, layer, showArcgisPopup);
        });

        // Raster logic (as before)
        if (checkedArcgisLayerIds.length === 0) {
            if (propArcgisLayerAdded) removeArcgisLayer();
        } else {
            if (!propArcgisLayerAdded) {
                addArcgisLayer(checkedArcgisLayerIds);
            } else {
                addArcgisLayer(checkedArcgisLayerIds);
            }
        }
        // eslint-disable-next-line
    }, [checkedArcgisLayerIds, arcgisLegend]);

    // Helper to show popup
    async function showArcgisPopup(e, layer) {
        const feature = e.features[0];
        let layerMeta = {};
        try {
            const resp = await fetch(`https://gis.ecology.wa.gov/serverext/rest/services/Authoritative/AQ/MapServer/${layer.id}?f=json`);
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

    if (!isOpen) return null;

    return (
        <div className="upload-panel">
            <button
                className="upload-panel-close-btn"
                onClick={onClose}
                title="Close"
            >
                &times;
            </button>
            <div
                className="upload-folder"
                onClick={() => setFolderExpanded(v => !v)}
                style={{ cursor: "pointer", fontWeight: "bold", margin: "8px 0" }}
            >
                {folderExpanded ? "▼" : "►"} Authoritative
            </div>
            {folderExpanded && (
                <div style={{ marginLeft: 18 }}>
                    <div
                        className="upload-item"
                        style={{
                            cursor: "pointer",
                            fontWeight: "bold",
                            margin: "6px 0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}
                        onClick={() => setItemExpanded(v => !v)}
                    >
                        <span>
                            {itemExpanded ? "▼" : "►"} AQ (Air Quality)
                        </span>
                        <button
                            style={{
                                marginLeft: "auto",
                                background: propArcgisLayerAdded ? "#e57373" : "#1976d2",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "2px 12px",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                            onClick={e => {
                                e.stopPropagation();
                                if (propArcgisLayerAdded) {
                                    removeArcgisLayer();
                                } else {
                                    // Select all layers when adding
                                    const allIds = arcgisLayers.map(l => l.id);
                                    setCheckedArcgisLayerIds(allIds);
                                    addArcgisLayer(allIds);
                                }
                            }}
                        >
                            {propArcgisLayerAdded ? "Remove" : "Add"}
                        </button>
                    </div>
                    {itemExpanded && (
                        <div style={{ marginLeft: 18 }}>
                            <div style={{ marginBottom: 8 }}>
                                <label style={{ fontWeight: "bold", display: "flex", alignItems: "center", marginBottom: 6 }}>
                                    <input
                                        type="checkbox"
                                        checked={checkedArcgisLayerIds.length === arcgisLayers.length && arcgisLayers.length > 0}
                                        onChange={handleSelectAll}
                                        style={{ marginRight: 8 }}
                                    />
                                    Select All
                                </label>
                                <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                                    {arcgisLayers.map(layer => {
                                        let legendItems = [];
                                        if (arcgisLegend && arcgisLegend.layers) {
                                            const legendLayer = arcgisLegend.layers.find(l => l.layerId === layer.id);
                                            if (legendLayer) legendItems = legendLayer.legend;
                                        }
                                        return (
                                            <li key={layer.id} className="upload-layer-row">
                                                <input
                                                    type="checkbox"
                                                    checked={checkedArcgisLayerIds.includes(layer.id)}
                                                    onChange={() => handleLayerCheckbox(layer.id)}
                                                    style={{ marginRight: 8 }}
                                                />
                                                {legendItems.length > 0 && (
                                                    <img
                                                        src={`data:${legendItems[0].contentType};base64,${legendItems[0].imageData}`}
                                                        alt={legendItems[0].label}
                                                        style={{ width: 20, height: 20, marginRight: 8, verticalAlign: "middle", border: "1px solid #ccc", borderRadius: 3, background: "#fff" }}
                                                    />
                                                )}
                                                <span>{layer.name}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ArcgisUploadPanel;