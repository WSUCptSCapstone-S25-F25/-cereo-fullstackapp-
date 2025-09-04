import React, { useEffect, useState, useRef } from "react";
import { addArcgisVectorLayer } from './arcgisVectorUtils';
import { showArcgisPopup } from './arcgisPopupUtils';
import {
    ARCGIS_SERVICES,
    fetchArcgisLayers,
    fetchArcgisLegend,
    getArcgisTileUrl
} from './arcgisDataUtils';
import { filterUploadPanelData } from './arcgisUploadSearchUtils';

// Group services by folder
const servicesByFolder = {};
ARCGIS_SERVICES.forEach(service => {
    const folder = service.folder || 'Root';
    if (!servicesByFolder[folder]) servicesByFolder[folder] = [];
    servicesByFolder[folder].push(service);
});
const folderNames = Object.keys(servicesByFolder).sort();

function ArcgisUploadPanel({
    isOpen,
    onClose,
    mapInstance,
    arcgisLayerAdded: propArcgisLayerAdded,
    setArcgisLayerAdded: setPropArcgisLayerAdded,
}) {
    const [folderExpanded, setFolderExpanded] = useState(false);
    const [expandedService, setExpandedService] = useState(null);
    const [serviceLayers, setServiceLayers] = useState({}); // { key: [layers] }
    const [serviceLegends, setServiceLegends] = useState({}); // { key: legend }
    const [checkedLayerIds, setCheckedLayerIds] = useState({}); // { key: [layerIds] }
    const [serviceLayerAdded, setServiceLayerAdded] = useState({}); // { key: bool }
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchType, setSearchType] = useState('any'); // 'any', 'folder', 'service', 'layer'
    const [searchResult, setSearchResult] = useState(null);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [expandedServices, setExpandedServices] = useState(new Set());

    // Track previous checkedLayerIds for diffing
    const prevCheckedLayerIds = useRef({});

    // Fetch layers and legends for all services
    useEffect(() => {
        if (!isOpen) return;
        ARCGIS_SERVICES.forEach(service => {
            if (!serviceLayers[service.key]) {
                fetchArcgisLayers(service.url).then(layers => {
                    setServiceLayers(prev => ({ ...prev, [service.key]: layers }));
                    // Default: all unchecked
                    setCheckedLayerIds(prev => ({ ...prev, [service.key]: [] }));
                    setServiceLayerAdded(prev => ({ ...prev, [service.key]: false }));
                });
            }
            if (!serviceLegends[service.key]) {
                fetchArcgisLegend(service.url).then(legend => {
                    setServiceLegends(prev => ({ ...prev, [service.key]: legend }));
                });
            }
        });
        // eslint-disable-next-line
    }, [isOpen]);

    // Add ArcGIS raster layer for a service
    const addArcgisLayer = (service, layerIds) => {
        const map = mapInstance();
        if (!map) return;
        const sourceId = `arcgis-raster-${service.key}`;
        const layerId = `arcgis-raster-layer-${service.key}`;

        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        map.addSource(sourceId, {
            type: 'raster',
            tiles: [
                getArcgisTileUrl(service.url, layerIds)
            ],
            tileSize: 256,
            minzoom: 6,
            maxzoom: 12
        });
        map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: {
                'raster-opacity': 0.5
            }
        });
        setServiceLayerAdded(prev => ({ ...prev, [service.key]: true }));
    };

    // Remove ArcGIS raster layer for a service
    const removeArcgisLayer = (service) => {
        const map = mapInstance();
        if (!map) return;
        const sourceId = `arcgis-raster-${service.key}`;
        const layerId = `arcgis-raster-layer-${service.key}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        setServiceLayerAdded(prev => ({ ...prev, [service.key]: false }));
    };

    // Add/Remove button logic:
    const handleAddRemove = (service, layers) => {
        const allIds = layers.map(l => l.id);
        if (serviceLayerAdded[service.key]) {
            // Remove: uncheck all
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: [] }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: false }));
        } else {
            // Add: check all
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: allIds }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: true }));
        }
    };

    // Select-All logic:
    const handleSelectAll = (service, layers) => {
        const allIds = layers.map(l => l.id);
        const isAllChecked = (checkedLayerIds[service.key] || []).length === allIds.length;
        if (isAllChecked) {
            // Uncheck all
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: [] }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: false }));
        } else {
            // Check all
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: allIds }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: true }));
        }
    };

    // Layer checkbox logic:
    const handleLayerCheckbox = (service, layerId, layers) => {
        setCheckedLayerIds(prev => {
            const prevChecked = prev[service.key] || [];
            let newChecked;
            if (prevChecked.includes(layerId)) {
                newChecked = prevChecked.filter(id => id !== layerId);
            } else {
                newChecked = [...prevChecked, layerId];
            }
            // Update add/remove button state
            setServiceLayerAdded(prevAdded => ({
                ...prevAdded,
                [service.key]: newChecked.length > 0
            }));
            return { ...prev, [service.key]: newChecked };
        });
    };

    // Effect for checked layers: add/remove vector layers for each service
    useEffect(() => {
        const map = mapInstance();
        if (!map) return;

        ARCGIS_SERVICES.forEach(service => {
            const layers = serviceLayers[service.key] || [];
            const prevChecked = prevCheckedLayerIds.current[service.key] || [];
            const currChecked = checkedLayerIds[service.key] || [];

            // --- VECTOR LAYERS (unchanged) ---
            const toRemove = prevChecked.filter(id => !currChecked.includes(id));
            const toAdd = currChecked.filter(id => !prevChecked.includes(id));

            toRemove.forEach(id => {
                const baseId = `arcgis-vector-layer-${service.key}-${id}`;
                const fillId = baseId;
                const lineId = `${baseId}-outline`;
                const circleId = `${baseId}-circle`;
                const sourceId = `arcgis-vector-source-${service.key}-${id}`;
                [fillId, lineId, circleId].forEach(lid => {
                    if (map.getLayer(lid)) map.removeLayer(lid);
                });
                if (map.getSource(sourceId)) map.removeSource(sourceId);
            });

            toAdd.forEach(id => {
                const layer = layers.find(l => l.id === id);
                if (layer) {
                    addArcgisVectorLayer(
                        map,
                        { ...layer, serviceKey: service.key, serviceUrl: service.url },
                        showArcgisPopup
                    );
                }
            });

            // --- RASTER LAYER (fix here) ---
            const rasterSourceId = `arcgis-raster-${service.key}`;
            const rasterLayerId = `arcgis-raster-layer-${service.key}`;

            // Always remove the raster layer/source first
            if (map.getLayer(rasterLayerId)) map.removeLayer(rasterLayerId);
            if (map.getSource(rasterSourceId)) map.removeSource(rasterSourceId);

            if (currChecked.length > 0) {
                // Add raster layer for currently checked layers
                map.addSource(rasterSourceId, {
                    type: 'raster',
                    tiles: [
                        getArcgisTileUrl(service.url, currChecked)
                    ],
                    tileSize: 256,
                    minzoom: 6,
                    maxzoom: 12
                });
                map.addLayer({
                    id: rasterLayerId,
                    type: 'raster',
                    source: rasterSourceId,
                    paint: {
                        'raster-opacity': 0.4
                    }
                });
            }

            // Update ref for next diff
            prevCheckedLayerIds.current[service.key] = [...currChecked];
        });
        // eslint-disable-next-line
    }, [checkedLayerIds, serviceLayers]);


    // UI for search bar and dropdown
    const renderSearchBar = () => (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="Search folders, services, or layers..."
                style={{ flex: 1, padding: '4px 8px', fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <select
                value={searchType}
                onChange={e => setSearchType(e.target.value)}
                style={{ marginLeft: 8, padding: '4px', fontSize: 14, borderRadius: 4 }}
            >
                <option value="any">Any</option>
                <option value="folder">Folder</option>
                <option value="service">Service</option>
                <option value="layer">Layer</option>
            </select>
            <button
                style={{ marginLeft: 8, padding: '4px 12px', fontSize: 14, borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none' }}
                onClick={() => {
                    if (!searchKeyword) {
                        setSearchResult(null);
                        setExpandedFolders(new Set());
                        setExpandedServices(new Set());
                        return;
                    }
                    const result = filterUploadPanelData({
                        services: ARCGIS_SERVICES,
                        serviceLayers,
                        searchType,
                        keyword: searchKeyword
                    });
                    setSearchResult(result);
                    setExpandedFolders(new Set(result.expandedFolders));
                    setExpandedServices(new Set(result.expandedServices));
                }}
            >
                Search
            </button>
            <button
                style={{ marginLeft: 8, padding: '4px 12px', fontSize: 14, borderRadius: 4, background: '#eee', color: '#333', border: '1px solid #ccc' }}
                onClick={() => {
                    setSearchKeyword('');
                    setSearchResult(null);
                    setExpandedFolders(new Set());
                    setExpandedServices(new Set());
                }}
            >
                Clear Search
            </button>
        </div>
    );

    // Use either searchResult or default folders/services
    const foldersToShow = searchResult ? Object.keys(searchResult.filteredFolders) : folderNames;
    const servicesByFolderToShow = searchResult ? searchResult.filteredFolders : servicesByFolder;
    const expandedFoldersSet = searchResult ? searchResult.expandedFolders : new Set([folderExpanded]);
    const expandedServicesSet = searchResult ? searchResult.expandedServices : new Set([expandedService]);

    // Folder click
    const handleFolderClick = (folder) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folder)) newSet.delete(folder);
            else newSet.add(folder);
            return newSet;
        });
    };

    // Service click
    const handleServiceClick = (serviceKey) => {
        setExpandedServices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(serviceKey)) newSet.delete(serviceKey);
            else newSet.add(serviceKey);
            return newSet;
        });
    };

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
            {renderSearchBar()}
            {foldersToShow.map(folder => (
                <div key={folder}>
                    <div
                        className="upload-folder"
                        onClick={() => handleFolderClick(folder)}
                    >
                        {expandedFolders.has(folder) ? "▼" : "►"} {folder}
                    </div>
                    {expandedFolders.has(folder) && (
                        <div style={{ marginLeft: 18 }}>
                            {servicesByFolderToShow[folder].map(service => {
                                const layers = serviceLayers[service.key] || [];
                                const checkedIds = checkedLayerIds[service.key] || [];
                                const isAnyChecked = checkedIds.length > 0;
                                const layersToShow = service.layers || layers;

                                return (
                                    <div key={service.key} style={{ marginBottom: 12 }}>
                                        <div
                                            className="upload-item"
                                            onClick={() => handleServiceClick(service.key)}
                                        >
                                            <span>
                                                {expandedServices.has(service.key) ? "▼" : "►"} {service.label}
                                            </span>
                                            <button
                                                className={isAnyChecked ? "remove-btn" : "add-btn"}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleAddRemove(service, layersToShow);
                                                }}
                                            >
                                                {isAnyChecked ? "Remove" : "Add"}
                                            </button>
                                        </div>
                                        {expandedServices.has(service.key) && (
                                            <div style={{ marginLeft: 18 }}>
                                                <div style={{ marginBottom: 8 }}>
                                                    <label className="select-all-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={checkedIds.length === layersToShow.length}
                                                            onChange={() => handleSelectAll(service, layersToShow)}
                                                            style={{ marginRight: 8 }}
                                                        />
                                                        Select All
                                                    </label>
                                                    <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                                                        {layersToShow.map(layer => {
                                                            let legendItems = [];
                                                            const legend = serviceLegends[service.key];
                                                            if (legend && legend.layers) {
                                                                const legendLayer = legend.layers.find(l => l.layerId === layer.id);
                                                                if (legendLayer) legendItems = legendLayer.legend;
                                                            }
                                                            return (
                                                                <li key={layer.id} className="upload-layer-row">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checkedIds.includes(layer.id)}
                                                                        onChange={() => handleLayerCheckbox(service, layer.id, layersToShow)}
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
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
            <div style={{ fontSize: "12px", color: "#555", marginTop: 12, textAlign: "center" }}>
                Data sources: <a href="https://gis.ecology.wa.gov/serverext/rest/services" target="_blank" rel="noopener noreferrer">Washington State ArcGIS Services</a>
            </div>
        </div>
    );
}

export default ArcgisUploadPanel;