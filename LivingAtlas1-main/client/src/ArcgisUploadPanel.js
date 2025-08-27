import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import mapboxgl from 'mapbox-gl';
import { addArcgisVectorLayer, handlerRefs } from './arcgisVectorUtils';
import { showArcgisPopup } from './arcgisPopupUtils';
import {
    fetchArcgisLayers,
    fetchArcgisLegend,
    getArcgisTileUrl,
    AQ_SERVICE_URL
} from './arcgisDataUtils';

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
            fetchArcgisLayers()
                .then(layers => {
                    setArcgisLayers(prevLayers => {
                        if (JSON.stringify(prevLayers) !== JSON.stringify(layers)) {
                            setCheckedArcgisLayerIds([]);
                        }
                        return layers;
                    });
                });
            fetchArcgisLegend()
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
                getArcgisTileUrl(layerIds)
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
                'raster-opacity': 0.4
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
            >
                {folderExpanded ? "▼" : "►"} Authoritative
            </div>
            {folderExpanded && (
                <div style={{ marginLeft: 18 }}>
                    <div
                        className="upload-item"
                        onClick={() => setItemExpanded(v => !v)}
                    >
                        <span>
                            {itemExpanded ? "▼" : "►"} AQ (Air Quality)
                        </span>
                        <button
                            className={propArcgisLayerAdded ? "remove-btn" : "add-btn"}
                            onClick={e => {
                                e.stopPropagation();
                                if (propArcgisLayerAdded) {
                                    removeArcgisLayer();
                                } else {
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
                                <label className="select-all-label">
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
                                                        className="legend-img"
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