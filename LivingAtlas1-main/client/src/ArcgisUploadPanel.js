import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function ArcgisUploadPanel({
    isOpen,
    onClose,
    mapInstance,
}) {
    const [folderExpanded, setFolderExpanded] = useState(false);
    const [itemExpanded, setItemExpanded] = useState(false);
    const [arcgisLayers, setArcgisLayers] = useState([]);
    const [arcgisLegend, setArcgisLegend] = useState(null);
    const [arcgisLayerAdded, setArcgisLayerAdded] = useState(false);
    const [checkedArcgisLayerIds, setCheckedArcgisLayerIds] = useState([]);

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
        setArcgisLayerAdded(true);
    };

    // Remove ArcGIS Layer
    const removeArcgisLayer = () => {
        const map = mapInstance();
        if (!map) return;
        if (map.getLayer('arcgis-raster-layer')) map.removeLayer('arcgis-raster-layer');
        if (map.getSource('arcgis-raster')) map.removeSource('arcgis-raster');
        setArcgisLayerAdded(false);
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
        if (arcgisLayerAdded) {
            addArcgisLayer(newChecked);
        }
    };

    const handleSelectAll = () => {
        if (checkedArcgisLayerIds.length === arcgisLayers.length) {
            setCheckedArcgisLayerIds([]);
            if (arcgisLayerAdded) removeArcgisLayer();
        } else {
            const allIds = arcgisLayers.map(l => l.id);
            setCheckedArcgisLayerIds(allIds);
            if (arcgisLayerAdded) addArcgisLayer(allIds);
        }
    };

    // Effect for checked layers
    useEffect(() => {
        if (checkedArcgisLayerIds.length === 0) {
            if (arcgisLayerAdded) removeArcgisLayer();
        } else {
            if (!arcgisLayerAdded) {
                addArcgisLayer(checkedArcgisLayerIds);
            } else {
                addArcgisLayer(checkedArcgisLayerIds);
            }
        }
        // eslint-disable-next-line
    }, [checkedArcgisLayerIds]);

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
                                background: arcgisLayerAdded ? "#e57373" : "#1976d2",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "2px 12px",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                            onClick={e => {
                                e.stopPropagation();
                                if (arcgisLayerAdded) {
                                    removeArcgisLayer();
                                } else {
                                    // Select all layers when adding
                                    const allIds = arcgisLayers.map(l => l.id);
                                    setCheckedArcgisLayerIds(allIds);
                                    addArcgisLayer(allIds);
                                }
                            }}
                        >
                            {arcgisLayerAdded ? "Remove" : "Add"}
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