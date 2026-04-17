import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { addArcgisVectorLayer } from './arcgisVectorUtils';
import { showArcgisPopup } from './arcgisPopupUtils';
import {
    fetchArcgisLayers,
    fetchArcgisLegend,
    getArcgisTileUrl,
    fetchArcgisServiceInfo,
    fetchArcgisLayerInfo,
} from './arcgisDataUtils';
import { fetchCustomLayers, deleteCustomLayer, reorderCustomLayers } from './arcgisServicesDb';
import { buildLayerTree, getAllLeafLayers, getDescendantLeafLayers, LayerTreeNode } from './LayerTree';
import { filterUploadPanelData } from './arcgisUploadSearchUtils';
import ArcgisRenameItem from './ArcgisRenameItem';
import { useLayerContextMenu, LayerContextMenuPopup } from './LayerContextMenu';
import './CustomLayersPanel.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';

function CustomLayersPanel({
    isOpen,
    onClose,
    splitBottom = false,
    mapInstance,
}) {
    const userEmail = localStorage.getItem('email') || '';

    const [customServices, setCustomServices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Per-service state
    const [serviceLayers, setServiceLayers] = useState({});
    const [serviceLegends, setServiceLegends] = useState({});
    const [checkedLayerIds, setCheckedLayerIds] = useState({});
    const [checkedSublayerIds, setCheckedSublayerIds] = useState({});
    const [serviceLayerAdded, setServiceLayerAdded] = useState({});

    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [expandedServices, setExpandedServices] = useState(new Set());
    const [expandedLayers, setExpandedLayers] = useState(new Set());

    const [layerOpacity, setLayerOpacity] = useState(0.7);
    const [statusMsg, setStatusMsg] = useState(null);

    // Search & filter state
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchType, setSearchType] = useState('any');
    const [searchResult, setSearchResult] = useState(null);
    const [showAddedOnly, setShowAddedOnly] = useState(false);
    const statusTimer = useRef(null);

    const prevCheckedLayerIds = useRef({});

    // Rename state
    const [renamingItem, setRenamingItem] = useState(null);

    // Pin state (separate storage key from upload panel)
    const PINNED_STORAGE_KEY = 'custom_layers_pinned_items';
    const loadPinnedItems = () => {
        try {
            const raw = localStorage.getItem(PINNED_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    };
    const savePinnedItems = (items) => {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(items));
    };
    const [pinnedItems, setPinnedItems] = useState(() => loadPinnedItems());

    useEffect(() => {
        savePinnedItems(pinnedItems);
    }, [pinnedItems]);

    // Context menu hook (state, outside-click, pin/unpin)
    const {
        contextMenu,
        handleContextMenu,
        closeContextMenu,
        isPinned,
        handleTogglePin,
    } = useLayerContextMenu({ pinnedItems, setPinnedItems });

    // Service info modal state
    const [serviceInfoOpenKey, setServiceInfoOpenKey] = useState(null);
    const [serviceInfoCache, setServiceInfoCache] = useState({});
    const [serviceInfoLoading, setServiceInfoLoading] = useState(false);

    // Layer info modal state
    const [layerInfoOpen, setLayerInfoOpen] = useState(null);
    const [layerInfoCache, setLayerInfoCache] = useState({});
    const [layerInfoLoading, setLayerInfoLoading] = useState(false);

    const showStatus = (msg) => {
        setStatusMsg(msg);
        if (statusTimer.current) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => setStatusMsg(null), 3000);
    };

    // Load custom layers from backend when panel opens
    useEffect(() => {
        if (!isOpen || !userEmail) return;
        let active = true;
        (async () => {
            setIsLoading(true);
            try {
                const layers = await fetchCustomLayers(userEmail);
                if (active) setCustomServices(layers);
            } catch (err) {
                console.warn('[CustomLayersPanel] Failed to load custom layers:', err);
            } finally {
                if (active) setIsLoading(false);
            }
        })();
        return () => { active = false; };
    }, [isOpen, userEmail]);

    // Group services by folder (preserving sort_order from DB)
    const servicesByFolder = {};
    const folderFirstOrder = {};
    customServices.forEach(service => {
        const folder = service.folder || 'Root';
        if (!servicesByFolder[folder]) servicesByFolder[folder] = [];
        servicesByFolder[folder].push(service);
        // Track the minimum sort_order in each folder (for folder ordering)
        if (folderFirstOrder[folder] === undefined || service.sort_order < folderFirstOrder[folder]) {
            folderFirstOrder[folder] = service.sort_order;
        }
    });
    const folderNames = Object.keys(servicesByFolder).sort((a, b) => (folderFirstOrder[a] ?? 0) - (folderFirstOrder[b] ?? 0));

    // --- Search handler ---
    const doSearch = () => {
        if (!searchKeyword) {
            setSearchResult(null);
            setExpandedFolders(new Set());
            setExpandedServices(new Set());
            setExpandedLayers(new Set());
            return;
        }
        const result = filterUploadPanelData({
            services: customServices,
            serviceLayers,
            searchType,
            keyword: searchKeyword,
        });
        setSearchResult(result);
        setExpandedFolders(new Set(result.expandedFolders));
        setExpandedServices(new Set(result.expandedServices));
        setExpandedLayers(new Set(result.expandedLayerKeys));
    };

    const clearSearch = () => {
        setSearchKeyword('');
        setSearchResult(null);
        setExpandedFolders(new Set());
        setExpandedServices(new Set());
        setExpandedLayers(new Set());
    };

    // --- Compute display folders/services with search + showAddedOnly ---
    let foldersToShow = searchResult ? Object.keys(searchResult.filteredFolders) : folderNames;
    let servicesByFolderToShow = searchResult ? searchResult.filteredFolders : servicesByFolder;

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

    // Lazy-load layers/legends when a service is expanded
    useEffect(() => {
        if (!isOpen) return;
        customServices.forEach(service => {
            if (!expandedServices.has(service.key)) return;
            if (serviceLayers[service.key] !== undefined) return;
            if (!service.url || service.type !== 'MapServer') return;

            fetchArcgisLayers(service.url).then(layers => {
                setServiceLayers(prev => ({ ...prev, [service.key]: layers || [] }));
                setCheckedLayerIds(prev => prev[service.key] ? prev : { ...prev, [service.key]: [] });
                setServiceLayerAdded(prev => prev[service.key] !== undefined ? prev : { ...prev, [service.key]: false });
                setCheckedSublayerIds(prev => prev[service.key] !== undefined ? prev : { ...prev, [service.key]: {} });
            });
            fetchArcgisLegend(service.url).then(legend => {
                setServiceLegends(prev => ({ ...prev, [service.key]: legend || {} }));
            });
        });
    }, [isOpen, customServices, expandedServices]);

    // --- Map interaction: add/remove raster + vector layers per layer (matches ArcgisUploadPanel) ---
    useEffect(() => {
        const map = mapInstance && mapInstance();
        if (!map) return;

        customServices.forEach(service => {
            const layers = serviceLayers[service.key] || [];
            const prevChecked = prevCheckedLayerIds.current[service.key] || [];
            const currChecked = checkedLayerIds[service.key] || [];
            const serviceSublayers = checkedSublayerIds[service.key] || {};
            const prevSublayers = prevCheckedLayerIds.current[`${service.key}_sublayers`] || {};

            // --- VECTOR LAYERS ---
            const toRemove = prevChecked.filter(id => !currChecked.includes(id));
            const toAdd = currChecked.filter(id => !prevChecked.includes(id));

            toRemove.forEach(id => {
                const baseId = `arcgis-vector-layer-custom-${service.key}-${id}`;
                const fillId = baseId;
                const lineId = `${baseId}-outline`;
                const circleId = `${baseId}-circle`;
                const sourceId = `arcgis-vector-source-custom-${service.key}-${id}`;
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
                        { ...layer, serviceKey: `custom-${service.key}`, serviceUrl: service.url },
                        showArcgisPopup,
                        { minzoom: 6, maxzoom: 12 }
                    );
                }
            });

            // --- RASTER LAYERS ---
            // Remove rasters for completely unchecked layers
            toRemove.forEach(layerId => {
                const layerRasterPrefix = `arcgis-raster-layer-custom-${service.key}-${layerId}`;
                const style = map.getStyle();
                if (style?.layers) {
                    style.layers
                        .filter(l => l.id.startsWith(layerRasterPrefix))
                        .forEach(l => { if (map.getLayer(l.id)) map.removeLayer(l.id); });
                }
                if (style?.sources) {
                    Object.keys(style.sources)
                        .filter(id => id.startsWith(`arcgis-raster-custom-${service.key}-${layerId}`))
                        .forEach(id => { if (map.getSource(id)) map.removeSource(id); });
                }
            });

            // Handle sublayer changes for currently checked layers
            currChecked.forEach(layerId => {
                const layer = layers.find(l => l.id === layerId);
                if (!layer) return;

                const legend = serviceLegends[service.key];
                const legendLayer = legend?.layers?.find(l => l.layerId === layerId);
                const legendItems = legendLayer?.legend || [];
                const checkedSublayers = serviceSublayers[layerId] || [];
                const prevCheckedSublayers = prevSublayers[layerId] || [];
                const sublayersChanged = JSON.stringify([...checkedSublayers].sort()) !== JSON.stringify([...prevCheckedSublayers].sort());

                if (legendItems.length > 1) {
                    if (sublayersChanged || toAdd.includes(layerId)) {
                        // Remove existing rasters for this layer
                        const layerRasterPrefix = `arcgis-raster-layer-custom-${service.key}-${layerId}`;
                        const style = map.getStyle();
                        if (style?.layers) {
                            style.layers
                                .filter(l => l.id.startsWith(layerRasterPrefix))
                                .forEach(l => { if (map.getLayer(l.id)) map.removeLayer(l.id); });
                        }
                        if (style?.sources) {
                            Object.keys(style.sources)
                                .filter(id => id.startsWith(`arcgis-raster-custom-${service.key}-${layerId}`))
                                .forEach(id => { if (map.getSource(id)) map.removeSource(id); });
                        }
                        // Add rasters for checked sublayers
                        if (checkedSublayers.length > 0) {
                            checkedSublayers.forEach(sublayerIndex => {
                                const sublayerSourceId = `arcgis-raster-custom-${service.key}-${layerId}-sub-${sublayerIndex}`;
                                const sublayerLayerId = `arcgis-raster-layer-custom-${service.key}-${layerId}-sub-${sublayerIndex}`;
                                map.addSource(sublayerSourceId, {
                                    type: 'raster',
                                    tiles: [getArcgisTileUrl(service.url, [layerId])],
                                    tileSize: 256,
                                    minzoom: 6,
                                    maxzoom: 12
                                });
                                map.addLayer({
                                    id: sublayerLayerId,
                                    type: 'raster',
                                    source: sublayerSourceId,
                                    paint: { 'raster-opacity': layerOpacity }
                                });
                            });
                        }
                    }
                } else if (toAdd.includes(layerId)) {
                    const rasterSourceId = `arcgis-raster-custom-${service.key}-${layerId}`;
                    const rasterLayerId = `arcgis-raster-layer-custom-${service.key}-${layerId}`;
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
                        paint: { 'raster-opacity': layerOpacity }
                    });
                }
            });

            prevCheckedLayerIds.current[service.key] = currChecked;
            prevCheckedLayerIds.current[`${service.key}_sublayers`] = JSON.parse(JSON.stringify(serviceSublayers));
        });
        // eslint-disable-next-line
    }, [checkedLayerIds, serviceLayers, checkedSublayerIds]);

    // Opacity change handler — update all custom raster + vector layers
    const handleOpacityChange = (newOpacity) => {
        setLayerOpacity(newOpacity);
        const map = mapInstance && mapInstance();
        if (!map || !map.getStyle) return;
        const style = map.getStyle();
        if (!style || !Array.isArray(style.layers)) return;
        style.layers.forEach(l => {
            if (l.id.startsWith('arcgis-raster-layer-custom-')) {
                map.setPaintProperty(l.id, 'raster-opacity', newOpacity);
            } else if (l.id.startsWith('arcgis-vector-layer-custom-')) {
                if (l.type === 'fill') {
                    map.setPaintProperty(l.id, 'fill-opacity', newOpacity);
                } else if (l.type === 'line') {
                    map.setPaintProperty(l.id, 'line-opacity', newOpacity);
                } else if (l.type === 'circle') {
                    map.setPaintProperty(l.id, 'circle-opacity', newOpacity);
                }
            }
        });
    };

    // Helper to remove all map layers for a service
    const removeAllMapLayers = useCallback((service) => {
        const map = mapInstance && mapInstance();
        if (!map) return;
        const layers = serviceLayers[service.key] || [];
        layers.forEach(layer => {
            // Vector
            const baseId = `arcgis-vector-layer-custom-${service.key}-${layer.id}`;
            [baseId, `${baseId}-outline`, `${baseId}-circle`].forEach(lid => {
                if (map.getLayer(lid)) map.removeLayer(lid);
            });
            const vecSrc = `arcgis-vector-source-custom-${service.key}-${layer.id}`;
            if (map.getSource(vecSrc)) map.removeSource(vecSrc);
            // Raster
            const style = map.getStyle();
            if (style?.layers) {
                style.layers
                    .filter(l => l.id.startsWith(`arcgis-raster-layer-custom-${service.key}-${layer.id}`))
                    .forEach(l => { if (map.getLayer(l.id)) map.removeLayer(l.id); });
            }
            if (style?.sources) {
                Object.keys(style.sources)
                    .filter(id => id.startsWith(`arcgis-raster-custom-${service.key}-${layer.id}`))
                    .forEach(id => { if (map.getSource(id)) map.removeSource(id); });
            }
        });
    }, [mapInstance, serviceLayers]);

    // Handlers
    const handleFolderClick = (folder) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folder)) next.delete(folder); else next.add(folder);
            return next;
        });
    };

    const handleServiceClick = (serviceKey) => {
        setExpandedServices(prev => {
            const next = new Set(prev);
            if (next.has(serviceKey)) next.delete(serviceKey); else next.add(serviceKey);
            return next;
        });
    };

    const handleLayerClick = (serviceKey, layerId) => {
        const expandKey = `${serviceKey}-${layerId}`;
        setExpandedLayers(prev => {
            const next = new Set(prev);
            if (next.has(expandKey)) next.delete(expandKey); else next.add(expandKey);
            return next;
        });
    };

    const handleLayerCheckbox = (service, layerId, allFeatureLayers) => {
        setCheckedLayerIds(prev => {
            const prevChecked = prev[service.key] || [];
            let newChecked;
            if (prevChecked.includes(layerId)) {
                newChecked = prevChecked.filter(id => id !== layerId);
                // Uncheck sublayers
                setCheckedSublayerIds(prevSub => ({
                    ...prevSub,
                    [service.key]: { ...prevSub[service.key], [layerId]: [] }
                }));
            } else {
                newChecked = [...prevChecked, layerId];
                // Check all sublayers
                const legend = serviceLegends[service.key];
                if (legend && legend.layers) {
                    const legendLayer = legend.layers.find(l => l.layerId === layerId);
                    if (legendLayer && legendLayer.legend) {
                        setCheckedSublayerIds(prevSub => ({
                            ...prevSub,
                            [service.key]: {
                                ...prevSub[service.key],
                                [layerId]: legendLayer.legend.map((_, i) => i)
                            }
                        }));
                    }
                }
            }
            setServiceLayerAdded(prevAdded => ({ ...prevAdded, [service.key]: newChecked.length > 0 }));
            return { ...prev, [service.key]: newChecked };
        });
    };

    const handleSelectAll = (service, allFeatureLayers) => {
        const allIds = allFeatureLayers.map(l => l.id);
        const isAllChecked = (checkedLayerIds[service.key] || []).length === allIds.length;
        if (isAllChecked) {
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: [] }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: false }));
            setCheckedSublayerIds(prev => ({ ...prev, [service.key]: {} }));
        } else {
            setCheckedLayerIds(prev => ({ ...prev, [service.key]: allIds }));
            setServiceLayerAdded(prev => ({ ...prev, [service.key]: true }));
            const newSublayerIds = {};
            allFeatureLayers.forEach(layer => {
                const legend = serviceLegends[service.key];
                if (legend && legend.layers) {
                    const legendLayer = legend.layers.find(l => l.layerId === layer.id);
                    if (legendLayer && legendLayer.legend && legendLayer.legend.length > 1) {
                        newSublayerIds[layer.id] = legendLayer.legend.map((_, i) => i);
                    }
                }
            });
            setCheckedSublayerIds(prev => ({ ...prev, [service.key]: newSublayerIds }));
        }
    };

    const handleGroupLayerCheckbox = (service, node, allChecked) => {
        const descendantLeaves = getDescendantLeafLayers(node);
        const descendantIds = descendantLeaves.map(l => l.id);
        if (descendantIds.length === 0) return;
        if (allChecked) {
            setCheckedLayerIds(prev => ({
                ...prev,
                [service.key]: (prev[service.key] || []).filter(id => !descendantIds.includes(id))
            }));
            setCheckedSublayerIds(prev => {
                const updated = { ...prev[service.key] };
                descendantIds.forEach(id => { updated[id] = []; });
                return { ...prev, [service.key]: updated };
            });
        } else {
            setCheckedLayerIds(prev => {
                const current = prev[service.key] || [];
                return { ...prev, [service.key]: [...new Set([...current, ...descendantIds])] };
            });
            const newSublayerIds = { ...(checkedSublayerIds[service.key] || {}) };
            descendantLeaves.forEach(layer => {
                const legend = serviceLegends[service.key];
                if (legend && legend.layers) {
                    const legendLayer = legend.layers.find(l => l.layerId === layer.id);
                    if (legendLayer && legendLayer.legend && legendLayer.legend.length > 1) {
                        newSublayerIds[layer.id] = legendLayer.legend.map((_, i) => i);
                    }
                }
            });
            setCheckedSublayerIds(prev => ({ ...prev, [service.key]: newSublayerIds }));
        }
        setServiceLayerAdded(prev => ({ ...prev, [service.key]: !allChecked }));
    };

    const handleSublayerCheckbox = (service, layerId, sublayerIndex, allFeatureLayers) => {
        setCheckedSublayerIds(prev => {
            const serviceSubIds = prev[service.key] || {};
            const layerSubIds = serviceSubIds[layerId] || [];
            let newLayerSubIds;
            if (layerSubIds.includes(sublayerIndex)) {
                newLayerSubIds = layerSubIds.filter(id => id !== sublayerIndex);
            } else {
                newLayerSubIds = [...layerSubIds, sublayerIndex];
            }
            // If no sublayers checked, uncheck parent layer
            if (newLayerSubIds.length === 0) {
                setCheckedLayerIds(prevChecked => ({
                    ...prevChecked,
                    [service.key]: (prevChecked[service.key] || []).filter(id => id !== layerId)
                }));
            } else {
                // If at least one sublayer, check parent layer
                setCheckedLayerIds(prevChecked => {
                    const currentChecked = prevChecked[service.key] || [];
                    if (!currentChecked.includes(layerId)) {
                        return { ...prevChecked, [service.key]: [...currentChecked, layerId] };
                    }
                    return prevChecked;
                });
            }
            setServiceLayerAdded(prevAdded => {
                const allCheckedLayers = Object.keys({ ...serviceSubIds, [layerId]: newLayerSubIds })
                    .filter(lid => {
                        const subIds = String(lid) === String(layerId) ? newLayerSubIds : serviceSubIds[lid] || [];
                        return subIds.length > 0;
                    });
                return { ...prevAdded, [service.key]: allCheckedLayers.length > 0 };
            });
            return { ...prev, [service.key]: { ...serviceSubIds, [layerId]: newLayerSubIds } };
        });
    };

    // Rename handlers (local state update)
    const handleFolderRename = (oldName, newName) => {
        if (!newName || newName.trim() === '' || oldName === newName) return;
        setCustomServices(prev => prev.map(s =>
            s.folder === oldName ? { ...s, folder: newName } : s
        ));
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(oldName)) { next.delete(oldName); next.add(newName); }
            return next;
        });
    };

    const handleServiceRename = (serviceKey, newLabel) => {
        if (!newLabel || newLabel.trim() === '') return;
        setCustomServices(prev => prev.map(s =>
            s.key === serviceKey ? { ...s, label: newLabel } : s
        ));
    };

    // --- Drag-and-drop reorder ---
    const [dragItem, setDragItem] = useState(null); // { type: 'folder'|'service', key, folder? }
    const [dragOverItem, setDragOverItem] = useState(null); // same shape

    const persistOrder = useCallback((services) => {
        const order = services.map((s, i) => ({
            service_key: s.key,
            folder: s.folder,
            sort_order: i,
        }));
        reorderCustomLayers(userEmail, order).catch(err =>
            console.warn('[CustomLayersPanel] Failed to persist reorder:', err)
        );
    }, [userEmail]);

    const handleDragStart = (e, type, key, folder) => {
        setDragItem({ type, key, folder });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, type, key, folder) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverItem({ type, key, folder });
    };

    const handleDragEnd = () => {
        setDragItem(null);
        setDragOverItem(null);
    };

    const handleFolderDrop = (e, targetFolder) => {
        e.preventDefault();
        if (!dragItem || dragItem.type !== 'folder' || dragItem.key === targetFolder) {
            handleDragEnd();
            return;
        }
        // Reorder folders by moving all services of dragItem.key folder before targetFolder
        setCustomServices(prev => {
            const dragServices = prev.filter(s => (s.folder || 'Root') === dragItem.key);
            const rest = prev.filter(s => (s.folder || 'Root') !== dragItem.key);
            // Find the index of first service of target folder
            const targetIdx = rest.findIndex(s => (s.folder || 'Root') === targetFolder);
            const result = [...rest];
            result.splice(targetIdx >= 0 ? targetIdx : result.length, 0, ...dragServices);
            // Reassign sort_order
            const updated = result.map((s, i) => ({ ...s, sort_order: i }));
            persistOrder(updated);
            return updated;
        });
        handleDragEnd();
    };

    const handleServiceDrop = (e, targetServiceKey, targetFolder) => {
        e.preventDefault();
        if (!dragItem || dragItem.type !== 'service' || dragItem.key === targetServiceKey) {
            handleDragEnd();
            return;
        }
        setCustomServices(prev => {
            const dragIdx = prev.findIndex(s => s.key === dragItem.key);
            if (dragIdx < 0) return prev;
            const draggedService = { ...prev[dragIdx], folder: targetFolder };
            const rest = prev.filter((_, i) => i !== dragIdx);
            const targetIdx = rest.findIndex(s => s.key === targetServiceKey);
            const result = [...rest];
            result.splice(targetIdx >= 0 ? targetIdx : result.length, 0, draggedService);
            const updated = result.map((s, i) => ({ ...s, sort_order: i }));
            persistOrder(updated);
            return updated;
        });
        handleDragEnd();
    };

    // Context menu handlers (panel-specific; state + pin from hook)
    const handleRemoveCustomLayer = async () => {
        if (!contextMenu || contextMenu.type !== 'service') return;
        const service = contextMenu.data.service;
        closeContextMenu();
        try {
            await deleteCustomLayer(userEmail, service.key);
            removeAllMapLayers(service);
            setCustomServices(prev => prev.filter(s => s.key !== service.key));
            setServiceLayerAdded(prev => { const n = { ...prev }; delete n[service.key]; return n; });
            setCheckedLayerIds(prev => { const n = { ...prev }; delete n[service.key]; return n; });
            setCheckedSublayerIds(prev => { const n = { ...prev }; delete n[service.key]; return n; });
            showStatus(`Removed "${service.label}" from custom layers`);
        } catch (err) {
            showStatus(`Failed to remove: ${err.message}`);
        }
    };

    const handleContextRename = () => {
        if (!contextMenu) return;
        const { type, data } = contextMenu;
        if (type === 'folder') {
            setRenamingItem({ type: 'folder', key: data.folder });
        } else if (type === 'service') {
            setRenamingItem({ type: 'service', key: data.service.key });
        }
        closeContextMenu();
    };

    const handleContextLearnMore = () => {
        if (!contextMenu) return;
        const { type, data } = contextMenu;
        if (type === 'service') {
            openServiceInfo(data.service);
        } else if (type === 'layer') {
            openLayerInfo(data.service, data.layer);
        }
        closeContextMenu();
    };

    // Learn More handlers
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
    const closeServiceInfo = () => setServiceInfoOpenKey(null);

    const openLayerInfo = async (service, layer) => {
        const layerData = {
            serviceKey: service.key,
            layerId: layer.id,
            layerName: layer.name,
            serviceUrl: service.url,
        };
        setLayerInfoOpen(layerData);
        const cacheKey = `${service.key}-${layer.id}`;
        if (layerInfoCache[cacheKey]) return;
        setLayerInfoLoading(true);
        try {
            const info = await fetchArcgisLayerInfo(service.url, layer.id);
            setLayerInfoCache(prev => ({ ...prev, [cacheKey]: info || {} }));
        } finally {
            setLayerInfoLoading(false);
        }
    };
    const closeLayerInfo = () => setLayerInfoOpen(null);

    // Helper: convert HTML to plain text
    function toPlainText(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || '';
        return text.replace(/\u00A0/g, ' ').trim();
    }

    // Render a layer tree node using the shared component
    const renderLayerNode = (node, service, checkedIds, allFeatureLayers, depth = 0) => (
        <LayerTreeNode
            key={node.id}
            node={node}
            service={service}
            checkedIds={checkedIds}
            allFeatureLayers={allFeatureLayers}
            serviceLegends={serviceLegends}
            checkedSublayerIds={checkedSublayerIds}
            expandedLayers={expandedLayers}
            searchResult={searchResult}
            onLayerClick={handleLayerClick}
            onLayerCheckbox={handleLayerCheckbox}
            onGroupCheckbox={handleGroupLayerCheckbox}
            onSublayerCheckbox={handleSublayerCheckbox}
            onContextMenu={handleContextMenu}
            depth={depth}
        />
    );

    if (!isOpen) return null;

    if (!userEmail) {
        return (
            <div className={`custom-layers-panel${splitBottom ? ' custom-layers-panel--split-bottom' : ''}`}>
                <div className="custom-layers-panel-header">
                    <h3>Custom Layers</h3>
                    <button className="custom-layers-panel-close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="custom-layers-panel-empty">
                    Please log in to use custom layers.
                </div>
            </div>
        );
    }

    return (
        <div className={`custom-layers-panel${splitBottom ? ' custom-layers-panel--split-bottom' : ''}`}
             onContextMenu={e => e.preventDefault()}>
            <div className="custom-layers-panel-header">
                <h3>Custom Layers</h3>
                <button className="custom-layers-panel-close-btn" onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            {/* Sticky toolbar: search bar, opacity, show-added-only */}
            <div className="custom-layers-panel-sticky-toolbar">
                {/* Search bar */}
                <div className="upload-panel-searchbar">
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
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
                        className="search-btn upload-panel-searchbar-btn search"
                        title="Search"
                        onClick={doSearch}
                    >
                        <FontAwesomeIcon icon={faSearch} />
                    </button>
                    <button
                        className="clear-btn upload-panel-searchbar-btn clear"
                        title="Clear Search"
                        onClick={clearSearch}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Opacity slider */}
                <div className="upload-panel-opacity-slider-row">
                    <label>Layer Opacity:</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={layerOpacity}
                        onChange={e => handleOpacityChange(parseFloat(e.target.value))}
                        className="upload-panel-opacity-slider"
                        style={{ '--slider-pct': `${layerOpacity * 100}%` }}
                    />
                    <span className="upload-panel-opacity-value">{Math.round(layerOpacity * 100)}%</span>
                </div>

                {/* Show only added to map */}
                <div className="upload-panel-added-checkbox-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={showAddedOnly}
                            onChange={e => {
                                setShowAddedOnly(e.target.checked);
                                if (e.target.checked) {
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
                                    setExpandedLayers(new Set());
                                }
                            }}
                            style={{ marginRight: 8 }}
                        />
                        Show only services added to map
                    </label>
                </div>
            </div>

            {isLoading && (
                <div className="custom-layers-panel-empty">Loading custom layers...</div>
            )}

            {!isLoading && customServices.length === 0 && (
                <div className="custom-layers-panel-empty">
                    No custom layers saved yet.<br />
                    Right-click a layer in the GIS Services panel and select "Save to Custom Layers".
                </div>
            )}

            {!isLoading && customServices.length > 0 && (
                <div className="custom-layers-panel-folder-area">
                    {foldersToShow.map(folder => {
                        const services = servicesByFolderToShow[folder] || [];
                        const isFolderExpanded = expandedFolders.has(folder);
                        const isFolderDragging = dragItem?.type === 'folder' && dragItem?.key === folder;
                        const isFolderDragOver = dragOverItem?.type === 'folder' && dragOverItem?.key === folder && dragItem?.type === 'folder';
                        return (
                            <div key={folder}
                                style={{ opacity: isFolderDragging ? 0.4 : 1 }}
                            >
                                <div
                                    className={`custom-layers-folder${isFolderDragOver ? ' drag-over' : ''}`}
                                    onClick={() => handleFolderClick(folder)}
                                    onContextMenu={(e) => handleContextMenu(e, 'folder', { folder })}
                                    onDragOver={(e) => handleDragOver(e, 'folder', folder)}
                                    onDrop={(e) => handleFolderDrop(e, folder)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <span
                                        className="drag-handle"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, 'folder', folder)}
                                        onClick={(e) => e.stopPropagation()}
                                        title="Drag to reorder"
                                    >⠿</span>
                                    <ArcgisRenameItem
                                        value={folder}
                                        displayValue={`${isFolderExpanded ? '▼' : '►'} ${folder}`}
                                        onSave={(newName) => handleFolderRename(folder, newName)}
                                        placeholder="Enter folder name..."
                                        isFolder={true}
                                        disabled={true}
                                        startEditing={renamingItem?.type === 'folder' && renamingItem?.key === folder}
                                        onEditingDone={() => setRenamingItem(null)}
                                    />
                                    <span style={{ color: '#999', fontSize: '10px', marginLeft: 'auto' }}>
                                        ({services.length})
                                    </span>
                                </div>
                                {isFolderExpanded && (
                                    <div className="custom-layers-folder-content">
                                        {services.map(service => {
                                            const layers = serviceLayers[service.key] || [];
                                            const checkedIds = checkedLayerIds[service.key] || [];
                                            const rawLayers = layers.length > 0 ? layers : [];
                                            const layerTree = buildLayerTree(Array.isArray(rawLayers) ? rawLayers : []);
                                            const allFeatureLayers = getAllLeafLayers(layerTree);
                                            const isServiceExpanded = expandedServices.has(service.key);
                                            const isServiceDragging = dragItem?.type === 'service' && dragItem?.key === service.key;
                                            const isServiceDragOver = dragOverItem?.type === 'service' && dragOverItem?.key === service.key && dragItem?.type === 'service';

                                            return (
                                                <div key={service.key} style={{ opacity: isServiceDragging ? 0.4 : 1 }}>
                                                    <div
                                                        className={`custom-layers-item${isServiceDragOver ? ' drag-over' : ''}`}
                                                        onClick={() => handleServiceClick(service.key)}
                                                        onContextMenu={(e) => handleContextMenu(e, 'service', { service, layersToShow: allFeatureLayers })}
                                                        onDragOver={(e) => handleDragOver(e, 'service', service.key, folder)}
                                                        onDrop={(e) => handleServiceDrop(e, service.key, folder)}
                                                        onDragEnd={handleDragEnd}
                                                    >
                                                        <span
                                                            className="drag-handle"
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, 'service', service.key, folder)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            title="Drag to reorder"
                                                        >⠿</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={checkedIds.length > 0 && checkedIds.length === allFeatureLayers.length}
                                                            ref={el => {
                                                                if (el) el.indeterminate = checkedIds.length > 0 && checkedIds.length < allFeatureLayers.length;
                                                            }}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                handleSelectAll(service, allFeatureLayers);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ marginRight: 4, flexShrink: 0 }}
                                                        />
                                                        {isServiceExpanded ? "▼" : "►"}
                                                        <ArcgisRenameItem
                                                            value={service.label}
                                                            displayValue={service.label}
                                                            onSave={(newLabel) => handleServiceRename(service.key, newLabel)}
                                                            placeholder="Enter service name..."
                                                            isFolder={false}
                                                            disabled={true}
                                                            startEditing={renamingItem?.type === 'service' && renamingItem?.key === service.key}
                                                            onEditingDone={() => setRenamingItem(null)}
                                                        />
                                                        {service.state && (
                                                            <span style={{ color: '#999', fontSize: '10px', marginLeft: 'auto' }}>
                                                                {service.state.substring(0, 2).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isServiceExpanded && layerTree.length > 0 && (
                                                        <div className="tree-children" style={{ paddingLeft: 16 }}>
                                                            {layerTree.map(node =>
                                                                renderLayerNode(node, service, checkedIds, allFeatureLayers)
                                                            )}
                                                        </div>
                                                    )}
                                                    {isServiceExpanded && layerTree.length === 0 && (
                                                        <div style={{ paddingLeft: 24, color: '#999', fontSize: 11, padding: '4px 0 4px 24px' }}>
                                                            Loading layers...
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Context Menu */}
            <LayerContextMenuPopup
                contextMenu={contextMenu}
                isPinned={isPinned}
                onRename={handleContextRename}
                onLearnMore={handleContextLearnMore}
                onTogglePin={handleTogglePin}
                extraServiceItems={[
                    { label: 'Remove from Custom Layers', onClick: handleRemoveCustomLayer },
                ]}
            />

            {/* Status messages */}
            {statusMsg && (
                <div className="custom-layers-loading-messages">
                    <div className="custom-layers-loading-message">{statusMsg}</div>
                </div>
            )}

            {/* Service Info Modal */}
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
                            const currentService = customServices.find(s => s.key === serviceInfoOpenKey);
                            if (!info || Object.keys(info).length === 0) {
                                return (
                                    <div>
                                        <div className="arcgis-service-info-empty">No information available.</div>
                                        {currentService && currentService.url && (
                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                                                <a href={currentService.url} target="_blank" rel="noopener noreferrer"
                                                    style={{ color: '#1976d2', textDecoration: 'none' }}>
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
                                    {currentService && currentService.url && (
                                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                                            <a href={currentService.url} target="_blank" rel="noopener noreferrer"
                                                style={{ color: '#1976d2', textDecoration: 'none' }}>
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

            {/* Layer Info Modal */}
            {layerInfoOpen && (
                <div className="arcgis-service-info-modal">
                    <div className="arcgis-service-info-modal-header">
                        <strong>Layer Info: {layerInfoOpen.layerName}</strong>
                        <button
                            className="arcgis-service-info-modal-close"
                            onClick={closeLayerInfo}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                    </div>
                    <div className="arcgis-service-info-modal-content">
                        {layerInfoLoading && <div>Loading layer info…</div>}
                        {!layerInfoLoading && (() => {
                            const cacheKey = `${layerInfoOpen.serviceKey}-${layerInfoOpen.layerId}`;
                            const info = layerInfoCache[cacheKey];
                            if (!info || Object.keys(info).length === 0) {
                                return (
                                    <div>
                                        <div className="arcgis-service-info-empty">No layer information available.</div>
                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                                            <a href={`${layerInfoOpen.serviceUrl}/${layerInfoOpen.layerId}`}
                                                target="_blank" rel="noopener noreferrer"
                                                style={{ color: '#1976d2', textDecoration: 'none' }}>
                                                View ArcGIS Layer Page →
                                            </a>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div>
                                    {info.description && (
                                        <div className="arcgis-service-info-row">
                                            <strong>Description:</strong>
                                            <div className="arcgis-service-info-description">
                                                {toPlainText(info.description)}
                                            </div>
                                        </div>
                                    )}
                                    {info.name && (
                                        <div className="arcgis-service-info-row">
                                            <strong>Layer Name:</strong> {info.name}
                                        </div>
                                    )}
                                    {info.type && (
                                        <div className="arcgis-service-info-row">
                                            <strong>Geometry Type:</strong> {info.type}
                                        </div>
                                    )}
                                    {info.copyrightText && (
                                        <div className="arcgis-service-info-row">
                                            <strong>Copyright Text:</strong> {toPlainText(info.copyrightText)}
                                        </div>
                                    )}
                                    {info.minScale && (
                                        <div className="arcgis-service-info-row">
                                            <strong>Min Scale:</strong> {info.minScale.toLocaleString()}
                                        </div>
                                    )}
                                    {info.maxScale && (
                                        <div className="arcgis-service-info-row">
                                            <strong>Max Scale:</strong> {info.maxScale.toLocaleString()}
                                        </div>
                                    )}
                                    {info.defaultVisibility !== undefined && (
                                        <div className="arcgis-service-info-row">
                                            <strong>Default Visibility:</strong> {info.defaultVisibility ? 'Visible' : 'Hidden'}
                                        </div>
                                    )}
                                    {info.hasAttachments !== undefined && (
                                        <div className="arcgis-service-info-row">
                                            <strong>Has Attachments:</strong> {info.hasAttachments ? 'Yes' : 'No'}
                                        </div>
                                    )}
                                    {info.fields && info.fields.length > 0 && (
                                        <div className="arcgis-service-info-row">
                                            <strong>Fields:</strong> {info.fields.length} field(s)
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                {info.fields.slice(0, 5).map(field => field.name).join(', ')}
                                                {info.fields.length > 5 && '...'}
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                                        <a href={`${layerInfoOpen.serviceUrl}/${layerInfoOpen.layerId}`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{ color: '#1976d2', textDecoration: 'none' }}>
                                            View ArcGIS Layer Page →
                                        </a>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomLayersPanel;
