import React, { useEffect, useState, useRef } from "react";
import { addArcgisVectorLayer } from './arcgisVectorUtils';
import { showArcgisPopup } from './arcgisPopupUtils';
import {
    fetchArcgisLayers,
    fetchArcgisLegend,
    getArcgisTileUrl,
    fetchArcgisServiceInfo
} from './arcgisDataUtils';
import { fetchArcgisServicesByState, removeArcgisService } from './arcgisServicesDb'; // Fetch from DB
// Import local JSON files as fallback
import WA_ARCGIS_SERVICES from './arcgis_services_wa.json';
import ID_ARCGIS_SERVICES from './arcgis_services_id.json';
import OR_ARCGIS_SERVICES from './arcgis_services_or.json';
import { filterUploadPanelData } from './arcgisUploadSearchUtils';
import './ArcgisUploadPanel.css';
import './ArcgisUploadPanelStateMenu.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faPlus, faEllipsisH, faBan } from '@fortawesome/free-solid-svg-icons';
import {
    useArcgisLoadingMessages,
    getLoadingMsgId,
    getLoadingMsgText
} from './arcgisUploadMessageUtils';

// --- State selector ---
const STATE_CODES = ['WA', 'ID', 'OR'];
const STATE_LABELS = { WA: 'WA', ID: 'ID', OR: 'OR' };

// Local JSON fallback data
const ARCGIS_SERVICES_BY_STATE = {
    WA: WA_ARCGIS_SERVICES || [],
    ID: ID_ARCGIS_SERVICES || [],
    OR: OR_ARCGIS_SERVICES || []
};

function ArcgisUploadPanel({
    isOpen,
    onClose,
    mapInstance,
    arcgisLayerAdded: propArcgisLayerAdded,
    setArcgisLayerAdded: setPropArcgisLayerAdded,
}) {
    // Track selected state
    const [selectedState, setSelectedState] = useState('WA');

    // Services fetched from DB for selected state
    const [servicesFromDb, setServicesFromDb] = useState([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [servicesError, setServicesError] = useState(null);
    const [usingFallback, setUsingFallback] = useState(false);

    // Use services from database, fallback to local JSON if needed
    const ARCGIS_SERVICES = servicesFromDb.length > 0 
        ? servicesFromDb 
        : (ARCGIS_SERVICES_BY_STATE[selectedState] || []);

    // Group services by folder
    const servicesByFolder = {};
    ARCGIS_SERVICES.forEach(service => {
        const folder = service.folder || 'Root';
        if (!servicesByFolder[folder]) servicesByFolder[folder] = [];
        servicesByFolder[folder].push(service);
    });
    const folderNames = Object.keys(servicesByFolder).sort();

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

    // Service info modal state ---
    const [serviceInfoOpenKey, setServiceInfoOpenKey] = useState(null); // service.key
    const [serviceInfoCache, setServiceInfoCache] = useState({}); // { key: info }
    const [serviceInfoLoading, setServiceInfoLoading] = useState(false);

    // Add new state for sublayer checkboxes (add this near other state declarations)
    const [checkedSublayerIds, setCheckedSublayerIds] = useState({}); // { serviceKey: { layerId: [sublayerIndexes] } }

    // Fetch services from DB whenever panel opens or state changes
    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        
        (async () => {
            setIsLoadingServices(true);
            setServicesError(null);
            setUsingFallback(false);
            
            try {
                console.log(`[ArcgisUploadPanel] Attempting to fetch services from backend for ${selectedState}...`);
                const list = await fetchArcgisServicesByState(selectedState, { type: 'MapServer' });
                
                if (active) {
                    if (Array.isArray(list) && list.length > 0) {
                        setServicesFromDb(list);
                        setUsingFallback(false);
                        console.log(`[ArcgisUploadPanel] ✅ Loaded ${list.length} services from backend for state ${selectedState}`);
                    } else {
                        console.warn(`[ArcgisUploadPanel] ⚠️ Backend returned no services for ${selectedState}, using local fallback`);
                        setServicesFromDb([]);
                        setUsingFallback(true);
                    }
                }
            } catch (error) {
                console.error(`[ArcgisUploadPanel] ❌ Failed to load from backend for ${selectedState}, using local fallback:`, error);
                if (active) {
                    setServicesFromDb([]);
                    setUsingFallback(true);
                    setServicesError(`Backend unavailable (using local data): ${error.message || 'Network error'}`);
                }
            } finally {
                if (active) {
                    setIsLoadingServices(false);
                }
            }
        })();
        
        return () => { active = false; };
    }, [isOpen, selectedState]);

    // Fetch layers and legends when panel opens, state changes, or services change
    useEffect(() => {
        if (!isOpen) return;

        // Reset per-state caches/UI
        setServiceLayers({});
        setServiceLegends({});
        setCheckedLayerIds({});
        setServiceLayerAdded({});
        setExpandedFolders(new Set());
        setExpandedServices(new Set());
        setServiceInfoOpenKey(null);
        prevCheckedLayerIds.current = {};

        // Fetch for current services (from DB or fallback)
        (ARCGIS_SERVICES || []).forEach(service => {
            if (!service || service.type !== 'MapServer' || !service.url || !service.key) return;

            fetchArcgisLayers(service.url).then(layers => {
                setServiceLayers(prev => ({ ...prev, [service.key]: layers || [] }));
                setCheckedLayerIds(prev => ({ ...prev, [service.key]: [] }));
                setServiceLayerAdded(prev => ({ ...prev, [service.key]: false }));
            });

            fetchArcgisLegend(service.url).then(legend => {
                setServiceLegends(prev => ({ ...prev, [service.key]: legend || {} }));
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selectedState, servicesFromDb.length]); // React to changes in services

    // On state change: remove any ArcGIS layers/sources left from the previous state
    useEffect(() => {
        if (!isOpen) return;
        const map = mapInstance && mapInstance();
        if (!map || !map.getStyle) return;

        const style = map.getStyle();
        // Remove layers first
        if (style && Array.isArray(style.layers)) {
            style.layers
                .map(l => l.id)
                .filter(id =>
                    id.startsWith('arcgis-raster-layer-') ||
                    id.startsWith('arcgis-vector-layer-')
                )
                .forEach(id => {
                    if (map.getLayer(id)) map.removeLayer(id);
                });
        }
        // Then remove sources
        if (style && style.sources) {
            Object.keys(style.sources)
                .filter(id =>
                    id.startsWith('arcgis-raster-') ||
                    id.startsWith('arcgis-vector-source-')
                )
                .forEach(id => {
                    if (map.getSource(id)) map.removeSource(id);
                });
        }

        // Also reset our internal ref used for diffs
        prevCheckedLayerIds.current = {};
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedState, isOpen]);

    // Add/Remove button logic:
    const handleAddRemove = (service, layers) => {
        const allIds = layers.map(l => l.id);
        if (serviceLayerAdded[service.key]) {
            // Remove: uncheck all
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: [] }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: false }));
            setCheckedSublayerIds(prev => ({ ...prev, [service.key]: {} }));
            layers.forEach(layer => removeLoadingMessage(getLoadingMsgId(service, layer)));
            removeLoadingMessage(getLoadingMsgId(service, null));
        } else {
            // Add: check all
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: allIds }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: true }));
            
            // Also check all sublayers for each layer
            const newSublayerIds = {};
            layers.forEach(layer => {
                const legend = serviceLegends[service.key];
                if (legend && legend.layers) {
                    const legendLayer = legend.layers.find(l => l.layerId === layer.id);
                    if (legendLayer && legendLayer.legend && legendLayer.legend.length > 1) {
                        newSublayerIds[layer.id] = legendLayer.legend.map((_, index) => index);
                    }
                }
            });
            setCheckedSublayerIds(prev => ({ ...prev, [service.key]: newSublayerIds }));
            
            // Show loading message for all layers IMMEDIATELY
            addLoadingMessage(getLoadingMsgId(service, null), getLoadingMsgText(service, null));
        }
    };

    // Select-All logic:
    const handleSelectAll = (service, layers) => {
        const allIds = layers.map(l => l.id);
        const isAllChecked = (checkedLayerIds[service.key] || []).length === allIds.length;
        
        if (isAllChecked) {
            // Uncheck all layers and sublayers
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: [] }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: false }));
            setCheckedSublayerIds(prev => ({ ...prev, [service.key]: {} }));
            layers.forEach(layer => removeLoadingMessage(getLoadingMsgId(service, layer)));
            removeLoadingMessage(getLoadingMsgId(service, null));
        } else {
            // Check all layers and their sublayers
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: allIds }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: true }));
            
            // Also check all sublayers for each layer
            const newSublayerIds = {};
            layers.forEach(layer => {
                const legend = serviceLegends[service.key];
                if (legend && legend.layers) {
                    const legendLayer = legend.layers.find(l => l.layerId === layer.id);
                    if (legendLayer && legendLayer.legend && legendLayer.legend.length > 1) {
                        newSublayerIds[layer.id] = legendLayer.legend.map((_, index) => index);
                    }
                }
            });
            setCheckedSublayerIds(prev => ({ ...prev, [service.key]: newSublayerIds }));
            
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
                
                // Uncheck all sublayers when parent is unchecked
                setCheckedSublayerIds(prevSub => ({
                    ...prevSub,
                    [service.key]: {
                        ...prevSub[service.key],
                        [layerId]: []
                    }
                }));
            } else {
                newChecked = [...prevChecked, layerId];
                const layer = layers.find(l => l.id === layerId);
                if (layer) addLoadingMessage(getLoadingMsgId(service, layer), getLoadingMsgText(service, layer));
                
                // Check all sublayers when parent is checked
                const legend = serviceLegends[service.key];
                if (legend && legend.layers) {
                    const legendLayer = legend.layers.find(l => l.layerId === layerId);
                    if (legendLayer && legendLayer.legend) {
                        const allSublayerIndexes = legendLayer.legend.map((_, index) => index);
                        setCheckedSublayerIds(prevSub => ({
                            ...prevSub,
                            [service.key]: {
                                ...prevSub[service.key],
                                [layerId]: allSublayerIndexes
                            }
                        }));
                    }
                }
            }
            
            setServiceLayerAdded(prevAdded => ({
                ...prevAdded,
                [service.key]: newChecked.length > 0
            }));
            return { ...prev, [service.key]: newChecked };
        });
    };

    // Add new handler for sublayer checkboxes (enhanced)
    const handleSublayerCheckbox = (service, layerId, sublayerIndex, layers) => {
        setCheckedSublayerIds(prev => {
            const serviceSubIds = prev[service.key] || {};
            const layerSubIds = serviceSubIds[layerId] || [];
            
            let newLayerSubIds;
            if (layerSubIds.includes(sublayerIndex)) {
                newLayerSubIds = layerSubIds.filter(id => id !== sublayerIndex);
            } else {
                newLayerSubIds = [...layerSubIds, sublayerIndex];
            }
            
            // If no sublayers are checked, uncheck the parent layer
            if (newLayerSubIds.length === 0) {
                setCheckedLayerIds(prevChecked => ({
                    ...prevChecked,
                    [service.key]: (prevChecked[service.key] || []).filter(id => id !== layerId)
                }));
                const layer = layers.find(l => l.id === layerId);
                if (layer) removeLoadingMessage(getLoadingMsgId(service, layer));
            } else {
                // If at least one sublayer is checked, check the parent layer
                setCheckedLayerIds(prevChecked => {
                    const currentChecked = prevChecked[service.key] || [];
                    if (!currentChecked.includes(layerId)) {
                        const layer = layers.find(l => l.id === layerId);
                        if (layer) addLoadingMessage(getLoadingMsgId(service, layer), getLoadingMsgText(service, layer));
                        return {
                            ...prevChecked,
                            [service.key]: [...currentChecked, layerId]
                        };
                    }
                    return prevChecked;
                });
            }
            
            // Update service layer added status
            setServiceLayerAdded(prevAdded => {
                const allCheckedLayers = Object.keys({ ...serviceSubIds, [layerId]: newLayerSubIds })
                    .filter(lid => {
                        const subIds = lid === layerId ? newLayerSubIds : serviceSubIds[lid] || [];
                        return subIds.length > 0;
                    });
                return {
                    ...prevAdded,
                    [service.key]: allCheckedLayers.length > 0
                };
            });
            
            return {
                ...prev,
                [service.key]: {
                    ...serviceSubIds,
                    [layerId]: newLayerSubIds
                }
            };
        });
    };

    // Handle service removal
    const handleRemoveService = async (service) => {
        // Only allow removal for database services, not local fallback
        if (usingFallback) {
            alert('Cannot remove services when using local data. Please ensure backend connection is available.');
            return;
        }

        const checkedIds = checkedLayerIds[service.key] || [];
        const layersToRemove = [];
        
        // Get names of currently checked layers
        if (checkedIds.length > 0) {
            const layers = serviceLayers[service.key] || [];
            checkedIds.forEach(layerId => {
                const layer = layers.find(l => l.id === layerId);
                if (layer) layersToRemove.push(layer.name);
            });
        }

        const confirmMessage = layersToRemove.length > 0 
            ? `Remove "${service.label}" and its ${layersToRemove.length} selected layer(s) from the map?`
            : `Remove "${service.label}" from available services?`;
        
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            // Show loading state
            console.log(`Removing service: ${service.key}`);
            
            // Call the remove API
            await removeArcgisService(service.key, {
                removedBy: 'user', // You can replace this with actual user info if available
                layersRemoved: layersToRemove
            });

            // Remove from map if it was added
            if (serviceLayerAdded[service.key]) {
                const map = mapInstance();
                if (map) {
                    // Remove all layers and sources for this service
                    const layers = serviceLayers[service.key] || [];
                    layers.forEach(layer => {
                        // Remove vector layers
                        const baseId = `arcgis-vector-layer-${service.key}-${layer.id}`;
                        const fillId = baseId;
                        const lineId = `${baseId}-outline`;
                        const circleId = `${baseId}-circle`;
                        const sourceId = `arcgis-vector-source-${service.key}-${layer.id}`;
                        [fillId, lineId, circleId].forEach(lid => {
                            if (map.getLayer(lid)) map.removeLayer(lid);
                        });
                        if (map.getSource(sourceId)) map.removeSource(sourceId);

                        // Remove raster layers
                        const rasterSourceId = `arcgis-raster-${service.key}-${layer.id}`;
                        const rasterLayerId = `arcgis-raster-layer-${service.key}-${layer.id}`;
                        if (map.getLayer(rasterLayerId)) map.removeLayer(rasterLayerId);
                        if (map.getSource(rasterSourceId)) map.removeSource(rasterSourceId);

                        // Remove sublayer rasters
                        const style = map.getStyle();
                        if (style?.layers) {
                            style.layers
                                .filter(l => l.id.startsWith(`arcgis-raster-layer-${service.key}-${layer.id}`))
                                .forEach(l => {
                                    if (map.getLayer(l.id)) map.removeLayer(l.id);
                                });
                        }
                        if (style?.sources) {
                            Object.keys(style.sources)
                                .filter(id => id.startsWith(`arcgis-raster-${service.key}-${layer.id}`))
                                .forEach(id => {
                                    if (map.getSource(id)) map.removeSource(id);
                                });
                        }
                    });
                }
            }

            // Clean up local state
            setServiceLayers(prev => {
                const newState = { ...prev };
                delete newState[service.key];
                return newState;
            });
            setServiceLegends(prev => {
                const newState = { ...prev };
                delete newState[service.key];
                return newState;
            });
            setCheckedLayerIds(prev => {
                const newState = { ...prev };
                delete newState[service.key];
                return newState;
            });
            setServiceLayerAdded(prev => {
                const newState = { ...prev };
                delete newState[service.key];
                return newState;
            });
            setCheckedSublayerIds(prev => {
                const newState = { ...prev };
                delete newState[service.key];
                return newState;
            });

            // Refresh services list from database
            console.log('Refreshing services list...');
            const updatedList = await fetchArcgisServicesByState(selectedState, { type: 'MapServer' });
            setServicesFromDb(updatedList);
            
            console.log(`✅ Service "${service.label}" removed successfully`);
            
        } catch (error) {
            console.error('Failed to remove service:', error);
            alert(`Failed to remove service: ${error.message || 'Unknown error'}`);
        }
    };

    // Enhanced effect for checked layers: add/remove vector layers and individual sublayer rasters
    useEffect(() => {
        const map = mapInstance();
        if (!map) return;

        ARCGIS_SERVICES.forEach(service => {
            const layers = serviceLayers[service.key] || [];
            const prevChecked = prevCheckedLayerIds.current[service.key] || [];
            const currChecked = checkedLayerIds[service.key] || [];
            const serviceSublayers = checkedSublayerIds[service.key] || {};
            const prevSublayers = prevCheckedLayerIds.current[`${service.key}_sublayers`] || {};

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

            // --- ENHANCED RASTER LAYER LOGIC WITH PROPER REMOVAL ---
            // First, handle layers that were completely unchecked - remove ALL their raster layers
            toRemove.forEach(layerId => {
                const layerRasterPrefix = `arcgis-raster-layer-${service.key}-${layerId}`;
                const style = map.getStyle();
                if (style?.layers) {
                    style.layers
                        .filter(l => l.id.startsWith(layerRasterPrefix))
                        .forEach(l => {
                            if (map.getLayer(l.id)) map.removeLayer(l.id);
                        });
                }
                if (style?.sources) {
                    Object.keys(style.sources)
                        .filter(id => id.startsWith(`arcgis-raster-${service.key}-${layerId}`))
                        .forEach(id => {
                            if (map.getSource(id)) map.removeSource(id);
                        });
                }
            });

            // Then handle sublayer changes for currently checked layers
            currChecked.forEach(layerId => {
                const layer = layers.find(l => l.id === layerId);
                if (!layer) return;

                const legend = serviceLegends[service.key];
                const legendLayer = legend?.layers?.find(l => l.layerId === layerId);
                const legendItems = legendLayer?.legend || [];
                const checkedSublayers = serviceSublayers[layerId] || [];
                const prevCheckedSublayers = prevSublayers[layerId] || [];

                // Check if sublayer selection changed
                const sublayersChanged = JSON.stringify(checkedSublayers.sort()) !== JSON.stringify(prevCheckedSublayers.sort());

                if (legendItems.length > 1) {
                    // Multiple legends case
                    if (sublayersChanged || toAdd.includes(layerId)) {
                        // Remove all existing raster layers for this layer first
                        const layerRasterPrefix = `arcgis-raster-layer-${service.key}-${layerId}`;
                        const style = map.getStyle();
                        if (style?.layers) {
                            style.layers
                                .filter(l => l.id.startsWith(layerRasterPrefix))
                                .forEach(l => {
                                    if (map.getLayer(l.id)) map.removeLayer(l.id);
                            });
                        }
                        if (style?.sources) {
                            Object.keys(style.sources)
                                .filter(id => id.startsWith(`arcgis-raster-${service.key}-${layerId}`))
                                .forEach(id => {
                                    if (map.getSource(id)) map.removeSource(id);
                            });
                        }

                        // Add raster layers only for checked sublayers
                        if (checkedSublayers.length > 0) {
                            checkedSublayers.forEach((sublayerIndex, index) => {
                                const legendItem = legendItems[sublayerIndex];
                                if (!legendItem) return;

                                const sublayerSourceId = `arcgis-raster-${service.key}-${layerId}-sub-${sublayerIndex}`;
                                const sublayerLayerId = `arcgis-raster-layer-${service.key}-${layerId}-sub-${sublayerIndex}`;

                                // Create tile URL for this specific sublayer
                                const sublayerTileUrl = getArcgisTileUrl(service.url, [layerId]);

                                map.addSource(sublayerSourceId, {
                                    type: 'raster',
                                    tiles: [sublayerTileUrl],
                                    tileSize: 256,
                                    minzoom: 6,
                                    maxzoom: 12
                                });

                                map.addLayer({
                                    id: sublayerLayerId,
                                    type: 'raster',
                                    source: sublayerSourceId,
                                    paint: {
                                        'raster-opacity': 0.7
                                    }
                                });

                                // Add loading/finished message handling for sublayers
                                let tilesLoaded = false;
                                let renderedAfterTiles = false;
                                let finishedTimeout = null;

                                const onTilesLoaded = (e) => {
                                    if (e.sourceId === sublayerSourceId && map.isSourceLoaded(sublayerSourceId)) {
                                        tilesLoaded = true;
                                    }
                                };

                                const onRender = () => {
                                    if (tilesLoaded && map.getLayer(sublayerLayerId)) {
                                        if (!renderedAfterTiles) {
                                            renderedAfterTiles = true;
                                            finishedTimeout = setTimeout(() => {
                                                const sublayerMsgId = `${getLoadingMsgId(service, layer)}-sub-${sublayerIndex}`;
                                                removeLoadingMessage(sublayerMsgId);
                                                showFinishedMessage(sublayerMsgId, `${legendItem.label} loaded`);
                                                map.off('sourcedata', onTilesLoaded);
                                                map.off('render', onRender);
                                                if (finishedTimeout) clearTimeout(finishedTimeout);
                                            }, 500);
                                        }
                                    }
                                };

                                map.on('sourcedata', onTilesLoaded);
                                map.on('render', onRender);
                            });
                        }
                    }
                } else if (toAdd.includes(layerId)) {
                    // Single legend case - only add if this layer was just checked
                    const rasterSourceId = `arcgis-raster-${service.key}-${layerId}`;
                    const rasterLayerId = `arcgis-raster-layer-${service.key}-${layerId}`;

                    // Remove existing first (in case of re-adding)
                    if (map.getLayer(rasterLayerId)) map.removeLayer(rasterLayerId);
                    if (map.getSource(rasterSourceId)) map.removeSource(rasterSourceId);

                    map.addSource(rasterSourceId, {
                        type: 'raster',
                        tiles: [getArcgisTileUrl(service.url, [layerId])],
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

                    let tilesLoaded = false;
                    let renderedAfterTiles = false;
                    let finishedTimeout = null;

                    const onTilesLoaded = (e) => {
                        if (e.sourceId === rasterSourceId && map.isSourceLoaded(rasterSourceId)) {
                            tilesLoaded = true;
                        }
                    };

                    const onRender = () => {
                        if (tilesLoaded && map.getLayer(rasterLayerId)) {
                            if (!renderedAfterTiles) {
                                renderedAfterTiles = true;
                                finishedTimeout = setTimeout(() => {
                                    removeLoadingMessage(getLoadingMsgId(service, layer));
                                    showFinishedMessage(getLoadingMsgId(service, layer), getLoadingMsgText(service, layer, true));
                                    map.off('sourcedata', onTilesLoaded);
                                    map.off('render', onRender);
                                    if (finishedTimeout) clearTimeout(finishedTimeout);
                                }, 500);
                            }
                        }
                    };

                    map.on('sourcedata', onTilesLoaded);
                    map.on('render', onRender);
                }
            });

            // Update refs for next diff
            prevCheckedLayerIds.current[service.key] = [...currChecked];
            prevCheckedLayerIds.current[`${service.key}_sublayers`] = JSON.parse(JSON.stringify(serviceSublayers));
        });
        // eslint-disable-next-line
    }, [checkedLayerIds, serviceLayers, checkedSublayerIds]); // Added checkedSublayerIds as dependency


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

    // State menu bar
    const renderStateMenu = () => (
        <div className="arcgis-upload-state-menu">
            {STATE_CODES.map(code => (
                <button
                    key={code}
                    className={`arcgis-upload-state-btn${selectedState === code ? ' active' : ''}`}
                    onClick={() => setSelectedState(code)}
                >
                    {STATE_LABELS[code]}
                </button>
            ))}
        </div>
    );

    // Open service info modal (fetch & cache)
    const openServiceInfo = async (service) => {
        setServiceInfoOpenKey(service.key);
        if (serviceInfoCache[service.key]) return;
        setServiceInfoLoading(true);
        try {
            const info = await fetchArcgisServiceInfo(service.url);
            setServiceInfoCache(prev => ({ ...prev, [service.key]: info || {} }));
        } finally {
            setServiceInfoLoading(false);
        }
    };
    const closeServiceInfo = () => {
        setServiceInfoOpenKey(null);
    };

    // Helper: convert HTML to plain text (for Service Description)
    function toPlainText(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || '';
        return text.replace(/\u00A0/g, ' ').trim();
    }

    if (!isOpen) return null;

    return (
        <>
            {/* Upload Panel */}
            <div className="upload-panel">
                {/* Loading and status messages */}
                {isLoadingServices && (
                    <div style={{ 
                        background: '#d4edda', 
                        border: '1px solid #c3e6cb', 
                        borderRadius: '4px', 
                        padding: '8px', 
                        marginBottom: '12px', 
                        fontSize: '12px',
                        color: '#155724'
                    }}>
                        🔄 Loading ArcGIS services for {selectedState}...
                    </div>
                )}
                
                {usingFallback && (
                    <div style={{ 
                        background: '#fff3cd', 
                        border: '1px solid #ffecb5', 
                        borderRadius: '4px', 
                        padding: '8px', 
                        marginBottom: '12px', 
                        fontSize: '12px',
                        color: '#856404'
                    }}>
                        📂 Using local data for {selectedState} ({ARCGIS_SERVICES.length} services)
                        {servicesError && <div style={{ marginTop: '4px', fontSize: '11px' }}>{servicesError}</div>}
                    </div>
                )}

                {!isLoadingServices && !usingFallback && servicesFromDb.length > 0 && (
                    <div style={{ 
                        background: '#d1ecf1', 
                        border: '1px solid #bee5eb', 
                        borderRadius: '4px', 
                        padding: '8px', 
                        marginBottom: '12px', 
                        fontSize: '12px',
                        color: '#0c5460'
                    }}>
                        🌐 Loaded from database: {servicesFromDb.length} services for {selectedState}
                    </div>
                )}
                
                {renderSearchBar()}
                {foldersToShow.map(folder => (
                    <div key={folder}>
                        <div
                            className="upload-folder"
                            onClick={() => handleFolderClick(folder)}
                        >
                            <span>
                                {expandedFolders.has(folder) ? "▼" : "►"} {folder}
                            </span>
                            {/* Removed folder-level remove button */}
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
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <button
                                                        className={isAnyChecked ? "remove-btn" : "add-btn"}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleAddRemove(service, layersToShow);
                                                        }}
                                                        title={isAnyChecked ? "Remove" : "Load"}
                                                        aria-label={isAnyChecked ? "Remove service" : "Load service"}
                                                    >
                                                        <FontAwesomeIcon icon={isAnyChecked ? faTimes : faPlus} />
                                                    </button>
                                                    <button
                                                        className="learn-more-btn"
                                                        title="Learn more about this service"
                                                        aria-label="Learn more about this service"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            openServiceInfo(service);
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faEllipsisH} />
                                                    </button>
                                                    {/* Keep service-level remove button (no-op) */}
                                                    <button
                                                        className="learn-more-btn"
                                                        title="Remove"
                                                        aria-label="Remove"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveService(service);
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faBan} />
                                                    </button>
                                                </div>
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
                                                                    if (legendLayer) legendItems = legendLayer.legend || [];
                                                                }

                                                                // Check if this layer has multiple legend items
                                                                const hasMultipleLegends = legendItems.length > 1;
                                                                const checkedSublayers = checkedSublayerIds[service.key]?.[layer.id] || [];

                                                                return (
                                                                    <li key={layer.id} className="upload-layer-row" style={{ 
                                                                        flexDirection: 'column', 
                                                                        alignItems: 'flex-start',
                                                                        marginBottom: hasMultipleLegends ? 8 : 2
                                                                    }}>
                                                                        {/* Main layer row */}
                                                                        <div style={{ 
                                                                            display: 'flex', 
                                                                            alignItems: 'center', 
                                                                            gap: 4, 
                                                                            minHeight: 20,
                                                                            width: '100%'
                                                                        }}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={checkedIds.includes(layer.id)}
                                                                                onChange={() => handleLayerCheckbox(service, layer.id, layersToShow)}
                                                                                style={{ marginRight: 8 }}
                                                                            />
                                                                            {/* Show legend icon only if there's exactly one legend item */}
                                                                            {legendItems.length === 1 && (
                                                                                <img
                                                                                    src={`data:${legendItems[0].contentType};base64,${legendItems[0].imageData}`}
                                                                                    alt={legendItems[0].label}
                                                                                    className="legend-img"
                                                                                />
                                                                            )}
                                                                            <span>{layer.name}</span>
                                                                            {hasMultipleLegends && (
                                                                                <span style={{ 
                                                                                    fontSize: '11px', 
                                                                                    color: '#888', 
                                                                                    marginLeft: 8 
                                                                                }}>
                                                                                    ({checkedSublayers.length}/{legendItems.length})
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Show sublayers/legends if there are multiple */}
                                                                        {hasMultipleLegends && (
                                                                            <div style={{ 
                                                                                marginLeft: 24, 
                                                                                marginTop: 4,
                                                                                width: 'calc(100% - 24px)'
                                                                            }}>
                                                                                {legendItems.map((legendItem, index) => (
                                                                                    <div 
                                                                                        key={index} 
                                                                                        className="upload-layer-sublayer"
                                                                                        style={{ 
                                                                                            display: 'flex', 
                                                                                            alignItems: 'center', 
                                                                                            gap: 4, 
                                                                                            marginBottom: 3,
                                                                                            fontSize: '12px',
                                                                                            color: '#666',
                                                                                            minHeight: '18px'
                                                                                        }}
                                                                                    >
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={checkedSublayers.includes(index)}
                                                                                            onChange={() => handleSublayerCheckbox(service, layer.id, index, layersToShow)}
                                                                                            style={{ 
                                                                                                marginRight: 6,
                                                                                                width: '12px',
                                                                                                height: '12px',
                                                                                                flexShrink: 0
                                                                                            }}
                                                                                        />
                                                                                        <img
                                                                                            src={`data:${legendItem.contentType};base64,${legendItem.imageData}`}
                                                                                            alt={legendItem.label}
                                                                                            className="legend-img"
                                                                                            style={{ 
                                                                                                width: '14px', 
                                                                                                height: '14px',
                                                                                                marginRight: '6px'
                                                                                            }}
                                                                                        />
                                                                                        <span title={legendItem.label}>
                                                                                            {legendItem.label}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
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
                
                {/* Attribution */}
                <div className="upload-panel-attribution">
                    Data sources: {usingFallback ? 'Local JSON Files' : 'Backend Database'} • <a href="https://gis.ecology.wa.gov/serverext/rest/services" target="_blank" rel="noopener noreferrer">Washington State ArcGIS Services</a>
                </div>
                
                <div className="arcgis-loading-messages">
                    {messages.map((msg, idx) => (
                        <div key={msg.id} className={`arcgis-loading-message ${msg.type}`}>
                            {msg.text}
                        </div>
                    ))}
                </div>
            </div>

            {/* Service info modal (right side) */}
            {serviceInfoOpenKey && (
                <div className="arcgis-service-info-modal">
                    <div className="arcgis-service-info-modal-header">
                        <strong>Service info</strong>
                        <button
                            className="arcgis-service-info-modal-close"
                            onClick={closeServiceInfo}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                    </div>
                    <div className="arcgis-service-info-modal-content">
                        {serviceInfoLoading && <div>Loading service info…</div>}
                        {!serviceInfoLoading && (() => {
                            const info = serviceInfoCache[serviceInfoOpenKey] || {};
                            const currentService = ARCGIS_SERVICES.find(s => s.key === serviceInfoOpenKey);
                            
                            if (!info || Object.keys(info).length === 0) {
                                return (
                                    <div>
                                        <div className="arcgis-service-info-empty">No information available.</div>
                                        {currentService && currentService.url && (
                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                                                <a 
                                                    href={currentService.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#1976d2', textDecoration: 'none' }}
                                                >
                                                    View ArcGIS Service Page →
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            
                            const sr = info.spatialReference || {};
                            const srText = sr.latestWkid
                                ? `WKID ${sr.latestWkid}`
                                : (sr.wkid ? `WKID ${sr.wkid}` : (sr.wkt ? 'WKT' : '—'));
                            
                            return (
                                <div>
                                    {info.serviceDescription || info.description ? (
                                        <div className="arcgis-service-info-row">
                                            <strong>Service Description:</strong>
                                            <div className="arcgis-service-info-description">
                                                {toPlainText(info.serviceDescription || info.description)}
                                            </div>
                                        </div>
                                    ) : null}
                                    <div className="arcgis-service-info-row">
                                        <strong>Service Item Id:</strong> {info.serviceItemId || info.itemId || '—'}
                                    </div>
                                    <div className="arcgis-service-info-row">
                                        <strong>Copyright Text:</strong> {toPlainText(info.copyrightText) || '—'}
                                    </div>
                                    <div className="arcgis-service-info-row">
                                        <strong>Spatial Reference:</strong> {srText}
                                    </div>
                                    
                                    {/* Add the ArcGIS service page link at the bottom */}
                                    {currentService && currentService.url && (
                                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                                            <a 
                                                href={currentService.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{ color: '#1976d2', textDecoration: 'none' }}
                                            >
                                                View ArcGIS Service Page →
                            </a>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* State menu: outside the upload panel */}
            {renderStateMenu()}
        </>
    );
}

export default ArcgisUploadPanel;