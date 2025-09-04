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
import './ArcgisUploadPanel.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import {
    useArcgisLoadingMessages,
    getLoadingMsgId,
    getLoadingMsgText
} from './arcgisUploadMessageUtils';

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
    // State for added-only checkbox
    const [showAddedOnly, setShowAddedOnly] = useState(false);

    // Track previous checkedLayerIds for diffing
    const prevCheckedLayerIds = useRef({});

    const {
        messages,
        addLoadingMessage,
        removeLoadingMessage,
        showFinishedMessage
    } = useArcgisLoadingMessages();

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
            layers.forEach(layer => removeLoadingMessage(getLoadingMsgId(service, layer)));
            removeLoadingMessage(getLoadingMsgId(service, null));
        } else {
            // Add: check all
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: allIds }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: true }));
            // Show loading message for all layers IMMEDIATELY
            addLoadingMessage(getLoadingMsgId(service, null), getLoadingMsgText(service, null));
        }
    };

    // Select-All logic:
    const handleSelectAll = (service, layers) => {
        const allIds = layers.map(l => l.id);
        const isAllChecked = (checkedLayerIds[service.key] || []).length === allIds.length;
        if (isAllChecked) {
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: [] }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: false }));
            layers.forEach(layer => removeLoadingMessage(getLoadingMsgId(service, layer)));
            removeLoadingMessage(getLoadingMsgId(service, null));
        } else {
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: allIds }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: true }));
            addLoadingMessage(getLoadingMsgId(service, null), getLoadingMsgText(service, null));
        }
    };

    // Layer checkbox logic:
    const handleLayerCheckbox = (service, layerId, layers) => {
        setCheckedLayerIds(prev => {
            const prevChecked = prev[service.key] || [];
            let newChecked;
            if (prevChecked.includes(layerId)) {
                newChecked = prevChecked.filter(id => id !== layerId);
                const layer = layers.find(l => l.id === layerId);
                if (layer) removeLoadingMessage(getLoadingMsgId(service, layer));
            } else {
                newChecked = [...prevChecked, layerId];
                const layer = layers.find(l => l.id === layerId);
                if (layer) addLoadingMessage(getLoadingMsgId(service, layer), getLoadingMsgText(service, layer));
            }
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

                // Show loading message (already handled in handlers)

                let tilesLoaded = false;
                let renderedAfterTiles = false;
                let finishedTimeout = null;

                // Listen for tiles loaded
                const onTilesLoaded = (e) => {
                    if (e.sourceId === rasterSourceId && map.isSourceLoaded(rasterSourceId)) {
                        tilesLoaded = true;
                    }
                };

                // Listen for render event after tiles are loaded
                const onRender = () => {
                    if (tilesLoaded && map.getLayer(rasterLayerId)) {
                        if (!renderedAfterTiles) {
                            renderedAfterTiles = true;
                            finishedTimeout = setTimeout(() => {
                                if (currChecked.length === layers.length) {
                                    removeLoadingMessage(getLoadingMsgId(service, null));
                                    showFinishedMessage(getLoadingMsgId(service, null), getLoadingMsgText(service, null, true));
                                } else {
                                    currChecked.forEach(id => {
                                        const layer = layers.find(l => l.id === id);
                                        if (layer) {
                                            removeLoadingMessage(getLoadingMsgId(service, layer));
                                            showFinishedMessage(getLoadingMsgId(service, layer), getLoadingMsgText(service, layer, true));
                                        }
                                    });
                                }
                                map.off('sourcedata', onTilesLoaded);
                                map.off('render', onRender);
                                if (finishedTimeout) clearTimeout(finishedTimeout);
                            }, 500); // 500ms delay after first render after tiles loaded
                        }
                    }
                };

                map.on('sourcedata', onTilesLoaded);
                map.on('render', onRender);
            }

            // Update ref for next diff
            prevCheckedLayerIds.current[service.key] = [...currChecked];
        });
        // eslint-disable-next-line
    }, [checkedLayerIds, serviceLayers]);


    // UI for search bar and dropdown
    const renderSearchBar = () => (
        <div>
            <div className="upload-panel-searchbar">
                <input
                    type="text"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    placeholder="Search folders, services, or layers..."
                />
                <select
                    value={searchType}
                    onChange={e => setSearchType(e.target.value)}
                    className="upload-panel-searchbar-dropdown"
                >
                    <option value="any">Any</option>
                    <option value="folder">Folder</option>
                    <option value="service">Service</option>
                    <option value="layer">Layer</option>
                </select>
                <button
                    className="search-btn upload-panel-searchbar-btn"
                    title="Search"
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
                    <FontAwesomeIcon icon={faSearch} />
                </button>
                <button
                    className="clear-btn upload-panel-searchbar-btn"
                    title="Clear Search"
                    onClick={() => {
                        setSearchKeyword('');
                        setSearchResult(null);
                        setExpandedFolders(new Set());
                        setExpandedServices(new Set());
                    }}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
            <div className="upload-panel-added-checkbox-row">
                <label>
                    <input
                        type="checkbox"
                        checked={showAddedOnly}
                        onChange={e => {
                            setShowAddedOnly(e.target.checked);
                            if (e.target.checked) {
                                // Expand all folders and services that have added layers
                                const foldersWithAdded = [];
                                const servicesWithAdded = [];
                                folderNames.forEach(folder => {
                                    const hasAdded = servicesByFolder[folder].some(service =>
                                        (checkedLayerIds[service.key] || []).length > 0
                                    );
                                    if (hasAdded) foldersWithAdded.push(folder);
                                    servicesByFolder[folder].forEach(service => {
                                        if ((checkedLayerIds[service.key] || []).length > 0) {
                                            servicesWithAdded.push(service.key);
                                        }
                                    });
                                });
                                setExpandedFolders(new Set(foldersWithAdded));
                                setExpandedServices(new Set(servicesWithAdded));
                            } else {
                                setExpandedFolders(new Set());
                                setExpandedServices(new Set());
                            }
                        }}
                        style={{ marginRight: 8 }}
                    />
                    Show only services added to map
                </label>
            </div>
        </div>
    );

    // Use either searchResult or default folders/services, filter if showAddedOnly
    let foldersToShow = searchResult ? Object.keys(searchResult.filteredFolders) : folderNames;
    let servicesByFolderToShow = searchResult ? searchResult.filteredFolders : servicesByFolder;

    // If "Show only services added to map" is checked, filter the current display set
    if (showAddedOnly) {
        const filteredFolders = {};
        foldersToShow.forEach(folder => {
            const filteredServices = (servicesByFolderToShow[folder] || []).filter(service =>
                (checkedLayerIds[service.key] || []).length > 0
            );
            if (filteredServices.length > 0) {
                filteredFolders[folder] = filteredServices;
            }
        });
        foldersToShow = Object.keys(filteredFolders);
        servicesByFolderToShow = filteredFolders;
    }
    const expandedFoldersSet = expandedFolders;
    const expandedServicesSet = expandedServices;

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
                                                {isAnyChecked ? "Remove" : "Load"}
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
            <div className="upload-panel-attribution">
                Data sources: <a href="https://gis.ecology.wa.gov/serverext/rest/services" target="_blank" rel="noopener noreferrer">Washington State ArcGIS Services</a>
            </div>
            <div className="arcgis-loading-messages">
                {messages.map((msg, idx) => (
                    <div key={msg.id} className={`arcgis-loading-message ${msg.type}`}>
                        {msg.text}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ArcgisUploadPanel;