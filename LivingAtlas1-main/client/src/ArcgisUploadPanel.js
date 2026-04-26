import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { addArcgisVectorLayer } from './arcgisVectorUtils';
import { showArcgisPopup } from './arcgisPopupUtils';
import {
    fetchArcgisLayers,
    fetchArcgisLegend,
    getArcgisTileUrl,
    fetchArcgisServiceInfo,
    fetchArcgisLayerInfo
} from './arcgisDataUtils';
import { 
    fetchServicesByStateMap,
    removeArcgisService, 
    renameFolderServices, 
    renameService,
    saveLayerSelections,
    loadLayerSelections,
    saveCustomLayer
} from './arcgisServicesDb'; // Fetch from DB
import { updateCurrentStateServices } from './arcgisUpdateServices';
import ArcgisRenameItem from './ArcgisRenameItem';
// Import local JSON files as fallback
import WA_ARCGIS_SERVICES from './arcgis_services_wa.json';
import ID_ARCGIS_SERVICES from './arcgis_services_id.json';
import OR_ARCGIS_SERVICES from './arcgis_services_or.json';
import { filterUploadPanelData } from './arcgisUploadSearchUtils';
import { buildLayerTree, getAllLeafLayers, getDescendantLeafLayers, LayerTreeNode } from './LayerTree';
import { useLayerContextMenu, LayerContextMenuPopup } from './LayerContextMenu';
import './ArcgisUploadPanel.css';
import './ArcgisUploadPanelStateMenu.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faSync } from '@fortawesome/free-solid-svg-icons';
import {
    useArcgisLoadingMessages,
    getLoadingMsgId,
    getLoadingMsgText
} from './arcgisUploadMessageUtils';

// --- State selector ---
const STATE_CODES = ['WA', 'ID', 'OR'];
const STATE_LABELS = { WA: 'WA', ID: 'ID', OR: 'OR' };
const STATE_FULL_NAMES = { WA: 'Washington State ArcGIS Services', ID: 'Idaho ArcGIS Services', OR: 'Oregon ArcGIS Services' };
const STATE_CODE_TO_NAME = { WA: 'washington', ID: 'idaho', OR: 'oregon' };

// Local JSON fallback data
const ARCGIS_SERVICES_BY_STATE = {
    WA: WA_ARCGIS_SERVICES || [],
    ID: ID_ARCGIS_SERVICES || [],
    OR: OR_ARCGIS_SERVICES || []
};

// State-specific attribution information
const STATE_ATTRIBUTION = {
    WA: {
        name: 'Washington State',
        url: 'https://gis.ecology.wa.gov/serverext/rest/services'
    },
    ID: {
        name: 'Idaho',
        url: 'https://gis.idwr.idaho.gov/hosting/rest/services'
    },
    OR: {
        name: 'Oregon',
        url: 'https://navigator.state.or.us/arcgis/rest/services'
    }
};

// Main component

// Built-in (hardcoded) layers that are not from ArcGIS REST services
const BUILTIN_LAYERS = [
    { id: 'River', label: 'Hydrological Boundaries' },
    { id: 'Places', label: 'City Limits' },
];
const BUILTIN_FOLDER_NAME = 'Built-in Layers';

function ArcgisUploadPanel({
    isOpen,
    onClose,
    splitBottom = false,
    mapInstance,
    arcgisLayerAdded: propArcgisLayerAdded,
    setArcgisLayerAdded: setPropArcgisLayerAdded,
    isAdmin = false,
    areaVisibility = {},
    handleAreaCheckbox,
    navigateToItem = null,
    onNavigateToItemDone,
}) {
    // Track selected state
    const [selectedState, setSelectedState] = useState('WA');

    // Data source selection: 'database' or 'local'
    const [dataSource, setDataSource] = useState('database');

    // Services fetched from DB for selected state
    const [servicesFromDb, setServicesFromDb] = useState({});
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [servicesError, setServicesError] = useState(null);
    const [usingFallback, setUsingFallback] = useState(false);

    // Use services based on data source selection
    // OLD single-state logic (kept for reference):
    // const ARCGIS_SERVICES = dataSource === 'local' 
    //     ? (ARCGIS_SERVICES_BY_STATE[selectedState] || [])
    //     : (servicesFromDb.length > 0 
    //         ? servicesFromDb 
    //         : (ARCGIS_SERVICES_BY_STATE[selectedState] || []));

    // NEW: Combine all states into a single list
    const ALL_SERVICES_BY_STATE = {};
    STATE_CODES.forEach(code => {
        if (dataSource === 'local') {
            ALL_SERVICES_BY_STATE[code] = ARCGIS_SERVICES_BY_STATE[code] || [];
        } else {
            ALL_SERVICES_BY_STATE[code] = (servicesFromDb[code] && servicesFromDb[code].length > 0)
                ? servicesFromDb[code]
                : (ARCGIS_SERVICES_BY_STATE[code] || []);
        }
    });
    const ARCGIS_SERVICES = STATE_CODES.flatMap(code => ALL_SERVICES_BY_STATE[code]);

    // Group services by state, then by folder
    const servicesByStateAndFolder = {};
    STATE_CODES.forEach(code => {
        const byFolder = {};
        (ALL_SERVICES_BY_STATE[code] || []).forEach(service => {
            const folder = service.folder || 'Root';
            if (!byFolder[folder]) byFolder[folder] = [];
            byFolder[folder].push(service);
        });
        servicesByStateAndFolder[code] = {
            folders: byFolder,
            folderNames: Object.keys(byFolder).sort(),
        };
    });

    // Flat servicesByFolder (for search compatibility)
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
    const [expandedStates, setExpandedStates] = useState(new Set()); // Track which state-level folders are expanded
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [expandedServices, setExpandedServices] = useState(new Set());
    const [expandedLayers, setExpandedLayers] = useState(new Set()); // Track which layers are expanded
    // State for added-only checkbox
    const [showAddedOnly, setShowAddedOnly] = useState(false);

    // Opacity slider state (0 to 1)
    const [layerOpacity, setLayerOpacity] = useState(0.7);

    // Track previous checkedLayerIds for diffing
    const prevCheckedLayerIds = useRef({});

    // Track loading states for layers to reliably check completion
    const loadingStates = useRef({}); // { messageId: boolean }

    // Navigation target tracking
    const pendingNavigateRef = useRef(null); // { serviceKey, layerId, stateCode, folderName }
    const folderAreaRef = useRef(null); // ref to upload-panel-folder-area for scrolling

    // Persistence: track whether saved selections have been loaded for current state/datasource
    const selectionsLoadedRef = useRef(false);
    const saveTimerRef = useRef(null);
    const userEmail = localStorage.getItem('email') || '';

    const {
        messages,
        addLoadingMessage: originalAddLoadingMessage,
        removeLoadingMessage: originalRemoveLoadingMessage,
        showFinishedMessage
    } = useArcgisLoadingMessages();

    // Whether any map layer is currently loading (for spinner overlay)
    const [isMapLayerLoading, setIsMapLayerLoading] = useState(false);
    const [mapContainerEl, setMapContainerEl] = useState(null);

    // Keep map container element reference in sync
    useEffect(() => {
        const map = mapInstance && mapInstance();
        if (map && map.getContainer) {
            const container = map.getContainer();
            if (container && container !== mapContainerEl) {
                container.style.position = 'relative';
                setMapContainerEl(container);
            }
        }
    });

    // Wrapped functions to track loading states
    const addLoadingMessage = (id, text) => {
        loadingStates.current[id] = true;
        setIsMapLayerLoading(true);
        originalAddLoadingMessage(id, text);
    };

    const removeLoadingMessage = (id) => {
        loadingStates.current[id] = false;
        // Check if any layer is still loading
        const stillLoading = Object.values(loadingStates.current).some(v => v === true);
        if (!stillLoading) setIsMapLayerLoading(false);
        originalRemoveLoadingMessage(id);
    };

    // Service info modal state ---
    const [serviceInfoOpenKey, setServiceInfoOpenKey] = useState(null); // service.key
    const [serviceInfoCache, setServiceInfoCache] = useState({}); // { key: info }
    const [serviceInfoLoading, setServiceInfoLoading] = useState(false);

    // Layer info modal state ---
    const [layerInfoOpen, setLayerInfoOpen] = useState(null); // { serviceKey, layerId, layerName, serviceUrl }
    const [layerInfoCache, setLayerInfoCache] = useState({}); // { "serviceKey-layerId": info }
    const [layerInfoLoading, setLayerInfoLoading] = useState(false);

    // Add new state for sublayer checkboxes (add this near other state declarations)
    const [checkedSublayerIds, setCheckedSublayerIds] = useState({});

    const [renamingItem, setRenamingItem] = useState(null); // { type, key } to trigger rename externally

    // Update functionality state
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateProgress, setUpdateProgress] = useState('');
    const [updateResults, setUpdateResults] = useState(null);

    // Handle data source switching with user feedback
    const handleDataSourceChange = (newDataSource) => {
        if (newDataSource === dataSource) return;
        
        console.log(`[ArcgisUploadPanel] Switching data source from ${dataSource} to ${newDataSource}`);
        setDataSource(newDataSource);
        
        // Show temporary message about the switch
        if (newDataSource === 'local') {
            showFinishedMessage('Switched to local JSON data');
        } else {
            showFinishedMessage('Switched to database data');
        }
    };

    // Fetch services from DB whenever panel opens or data source changes
    useEffect(() => {
        if (!isOpen) return;
        
        // If local data source is selected, skip database fetch
        if (dataSource === 'local') {
            setServicesFromDb({});
            setIsLoadingServices(false);
            setServicesError(null);
            setUsingFallback(false);
            return;
        }

        let active = true;
        
        (async () => {
            setIsLoadingServices(true);
            setServicesError(null);
            setUsingFallback(false);
            
            try {
                console.log(`[ArcgisUploadPanel] Attempting to fetch services from backend for all states...`);
                const stateMap = await fetchServicesByStateMap(STATE_CODES, { type: 'MapServer' });
                
                if (active) {
                    const totalCount = STATE_CODES.reduce((sum, c) => sum + (stateMap[c] || []).length, 0);
                    if (totalCount > 0) {
                        setServicesFromDb(stateMap);
                        setUsingFallback(false);
                        console.log(`[ArcgisUploadPanel] Loaded ${totalCount} services from backend for all states`);
                    } else {
                        console.warn(`[ArcgisUploadPanel] Backend returned no services, using local fallback`);
                        setServicesFromDb({});
                        setUsingFallback(true);
                        setDataSource('local');
                    }
                }
            } catch (error) {
                console.error(`[ArcgisUploadPanel] Failed to load from backend, using local fallback:`, error);
                if (active) {
                    setServicesFromDb({});
                    setUsingFallback(true);
                    setServicesError(`Backend unavailable (using local data): ${error.message || 'Network error'}`);
                    setDataSource('local');
                }
            } finally {
                if (active) {
                    setIsLoadingServices(false);
                }
            }
        })();
        
        return () => { active = false; };
    }, [isOpen, dataSource]);

    // Show data source status as bottom notification
    useEffect(() => {
        const msgId = 'data-source-status';
        if (isLoadingServices && dataSource === 'database') {
            addLoadingMessage(msgId, `🔄 Loading ArcGIS services from database...`);
        } else {
            removeLoadingMessage(msgId);
            if (dataSource === 'local' && !usingFallback) {
                showFinishedMessage(msgId, `📂 Using local JSON data (${ARCGIS_SERVICES.length} services)`);
            } else if (dataSource === 'database' && usingFallback) {
                showFinishedMessage(msgId, `📂 Database unavailable, using local data`);
            } else if (dataSource === 'database' && !isLoadingServices && ARCGIS_SERVICES.length > 0) {
                showFinishedMessage(msgId, `🌐 Loaded from database: ${ARCGIS_SERVICES.length} services`);
            }
        }
    }, [isLoadingServices, dataSource, usingFallback, ARCGIS_SERVICES.length]);

    // Reset state when data source changes (but not when panel just opens/closes)
    useEffect(() => {
        // Reset per-datasource caches/UI
        setServiceLayers({});
        setServiceLegends({});
        setCheckedLayerIds({});
        setServiceLayerAdded({});
        setCheckedSublayerIds({});
        setExpandedStates(new Set());
        setExpandedFolders(new Set());
        setExpandedServices(new Set());
        setExpandedLayers(new Set());
        setServiceInfoOpenKey(null);
        setSearchKeyword('');
        setSearchResult(null);
        prevCheckedLayerIds.current = {};
        loadingStates.current = {};
        setIsMapLayerLoading(false);
        selectionsLoadedRef.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataSource, ARCGIS_SERVICES.length]); // Only reset when datasource changes

    // Lazy-load layers and legends only for services in expanded state folders
    useEffect(() => {
        if (!isOpen) return;

        // Only fetch layers/legends for services belonging to expanded states
        const expandedStateServices = [];
        expandedStates.forEach(code => {
            (ALL_SERVICES_BY_STATE[code] || []).forEach(service => {
                if (!service || service.type !== 'MapServer' || !service.url || !service.key) return;
                // Skip if already fetched
                if (serviceLayers[service.key] !== undefined) return;
                expandedStateServices.push(service);
            });
        });

        expandedStateServices.forEach(service => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, ARCGIS_SERVICES, expandedStates]); // React to panel opening, services changing, or state expansion

    // --- DB persistence disabled (kept for future use) ---
    // useEffect(() => {
    //     if (!isOpen || !userEmail || selectionsLoadedRef.current) return;
    //     if (ARCGIS_SERVICES.length === 0) return;
    //     selectionsLoadedRef.current = true;
    //     (async () => {
    //         try {
    //             const saved = await loadLayerSelections(userEmail, 'ALL', dataSource);
    //             if (!saved) return;
    //             const { checkedLayerIds: savedChecked, checkedSublayerIds: savedSublayers } = saved;
    //             if (savedChecked && Object.keys(savedChecked).length > 0) {
    //                 setCheckedLayerIds(prev => {
    //                     const merged = { ...prev };
    //                     Object.entries(savedChecked).forEach(([key, ids]) => {
    //                         if (Array.isArray(ids) && ids.length > 0) merged[key] = ids;
    //                     });
    //                     return merged;
    //                 });
    //             }
    //             if (savedSublayers && Object.keys(savedSublayers).length > 0) {
    //                 setCheckedSublayerIds(prev => {
    //                     const merged = { ...prev };
    //                     Object.entries(savedSublayers).forEach(([key, val]) => {
    //                         if (val && Object.keys(val).length > 0) merged[key] = val;
    //                     });
    //                     return merged;
    //                 });
    //             }
    //             if (savedChecked) {
    //                 const statesToExpand = new Set();
    //                 const foldersToExpand = new Set();
    //                 const servicesToExpand = new Set();
    //                 STATE_CODES.forEach(code => {
    //                     (ALL_SERVICES_BY_STATE[code] || []).forEach(service => {
    //                         const ids = savedChecked[service.key];
    //                         if (Array.isArray(ids) && ids.length > 0) {
    //                             statesToExpand.add(code);
    //                             foldersToExpand.add(service.folder || 'Root');
    //                             servicesToExpand.add(service.key);
    //                         }
    //                     });
    //                 });
    //                 if (statesToExpand.size > 0) setExpandedStates(statesToExpand);
    //                 if (foldersToExpand.size > 0) setExpandedFolders(foldersToExpand);
    //                 if (servicesToExpand.size > 0) setExpandedServices(servicesToExpand);
    //             }
    //         } catch (err) {
    //             console.warn('[ArcgisUploadPanel] Failed to load saved selections:', err);
    //         }
    //     })();
    // }, [isOpen, userEmail, dataSource, ARCGIS_SERVICES.length]);

    // const saveSelectionsToDb = useCallback(() => {
    //     if (!userEmail || !selectionsLoadedRef.current) return;
    //     const hasChecked = Object.values(checkedLayerIds).some(ids => Array.isArray(ids) && ids.length > 0);
    //     const hasSublayers = Object.values(checkedSublayerIds).some(obj => obj && Object.keys(obj).length > 0);
    //     if (!hasChecked && !hasSublayers) return;
    //     if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    //     saveTimerRef.current = setTimeout(() => {
    //         saveLayerSelections(userEmail, 'ALL', dataSource, { checkedLayerIds, checkedSublayerIds });
    //     }, 1000);
    // }, [userEmail, dataSource, checkedLayerIds, checkedSublayerIds]);
    // useEffect(() => {
    //     saveSelectionsToDb();
    //     return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    // }, [saveSelectionsToDb]);
    // --- End DB persistence disabled ---

    // --- Pinned items: localStorage-based auto-load ---
    const PINNED_STORAGE_KEY = 'arcgis_pinned_items';

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

    // Persist pinned items to localStorage whenever they change
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

    // Auto-load pinned items once services are loaded
    useEffect(() => {
        if (!isOpen || ARCGIS_SERVICES.length === 0 || pinnedItems.length === 0) return;
        if (selectionsLoadedRef.current) return;
        selectionsLoadedRef.current = true;

        const statesToExpand = new Set();
        const foldersToExpand = new Set();
        const servicesToExpand = new Set();
        const layerIdsToCheck = {}; // { serviceKey: [layerId, ...] }
        const sublayerIdsToCheck = {}; // { serviceKey: { layerId: [index, ...] } }

        pinnedItems.forEach(pin => {
            // Find the service across all states
            let foundService = null;
            let foundState = null;
            STATE_CODES.forEach(code => {
                (ALL_SERVICES_BY_STATE[code] || []).forEach(s => {
                    if (s.key === pin.serviceKey) { foundService = s; foundState = code; }
                });
            });
            if (!foundService) return;

            statesToExpand.add(foundState);
            foldersToExpand.add(foundService.folder || 'Root');
            servicesToExpand.add(pin.serviceKey);

            if (pin.layerId != null) {
                if (!layerIdsToCheck[pin.serviceKey]) layerIdsToCheck[pin.serviceKey] = [];
                if (!layerIdsToCheck[pin.serviceKey].includes(pin.layerId)) {
                    layerIdsToCheck[pin.serviceKey].push(pin.layerId);
                }
            }
            if (pin.sublayerIndex != null && pin.layerId != null) {
                if (!sublayerIdsToCheck[pin.serviceKey]) sublayerIdsToCheck[pin.serviceKey] = {};
                if (!sublayerIdsToCheck[pin.serviceKey][pin.layerId]) sublayerIdsToCheck[pin.serviceKey][pin.layerId] = [];
                sublayerIdsToCheck[pin.serviceKey][pin.layerId].push(pin.sublayerIndex);
            }
        });

        if (statesToExpand.size > 0) setExpandedStates(statesToExpand);
        if (foldersToExpand.size > 0) setExpandedFolders(foldersToExpand);
        if (servicesToExpand.size > 0) setExpandedServices(servicesToExpand);

        if (Object.keys(layerIdsToCheck).length > 0) {
            setCheckedLayerIds(prev => {
                const merged = { ...prev };
                Object.entries(layerIdsToCheck).forEach(([key, ids]) => {
                    merged[key] = [...new Set([...(merged[key] || []), ...ids])];
                });
                return merged;
            });
        }
        if (Object.keys(sublayerIdsToCheck).length > 0) {
            setCheckedSublayerIds(prev => {
                const merged = { ...prev };
                Object.entries(sublayerIdsToCheck).forEach(([sKey, layers]) => {
                    if (!merged[sKey]) merged[sKey] = {};
                    Object.entries(layers).forEach(([lid, indices]) => {
                        merged[sKey][lid] = [...new Set([...(merged[sKey][lid] || []), ...indices])];
                    });
                });
                return merged;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, ARCGIS_SERVICES.length]);

    // On state change: remove any ArcGIS layers/sources left from the previous state
    // NOTE: Disabled since states are now all loaded together as top-level folders
    // useEffect(() => {
    //     const map = mapInstance && mapInstance();
    //     if (!map || !map.getStyle) return;
    //     const style = map.getStyle();
    //     if (style && Array.isArray(style.layers)) {
    //         style.layers
    //             .map(l => l.id)
    //             .filter(id =>
    //                 id.startsWith('arcgis-raster-layer-') ||
    //                 id.startsWith('arcgis-vector-layer-')
    //             )
    //             .forEach(id => {
    //                 if (map.getLayer(id)) map.removeLayer(id);
    //             });
    //     }
    //     if (style && style.sources) {
    //         Object.keys(style.sources)
    //             .filter(id =>
    //                 id.startsWith('arcgis-raster-') ||
    //                 id.startsWith('arcgis-vector-source-')
    //             )
    //             .forEach(id => {
    //                 if (map.getSource(id)) map.removeSource(id);
    //             });
    //     }
    //     prevCheckedLayerIds.current = {};
    // }, [selectedState]);

    // Clear loading states when panel closes
    useEffect(() => {
        if (!isOpen) {
            loadingStates.current = {};
            setIsMapLayerLoading(false);
        }
    }, [isOpen]);

    // When a navigateToItem target arrives, expand tree and store pending navigation
    useEffect(() => {
        if (!navigateToItem || !isOpen) return;
        const { serviceKey, stateCode, folderName } = navigateToItem;
        pendingNavigateRef.current = navigateToItem;
        setExpandedStates(prev => new Set([...prev, stateCode]));
        setExpandedFolders(prev => new Set([...prev, folderName]));
        setExpandedServices(prev => new Set([...prev, serviceKey]));
    }, [navigateToItem, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    // Once layers for the target service are loaded, apply checkbox and scroll
    useEffect(() => {
        const target = pendingNavigateRef.current;
        if (!target) return;
        const { serviceKey, layerId } = target;
        const layers = serviceLayers[serviceKey];
        if (!layers) return; // not yet loaded

        pendingNavigateRef.current = null;

        if (layerId != null) {
            setCheckedLayerIds(prev => ({
                ...prev,
                [serviceKey]: [...new Set([...(prev[serviceKey] || []), layerId])],
            }));
        } else {
            const allIds = layers.map(l => l.id);
            setCheckedLayerIds(prev => ({ ...prev, [serviceKey]: allIds }));
        }

        // Scroll to the service element
        setTimeout(() => {
            const el = folderAreaRef.current?.querySelector(`[data-service-key="${serviceKey}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            onNavigateToItemDone?.();
        }, 120);
    }, [serviceLayers]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Handle group layer checkbox: toggle all descendant feature layers
    const handleGroupLayerCheckbox = (service, groupNode, allChecked) => {
        const descendantLeaves = getDescendantLeafLayers(groupNode);
        const descendantIds = descendantLeaves.map(l => l.id);
        if (descendantIds.length === 0) return;

        if (allChecked) {
            // Uncheck all descendants
            setCheckedLayerIds(prev => ({
                ...prev,
                [service.key]: (prev[service.key] || []).filter(id => !descendantIds.includes(id))
            }));
            setCheckedSublayerIds(prev => {
                const updated = { ...prev[service.key] };
                descendantIds.forEach(id => { updated[id] = []; });
                return { ...prev, [service.key]: updated };
            });
            descendantLeaves.forEach(l => removeLoadingMessage(getLoadingMsgId(service, l)));
        } else {
            // Check all descendants
            setCheckedLayerIds(prev => {
                const current = prev[service.key] || [];
                const newIds = [...new Set([...current, ...descendantIds])];
                return { ...prev, [service.key]: newIds };
            });
            // Also check all sublayers for each descendant
            const newSublayerIds = { ...(checkedSublayerIds[service.key] || {}) };
            descendantLeaves.forEach(layer => {
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
        setServiceLayerAdded(prev => ({
            ...prev,
            [service.key]: !allChecked
        }));
    };

    // Handle service removal
    const handleRemoveService = async (service) => {
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
            const updatedMap = await fetchServicesByStateMap(STATE_CODES, { type: 'MapServer' });
            setServicesFromDb(updatedMap);
            
            console.log(`Service "${service.label}" removed successfully`);
            
        } catch (error) {
            console.error('Failed to remove service:', error);
            
            // Handle different types of errors
            let errorMessage = 'Failed to remove service. ';
            
            if (error.response?.status === 409) {
                // Conflict error (duplicate in removed services)
                if (error.response?.data?.detail) {
                    errorMessage = error.response.data.detail + '\n\nHint: Open the removed services panel (trash icon) to permanently delete the existing service.';
                } else {
                    errorMessage += 'A service with the same key already exists in the removed services panel. Please permanently delete the existing removed service first, then try removing again.\n\nHint: Open the removed services panel (trash icon) to permanently delete the existing service.';
                }
            } else if (error.response?.status === 404) {
                errorMessage += 'The service was not found.';
            } else if (error.response?.data?.detail) {
                errorMessage += error.response.data.detail;
            } else {
                // Check if it's a table-related error that might succeed on retry
                const errorMsg = error?.message || 'Unknown error';
                const isTableError = errorMsg.includes('removed_arcgis_services') || 
                                    errorMsg.includes('relation') || 
                                    errorMsg.includes('does not exist');
                
                if (isTableError) {
                    errorMessage = `Database initialization error. Please try removing the service again. If the problem persists, contact support.\n\nError: ${errorMsg}`;
                } else {
                    errorMessage += errorMsg;
                }
            }
            
            alert(errorMessage);
        }
    };

    // Handle folder rename
    const handleFolderRename = async (oldFolderName, newFolderName) => {
        if (!newFolderName || newFolderName.trim() === '') {
            alert('Folder name cannot be empty');
            return;
        }

        if (oldFolderName === newFolderName) {
            return; // No change needed
        }

        try {
            console.log(`Renaming folder "${oldFolderName}" to "${newFolderName}"`);
            
            // Call API to rename folder
            const stateName = {
                'WA': 'washington',
                'ID': 'idaho', 
                'OR': 'oregon'
            }[selectedState];
            
            await renameFolderServices(oldFolderName, newFolderName, stateName);
            
            // Refresh services list from database
            console.log('Refreshing services list after folder rename...');
            const updatedMap = await fetchServicesByStateMap(STATE_CODES, { type: 'MapServer' });
            setServicesFromDb(updatedMap);
            
            // Update expanded folders to reflect the new name
            setExpandedFolders(prev => {
                const newSet = new Set(prev);
                if (newSet.has(oldFolderName)) {
                    newSet.delete(oldFolderName);
                    newSet.add(newFolderName);
                }
                return newSet;
            });
            
            console.log(`Folder "${oldFolderName}" renamed to "${newFolderName}" successfully`);
            
        } catch (error) {
            console.error('Failed to rename folder:', error);
            alert(`Failed to rename folder: ${error.message || 'Unknown error'}`);
        }
    };

    // Handle service rename
    const handleServiceRename = async (serviceKey, newLabel) => {
        if (!newLabel || newLabel.trim() === '') {
            alert('Service name cannot be empty');
            return;
        }

        try {
            console.log(`Renaming service "${serviceKey}" to "${newLabel}"`);
            
            // Call API to rename service
            await renameService(serviceKey, newLabel);
            
            // Refresh services list from database
            console.log('Refreshing services list after service rename...');
            const updatedMap = await fetchServicesByStateMap(STATE_CODES, { type: 'MapServer' });
            setServicesFromDb(updatedMap);
            
            console.log(`Service "${serviceKey}" renamed to "${newLabel}" successfully`);
            
        } catch (error) {
            console.error('Failed to rename service:', error);
            alert(`Failed to rename service: ${error.message || 'Unknown error'}`);
        }
    };

    // Handle update button click
    const handleUpdateServices = async () => {
        if (isUpdating) return; // Prevent multiple simultaneous updates

        setIsUpdating(true);
        setUpdateProgress('Starting update...');
        setUpdateResults(null);

        try {
            const result = await updateCurrentStateServices(selectedState, (progressMessage) => {
                setUpdateProgress(progressMessage);
            });

            setUpdateResults(result);
            
            if (result.success && result.newCount > 0) {
                // Refresh the services list to show new services
                console.log('Refreshing services list after update...');
                const updatedMap = await fetchServicesByStateMap(STATE_CODES, { type: 'MapServer' });
                setServicesFromDb(updatedMap);
                
                setUpdateProgress(`✅ Update complete! Added ${result.newCount} new services.`);
            } else if (result.success && result.newCount === 0) {
                setUpdateProgress('✅ Update complete! No new services found.');
            }
            
        } catch (error) {
            console.error('Update failed:', error);
            setUpdateProgress(`❌ Update failed: ${error.message}`);
            setUpdateResults({ success: false, error: error.message });
        } finally {
            setIsUpdating(false);
            
            // Clear progress message after 5 seconds
            setTimeout(() => {
                setUpdateProgress('');
                setUpdateResults(null);
            }, 5000);
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

            const vectorAddedIds = new Set();
            toAdd.forEach(id => {
                const layer = layers.find(l => l.id === id);
                if (layer) {
                    addArcgisVectorLayer(
                        map,
                        { ...layer, serviceKey: service.key, serviceUrl: service.url },
                        showArcgisPopup,
                        { minzoom: 6, maxzoom: 12 }
                    );
                    vectorAddedIds.add(id);
                }
            });

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
                                        'raster-opacity': layerOpacity
                                    }
                                });

                                // Detect when sublayer tiles are fully loaded and rendered using 'idle' event
                                const onIdle = () => {
                                    if (!map.getLayer(sublayerLayerId)) { map.off('idle', onIdle); return; }
                                    if (!map.isSourceLoaded(sublayerSourceId)) return;
                                    map.off('idle', onIdle);

                                    const sublayerMsgId = `${getLoadingMsgId(service, layer)}-sub-${sublayerIndex}`;
                                    removeLoadingMessage(sublayerMsgId);
                                    showFinishedMessage(sublayerMsgId, `${legendItem.label} loaded`);

                                    const allSublayersFinished = checkedSublayers.every(subIdx => {
                                        const subMsgId = `${getLoadingMsgId(service, layer)}-sub-${subIdx}`;
                                        return !loadingStates.current[subMsgId];
                                    });

                                    if (allSublayersFinished) {
                                        removeLoadingMessage(getLoadingMsgId(service, layer));
                                        showFinishedMessage(getLoadingMsgId(service, layer), getLoadingMsgText(service, layer, true));

                                        const allServiceLayersFinished = currChecked.every(layerId => {
                                            const layerMsgId = getLoadingMsgId(service, layers.find(l => l.id === layerId));
                                            return !loadingStates.current[layerMsgId];
                                        });

                                        if (allServiceLayersFinished && currChecked.length > 0) {
                                            const allLayersMessageId = getLoadingMsgId(service, null);
                                            if (loadingStates.current[allLayersMessageId]) {
                                                removeLoadingMessage(allLayersMessageId);
                                                showFinishedMessage(allLayersMessageId, getLoadingMsgText(service, null, true));
                                            }
                                        }
                                    }
                                };

                                map.on('idle', onIdle);
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
                            'raster-opacity': layerOpacity
                        }
                    });

                    // Detect when tiles are fully loaded and rendered using 'idle' event
                    const onIdle = () => {
                        if (!map.getLayer(rasterLayerId)) { map.off('idle', onIdle); return; }
                        if (!map.isSourceLoaded(rasterSourceId)) return;
                        map.off('idle', onIdle);

                        removeLoadingMessage(getLoadingMsgId(service, layer));
                        showFinishedMessage(getLoadingMsgId(service, layer), getLoadingMsgText(service, layer, true));

                        const allServiceLayersFinished = currChecked.every(layerId => {
                            const layerMsgId = getLoadingMsgId(service, layers.find(l => l.id === layerId));
                            return !loadingStates.current[layerMsgId];
                        });

                        if (allServiceLayersFinished && currChecked.length > 0) {
                            const allLayersMessageId = getLoadingMsgId(service, null);
                            if (loadingStates.current[allLayersMessageId]) {
                                removeLoadingMessage(allLayersMessageId);
                                showFinishedMessage(allLayersMessageId, getLoadingMsgText(service, null, true));
                            }
                        }
                    };

                    map.on('idle', onIdle);
                }
            });

            // Update refs for next diff — only mark IDs as processed if layer data was available,
            // so that layers not yet in serviceLayers will be retried when data arrives
            prevCheckedLayerIds.current[service.key] = currChecked.filter(id =>
                vectorAddedIds.has(id) || prevChecked.includes(id)
            );
            prevCheckedLayerIds.current[`${service.key}_sublayers`] = JSON.parse(JSON.stringify(serviceSublayers));
        });
        // eslint-disable-next-line
    }, [checkedLayerIds, serviceLayers, checkedSublayerIds]); // Added checkedSublayerIds as dependency


    // UI for search bar and dropdown
    // Handle opacity slider change — update all ArcGIS raster/vector layers on the map
    const handleOpacityChange = (newOpacity) => {
        setLayerOpacity(newOpacity);
        const map = mapInstance && mapInstance();
        if (!map || !map.getStyle) return;
        const style = map.getStyle();
        if (!style || !Array.isArray(style.layers)) return;
        style.layers.forEach(l => {
            if (l.id.startsWith('arcgis-raster-layer-')) {
                map.setPaintProperty(l.id, 'raster-opacity', newOpacity);
            } else if (l.id.startsWith('arcgis-vector-layer-')) {
                // Vector layers may be fill, line, or circle type
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

    const renderSearchBar = () => (
        <div>
            <div className="upload-panel-searchbar">
                <input
                    type="text"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            if (!searchKeyword) {
                                setSearchResult(null);
                                setExpandedStates(new Set());
                                setExpandedFolders(new Set());
                                setExpandedServices(new Set());
                                setExpandedLayers(new Set());
                                return;
                            }
                            const result = filterUploadPanelData({
                                services: ARCGIS_SERVICES,
                                serviceLayers,
                                searchType,
                                keyword: searchKeyword
                            });
                            setSearchResult(result);
                            setExpandedStates(new Set(STATE_CODES));
                            setExpandedFolders(new Set(result.expandedFolders));
                            setExpandedServices(new Set(result.expandedServices));
                            setExpandedLayers(new Set(result.expandedLayerKeys));
                        }
                    }}
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
                    onClick={() => {
                        if (!searchKeyword) {
                            setSearchResult(null);
                            setExpandedStates(new Set());
                            setExpandedFolders(new Set());
                            setExpandedServices(new Set());
                            setExpandedLayers(new Set());
                            return;
                        }
                        const result = filterUploadPanelData({
                            services: ARCGIS_SERVICES,
                            serviceLayers,
                            searchType,
                            keyword: searchKeyword
                        });
                        setSearchResult(result);
                        setExpandedStates(new Set(STATE_CODES));
                        setExpandedFolders(new Set(result.expandedFolders));
                        setExpandedServices(new Set(result.expandedServices));
                        setExpandedLayers(new Set(result.expandedLayerKeys));
                    }}
                >
                    <FontAwesomeIcon icon={faSearch} />
                </button>
                <button
                    className="clear-btn upload-panel-searchbar-btn clear"
                    title="Clear Search"
                    onClick={() => {
                        setSearchKeyword('');
                        setSearchResult(null);
                        setExpandedStates(new Set());
                        setExpandedFolders(new Set());
                        setExpandedServices(new Set());
                        setExpandedLayers(new Set());
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
                                setExpandedLayers(new Set());
                            }
                        }}
                        style={{ marginRight: 8 }}
                    />
                    Show only services added to map
                </label>
            </div>
        </div>
    );

    // Build per-state folders to show directly from per-state grouped data.
    // Do not re-split merged services by service.state because backend state values can be inconsistent,
    // which may intermittently hide an entire state's folders.
    const stateFoldersToShow = {};
    STATE_CODES.forEach(code => {
        const baseByFolder = servicesByStateAndFolder[code]?.folders || {};
        const baseFolders = servicesByStateAndFolder[code]?.folderNames || [];
        const folders = [];
        const byFolder = {};

        baseFolders.forEach(folder => {
            let visibleServices = baseByFolder[folder] || [];

            // Apply search filter by intersecting with searched services for this folder.
            if (searchResult) {
                const searchedServices = searchResult.filteredFolders?.[folder] || [];
                const searchedKeys = new Set(
                    searchedServices.map(s => `${s.key}::${s.url}`)
                );
                visibleServices = visibleServices.filter(s => searchedKeys.has(`${s.key}::${s.url}`));
            }

            // Apply "show added only" after search filter.
            if (showAddedOnly) {
                visibleServices = visibleServices.filter(service =>
                    (checkedLayerIds[service.key] || []).length > 0
                );
            }

            if (visibleServices.length > 0) {
                folders.push(folder);
                byFolder[folder] = visibleServices;
            }
        });

        stateFoldersToShow[code] = { folders, byFolder };
    });

    // State folder click
    const handleStateClick = (code) => {
        setExpandedStates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(code)) newSet.delete(code);
            else newSet.add(code);
            return newSet;
        });
    };

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

    // Layer click (for layers with sublayers)
    const handleLayerClick = (serviceKey, layerId) => {
        const layerKey = `${serviceKey}-${layerId}`;
        setExpandedLayers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(layerKey)) newSet.delete(layerKey);
            else newSet.add(layerKey);
            return newSet;
        });
    };

    // State selection menu that sets selectedState and resets relevant state variables based on selection
    const renderStateMenu = () => (
        <div className="arcgis-upload-state-menu">
            {/* State selection buttons - disabled, states are now shown as top-level folders in the panel */}
            {/* <div className="arcgis-upload-state-buttons">
                {STATE_CODES.map(code => (
                    <button
                        key={code}
                        className={`arcgis-upload-state-btn${selectedState === code ? ' active' : ''}`}
                        onClick={() => setSelectedState(code)}
                        title={`Load ${STATE_LABELS[code]} services`}
                    >
                        {STATE_LABELS[code]}
                    </button>
                ))}
            </div> */}
            
            {/* Data source toggle */}
            <div className="arcgis-upload-datasource-toggle">
                <button
                    className={`arcgis-upload-datasource-btn${dataSource === 'database' ? ' active' : ''}`}
                    onClick={() => handleDataSourceChange('database')}
                    title="Load services from database (live data with user modifications)"
                    disabled={isLoadingServices}
                >
                    🌐 DB
                </button>
                <button
                    className={`arcgis-upload-datasource-btn${dataSource === 'local' ? ' active' : ''}`}
                    onClick={() => handleDataSourceChange('local')}
                    title="Load services from local JSON files (original data)"
                    disabled={isLoadingServices}
                >
                    📂 Local
                </button>
            </div>
        </div>
    );

    // Context menu handlers (panel-specific; state + pin from hook)
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

    // Save a service to custom layers (only first-level layers under folders)
    const handleSaveToCustomLayers = async () => {
        if (!contextMenu) return;
        const { type, data } = contextMenu;
        closeContextMenu();

        if (type !== 'service') return;
        const email = localStorage.getItem('email') || '';
        if (!email) {
            alert('Please log in to save custom layers.');
            return;
        }
        try {
            await saveCustomLayer(email, data.service);
            showFinishedMessage(`Saved "${data.service.label}" to Custom Layers`);
        } catch (err) {
            alert(`Failed to save: ${err.message}`);
        }
    };

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

    // Open layer info modal (fetch & cache)
    const openLayerInfo = async (service, layer) => {
        const layerData = {
            serviceKey: service.key,
            layerId: layer.id,
            layerName: layer.name,
            serviceUrl: service.url
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

    const closeLayerInfo = () => {
        setLayerInfoOpen(null);
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

    // JSX return that renders the upload panel UI 
    return (
        <>
            {/* Map loading spinner overlay */}
            {isMapLayerLoading && mapContainerEl && createPortal(
                <div className="arcgis-map-loading-overlay">
                    <div className="arcgis-map-spinner">
                        <div className="arcgis-spinner-dots">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="arcgis-spinner-dot" style={{ '--dot-index': i }} />
                            ))}
                        </div>
                        <div className="arcgis-spinner-text">loading...</div>
                    </div>
                </div>,
                mapContainerEl
            )}
            {/* Upload Panel */}
            <div className={`upload-panel${splitBottom ? ' upload-panel--split-bottom' : ''}`} onContextMenu={e => e.preventDefault()}>
                {/* Only show search bar and services when not loading database data */}
                {!(isLoadingServices && dataSource === 'database') && (
                    <>
                        <div className="upload-panel-sticky-toolbar">
                            {renderSearchBar()}
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
                                    style={{ background: `linear-gradient(to right, #1976d2 ${layerOpacity * 100}%, #d0d0d0 ${layerOpacity * 100}%)` }}
                                />
                                <span className="upload-panel-opacity-value">{Math.round(layerOpacity * 100)}%</span>
                            </div>
                            <div className="upload-panel-controls-row">
                                <label className="upload-panel-datasource-switch" title={dataSource === 'database' ? 'Using database (click to switch to local)' : 'Using local JSON (click to switch to database)'}>
                                    <span className={`upload-panel-ds-label${dataSource === 'local' ? ' active' : ''}`}>Local</span>
                                    <span
                                        className={`upload-panel-ds-track${dataSource === 'database' ? ' db' : ''}`}
                                        onClick={() => !isLoadingServices && handleDataSourceChange(dataSource === 'database' ? 'local' : 'database')}
                                    >
                                        <span className="upload-panel-ds-thumb" />
                                    </span>
                                    <span className={`upload-panel-ds-label${dataSource === 'database' ? ' active' : ''}`}>DB</span>
                                </label>
                                <button 
                                    className="upload-panel-update-btn"
                                    onClick={handleUpdateServices}
                                    disabled={isUpdating}
                                    title="Update services data from ArcGIS REST servers"
                                >
                                    <FontAwesomeIcon icon={faSync} spin={isUpdating} />
                                </button>
                            </div>
                            {/* Update progress display */}
                            {(updateProgress || updateResults) && (
                                <div className="upload-panel-update-progress">
                                    {updateProgress && (
                                        <div className={`update-progress-message ${isUpdating ? 'updating' : 'complete'}`}>
                                            {updateProgress}
                                        </div>
                                    )}
                                    {updateResults && updateResults.success && (
                                        <div className="update-results">
                                            <small>
                                                Found: {updateResults.totalFound || 0} | 
                                                Existing: {updateResults.existingCount || 0} | 
                                                New: {updateResults.newCount || 0}
                                            </small>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="upload-panel-folder-area" ref={folderAreaRef}>
                        {/* Built-in Layers folder */}
                        <div>
                            <div
                                className="upload-state-folder"
                                onClick={() => {
                                    setExpandedStates(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has('__builtin__')) newSet.delete('__builtin__');
                                        else newSet.add('__builtin__');
                                        return newSet;
                                    });
                                }}
                            >
                                <span>
                                    {expandedStates.has('__builtin__') ? '▼' : '►'} {BUILTIN_FOLDER_NAME}
                                </span>
                            </div>
                            {expandedStates.has('__builtin__') && (
                                <div className="upload-state-folder-content">
                                    {BUILTIN_LAYERS.map(layer => (
                                        <div key={layer.id} className="tree-node" style={{ paddingLeft: 18 }}>
                                            <label className="upload-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 6, cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!areaVisibility[layer.id]}
                                                    onChange={() => handleAreaCheckbox?.(layer.id)}
                                                    style={{ marginRight: 4 }}
                                                />
                                                {layer.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {STATE_CODES.map(stateCode => {
                            const stateData = stateFoldersToShow[stateCode];
                            if (!stateData || stateData.folders.length === 0) return null;
                            const isStateExpanded = expandedStates.has(stateCode);
                            return (
                                <div key={stateCode}>
                                    <div
                                        className="upload-state-folder"
                                        onClick={() => handleStateClick(stateCode)}
                                    >
                                        <span>
                                            {isStateExpanded ? "▼" : "►"} {STATE_FULL_NAMES[stateCode] || stateCode}
                                        </span>
                                    </div>
                                    {isStateExpanded && (
                                        <div className="upload-state-folder-content">
                                            {stateData.folders.map(folder => (
                    <div key={folder}>
                        <div
                            className="upload-folder"
                            style={searchResult?.matchedFolderNames?.has(folder) ? { fontWeight: 'bold' } : undefined}
                            onClick={() => handleFolderClick(folder)}
                            onContextMenu={(e) => handleContextMenu(e, 'folder', { folder })}
                        >
                            <span>
                                {expandedFolders.has(folder) ? "▼" : "►"} 
                                <ArcgisRenameItem
                                    value={folder}
                                    onSave={(newName) => handleFolderRename(folder, newName)}
                                    placeholder="Enter folder name..."
                                    isFolder={true}
                                    disabled={!isAdmin}
                                    startEditing={renamingItem?.type === 'folder' && renamingItem?.key === folder}
                                    onEditingDone={() => setRenamingItem(null)}
                                />
                            </span>
                        </div>
                        {expandedFolders.has(folder) && (
                            <div className="tree-children">
                                {stateData.byFolder[folder].map(service => {
                                    const layers = serviceLayers[service.key] || [];
                                    const checkedIds = checkedLayerIds[service.key] || [];
                                    const rawLayers = layers.length > 0 ? layers : (service.layers || []);
                                    // Build hierarchical tree from flat layer list
                                    const layerTree = buildLayerTree(Array.isArray(rawLayers) ? rawLayers : []);
                                    const allFeatureLayers = getAllLeafLayers(layerTree);

                                    return (
                                        <div key={service.key} className="tree-node" data-service-key={service.key}>
                                            <div
                                                className="upload-item"
                                                style={searchResult?.matchedServiceKeys?.has(service.key) ? { fontWeight: 'bold' } : undefined}
                                                onClick={() => handleServiceClick(service.key)}
                                                onContextMenu={(e) => handleContextMenu(e, 'service', { service, layersToShow: allFeatureLayers })}
                                            >
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', minWidth: 0, flex: 1 }}>
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
                                                    {expandedServices.has(service.key) ? "▼" : "►"} 
                                                    <ArcgisRenameItem
                                                        value={service.label}
                                                        displayValue={service.label}
                                                        onSave={(newLabel) => handleServiceRename(service.key, newLabel)}
                                                        placeholder="Enter service name..."
                                                        isFolder={false}
                                                        disabled={!isAdmin}
                                                        startEditing={renamingItem?.type === 'service' && renamingItem?.key === service.key}
                                                        onEditingDone={() => setRenamingItem(null)}
                                                    />
                                                </span>
                                                            </div>
                                            {expandedServices.has(service.key) && (
                                                <div className="tree-children">
                                                    <ul className="tree-children" style={{ listStyle: "none" }}>
                                                        {layerTree.map(node =>
                                                            renderLayerNode(node, service, checkedIds, allFeatureLayers)
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
                            {/* Per-state attribution */}
                            <div className="upload-panel-attribution" style={{ marginTop: 4, marginBottom: 2 }}>
                                Data sources: {usingFallback ? 'Local JSON Files' : 'Backend Database'} • <a href={STATE_ATTRIBUTION[stateCode]?.url} target="_blank" rel="noopener noreferrer">{STATE_ATTRIBUTION[stateCode]?.name} ArcGIS Services</a>
                            </div>
                        </div>
                    )}
                </div>
                );
            })}
                        </div>
                
                {/* Context Menu */}
                <LayerContextMenuPopup
                    contextMenu={contextMenu}
                    isPinned={isPinned}
                    onLearnMore={handleContextLearnMore}
                    onTogglePin={handleTogglePin}
                    extraServiceItems={[
                        { label: 'Save to Custom Layers', onClick: handleSaveToCustomLayers },
                    ]}
                />


                
                <div className="arcgis-loading-messages">
                    {messages.map((msg, idx) => (
                        <div key={msg.id} className={`arcgis-loading-message ${msg.type}`}>
                            {msg.text}
                        </div>
                    ))}
                </div>
                    </>
                )}
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
                                            <a 
                                                href={`${layerInfoOpen.serviceUrl}/${layerInfoOpen.layerId}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{ color: '#1976d2', textDecoration: 'none' }}
                                            >
                                                View ArcGIS Layer Page →
                                            </a>
                                        </div>
                                    </div>
                                );
                            }
                            
                            return (
                                <div>
                                    {/* Display various layer info fields if they exist */}
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
                                    
                                    {/* Link to the actual layer page */}
                                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                                        <a 
                                            href={`${layerInfoOpen.serviceUrl}/${layerInfoOpen.layerId}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ color: '#1976d2', textDecoration: 'none' }}
                                        >
                                            View ArcGIS Layer Page →
                                        </a>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* State menu: outside the upload panel */}
            {/* renderStateMenu() - disabled, DB/Local toggle moved to toolbar */}
        </>
    );
}

export default ArcgisUploadPanel;