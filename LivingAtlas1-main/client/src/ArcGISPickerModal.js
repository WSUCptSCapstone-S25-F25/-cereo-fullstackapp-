import React, { useState, useEffect } from 'react';
import { fetchServicesByStateMap } from './arcgisServicesDb';
import { fetchArcgisLayers } from './arcgisDataUtils';
import { buildLayerTree, getAllLeafLayers } from './LayerTree';
import { filterUploadPanelData } from './arcgisUploadSearchUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import './ArcGISPickerModal.css';
import WA_ARCGIS_SERVICES from './arcgis_services_wa.json';
import ID_ARCGIS_SERVICES from './arcgis_services_id.json';
import OR_ARCGIS_SERVICES from './arcgis_services_or.json';

function getNodeLeaves(node) {
    const leaves = [];
    const collect = (n) => {
        if (!n.children || n.children.length === 0) leaves.push(n);
        else n.children.forEach(collect);
    };
    if (node.children) node.children.forEach(collect);
    return leaves;
}

const STATE_CODES = ['WA', 'ID', 'OR'];
const STATE_FULL_NAMES = {
    WA: 'Washington State ArcGIS Services',
    ID: 'Idaho ArcGIS Services',
    OR: 'Oregon ArcGIS Services',
};
const LOCAL_SERVICES = {
    WA: WA_ARCGIS_SERVICES || [],
    ID: ID_ARCGIS_SERVICES || [],
    OR: OR_ARCGIS_SERVICES || [],
};

function ArcGISPickerModal({ onAdd, onClose }) {
    const [servicesFromDb, setServicesFromDb] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [serviceLayers, setServiceLayers] = useState({});
    const [expandedStates, setExpandedStates] = useState(new Set());
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [expandedServices, setExpandedServices] = useState(new Set());
    const [expandedLayers, setExpandedLayers] = useState(new Set());
    // selectedItems: Map<string, object>  key = "service:key" | "layer:serviceKey:layerId"
    const [selectedItems, setSelectedItems] = useState(new Map());
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResult, setSearchResult] = useState(null);

    // Build per-state service lists
    const allServicesByState = {};
    STATE_CODES.forEach(code => {
        allServicesByState[code] =
            servicesFromDb[code] && servicesFromDb[code].length > 0
                ? servicesFromDb[code]
                : LOCAL_SERVICES[code] || [];
    });
    const allServices = STATE_CODES.flatMap(code => allServicesByState[code]);

    // Group by state + folder
    const servicesByStateAndFolder = {};
    STATE_CODES.forEach(code => {
        const byFolder = {};
        (allServicesByState[code] || []).forEach(service => {
            const folder = service.folder || 'Root';
            if (!byFolder[folder]) byFolder[folder] = [];
            byFolder[folder].push(service);
        });
        servicesByStateAndFolder[code] = {
            folders: byFolder,
            folderNames: Object.keys(byFolder).sort(),
        };
    });

    // Fetch services from DB on mount
    useEffect(() => {
        let active = true;
        (async () => {
            setIsLoading(true);
            try {
                const stateMap = await fetchServicesByStateMap(STATE_CODES, { type: 'MapServer' });
                const total = STATE_CODES.reduce((s, c) => s + (stateMap[c] || []).length, 0);
                if (active && total > 0) setServicesFromDb(stateMap);
            } catch { }
            if (active) setIsLoading(false);
        })();
        return () => { active = false; };
    }, []);

    // Fetch layers when a service is expanded
    useEffect(() => {
        expandedServices.forEach(serviceKey => {
            if (serviceLayers[serviceKey] !== undefined) return;
            const service = allServices.find(s => s.key === serviceKey);
            if (!service || !service.url) return;
            fetchArcgisLayers(service.url).then(layers => {
                setServiceLayers(prev => ({ ...prev, [serviceKey]: layers || [] }));
            }).catch(() => {
                setServiceLayers(prev => ({ ...prev, [serviceKey]: [] }));
            });
        });
    }, [expandedServices]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = () => {
        if (!searchKeyword.trim()) {
            setSearchResult(null);
            setExpandedStates(new Set());
            setExpandedFolders(new Set());
            setExpandedServices(new Set());
            return;
        }
        const result = filterUploadPanelData({
            services: allServices,
            serviceLayers,
            searchType: 'any',
            keyword: searchKeyword,
        });
        setSearchResult(result);
        setExpandedStates(new Set(STATE_CODES));
        setExpandedFolders(new Set(result.expandedFolders));
        setExpandedServices(new Set(result.expandedServices));
    };

    const handleClear = () => {
        setSearchKeyword('');
        setSearchResult(null);
        setExpandedStates(new Set());
        setExpandedFolders(new Set());
        setExpandedServices(new Set());
    };

    const toggleSelect = (key, item) => {
        setSelectedItems(prev => {
            const next = new Map(prev);
            if (next.has(key)) next.delete(key);
            else next.set(key, item);
            return next;
        });
    };

    const handleAdd = () => {
        if (selectedItems.size === 0) return;
        onAdd(Array.from(selectedItems.values()));
    };

    // Render a single layer node (and its children recursively)
    const renderLayerNode = (node, service, depth = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const expandKey = `${service.key}-${node.id}`;
        const isExpanded = expandedLayers.has(expandKey);

        if (hasChildren) {
            const descendantLeaves = getNodeLeaves(node);
            const checkedCount = descendantLeaves.filter(l =>
                selectedItems.has(`layer:${service.key}:${l.id}`)
            ).length;
            const allChecked = descendantLeaves.length > 0 && checkedCount === descendantLeaves.length;
            const someChecked = checkedCount > 0 && !allChecked;
            return (
                <div key={node.id} style={{ paddingLeft: `${depth * 14 + 24}px` }}>
                    <div
                        className="arcgis-picker-layer-group-row"
                        onClick={() => setExpandedLayers(prev => {
                            const n = new Set(prev);
                            n.has(expandKey) ? n.delete(expandKey) : n.add(expandKey);
                            return n;
                        })}
                    >
                        <input
                            type="checkbox"
                            className="arcgis-picker-checkbox"
                            checked={allChecked}
                            ref={el => { if (el) el.indeterminate = someChecked; }}
                            onChange={(e) => {
                                e.stopPropagation();
                                setSelectedItems(prev => {
                                    const next = new Map(prev);
                                    if (allChecked) {
                                        descendantLeaves.forEach(l => next.delete(`layer:${service.key}:${l.id}`));
                                    } else {
                                        descendantLeaves.forEach(l => next.set(`layer:${service.key}:${l.id}`, {
                                            service_key: service.key,
                                            layer_id: l.id,
                                            sublayer_index: null,
                                            display_name: l.name || l.label || `Layer ${l.id}`,
                                            item_type: 'layer',
                                            state_code: findStateForService(service.key),
                                            folder_name: service.folder || 'Root',
                                        }));
                                    }
                                    return next;
                                });
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <span className="arcgis-picker-arrow">{isExpanded ? '▼' : '►'}</span>
                        <span className="arcgis-picker-layer-name">{node.name || node.label || `Layer ${node.id}`}</span>
                        {descendantLeaves.length > 0 && (
                            <span className="arcgis-picker-layer-count">({checkedCount}/{descendantLeaves.length})</span>
                        )}
                    </div>
                    {isExpanded && (
                        <div>
                            {node.children.map(child => renderLayerNode(child, service, depth + 1))}
                        </div>
                    )}
                </div>
            );
        }

        // Leaf node
        const layerKey = `layer:${service.key}:${node.id}`;
        const isChecked = selectedItems.has(layerKey);
        return (
            <div key={node.id} className="arcgis-picker-layer-row" style={{ paddingLeft: `${depth * 14 + 24}px` }}>
                <label className="arcgis-picker-layer-label">
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(layerKey, {
                            service_key: service.key,
                            layer_id: node.id,
                            sublayer_index: null,
                            display_name: node.name || node.label || `Layer ${node.id}`,
                            item_type: 'layer',
                            state_code: findStateForService(service.key),
                            folder_name: service.folder || 'Root',
                        })}
                    />
                    <span>{node.name || node.label || `Layer ${node.id}`}</span>
                </label>
            </div>
        );
    };

    const findStateForService = (serviceKey) => {
        for (const code of STATE_CODES) {
            if ((allServicesByState[code] || []).some(s => s.key === serviceKey)) return code;
        }
        return 'WA';
    };

    const renderTree = () => {
        if (isLoading) {
            return <p className="arcgis-picker-loading-msg">Loading ArcGIS services...</p>;
        }

        return STATE_CODES.map(stateCode => {
            const stateData = servicesByStateAndFolder[stateCode];
            if (!stateData) return null;

            let foldersToShow = stateData.folderNames;
            const byFolder = stateData.folders;

            if (searchResult) {
                foldersToShow = foldersToShow.filter(folder => {
                    const searched = searchResult.filteredFolders?.[folder] || [];
                    return searched.length > 0;
                });
            }
            if (foldersToShow.length === 0) return null;

            const isStateExpanded = expandedStates.has(stateCode);
            return (
                <div key={stateCode}>
                    <div
                        className="arcgis-picker-state-row"
                        onClick={() => setExpandedStates(prev => {
                            const n = new Set(prev);
                            n.has(stateCode) ? n.delete(stateCode) : n.add(stateCode);
                            return n;
                        })}
                    >
                        <span className="arcgis-picker-arrow">{isStateExpanded ? '▼' : '►'}</span>
                        {STATE_FULL_NAMES[stateCode]}
                    </div>
                    {isStateExpanded && (
                        <div className="arcgis-picker-state-content">
                            {foldersToShow.map(folder => {
                                let services = byFolder[folder] || [];
                                if (searchResult) {
                                    const searched = searchResult.filteredFolders?.[folder] || [];
                                    const searchedKeys = new Set(searched.map(s => s.key));
                                    services = services.filter(s => searchedKeys.has(s.key));
                                }
                                if (services.length === 0) return null;
                                const isFolderExpanded = expandedFolders.has(folder);
                                return (
                                    <div key={folder}>
                                        <div
                                            className="arcgis-picker-folder-row"
                                            onClick={() => setExpandedFolders(prev => {
                                                const n = new Set(prev);
                                                n.has(folder) ? n.delete(folder) : n.add(folder);
                                                return n;
                                            })}
                                        >
                                            <span className="arcgis-picker-arrow">{isFolderExpanded ? '▼' : '►'}</span>
                                            {folder}
                                        </div>
                                        {isFolderExpanded && (
                                            <div className="arcgis-picker-folder-content">
                                                {services.map(service => {
                                                    const serviceKey = `service:${service.key}`;
                                                    const layers = serviceLayers[service.key];
                                                    const rawLayers = Array.isArray(layers) && layers.length > 0
                                                        ? layers
                                                        : (Array.isArray(service.layers) ? service.layers : []);
                                                    const layerTree = buildLayerTree(rawLayers);
                                                    const allLeafLayers = getAllLeafLayers(layerTree);

                                                    const checkedLeafCount = allLeafLayers.filter(l =>
                                                        selectedItems.has(`layer:${service.key}:${l.id}`)
                                                    ).length;
                                                    const isServiceSelected = selectedItems.has(serviceKey);
                                                    const allLayersChecked = allLeafLayers.length > 0 && checkedLeafCount === allLeafLayers.length;
                                                    const someLayersChecked = checkedLeafCount > 0 && checkedLeafCount < allLeafLayers.length;

                                                    const isServiceExpanded = expandedServices.has(service.key);
                                                    const layersLoading = isServiceExpanded && layers === undefined;

                                                    return (
                                                        <div key={service.key} className="arcgis-picker-service-block">
                                                            <div
                                                                className="arcgis-picker-service-row"
                                                                onClick={() => setExpandedServices(prev => {
                                                                    const n = new Set(prev);
                                                                    n.has(service.key) ? n.delete(service.key) : n.add(service.key);
                                                                    return n;
                                                                })}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="arcgis-picker-checkbox"
                                                                    checked={isServiceSelected || allLayersChecked}
                                                                    ref={el => {
                                                                        if (el) el.indeterminate = !isServiceSelected && someLayersChecked;
                                                                    }}
                                                                    onChange={e => {
                                                                        e.stopPropagation();
                                                                        // If layers loaded, toggle all layer checks
                                                                        if (allLeafLayers.length > 0) {
                                                                            setSelectedItems(prev => {
                                                                                const n = new Map(prev);
                                                                                if (allLayersChecked) {
                                                                                    allLeafLayers.forEach(l => n.delete(`layer:${service.key}:${l.id}`));
                                                                                } else {
                                                                                    allLeafLayers.forEach(l => n.set(`layer:${service.key}:${l.id}`, {
                                                                                        service_key: service.key,
                                                                                        layer_id: l.id,
                                                                                        sublayer_index: null,
                                                                                        display_name: l.name || l.label || `Layer ${l.id}`,
                                                                                        item_type: 'layer',
                                                                                        state_code: stateCode,
                                                                                        folder_name: service.folder || 'Root',
                                                                                    }));
                                                                                    n.delete(serviceKey);
                                                                                }
                                                                                return n;
                                                                            });
                                                                        } else {
                                                                            // No layers loaded yet: toggle the service-level selection
                                                                            toggleSelect(serviceKey, {
                                                                                service_key: service.key,
                                                                                layer_id: null,
                                                                                sublayer_index: null,
                                                                                display_name: service.label,
                                                                                item_type: 'service',
                                                                                state_code: stateCode,
                                                                                folder_name: service.folder || 'Root',
                                                                            });
                                                                        }
                                                                    }}
                                                                    onClick={e => e.stopPropagation()}
                                                                />
                                                                <span className="arcgis-picker-arrow">{isServiceExpanded ? '▼' : '►'}</span>
                                                                <span className="arcgis-picker-service-label">{service.label}</span>
                                                                {layersLoading && (
                                                                    <span className="arcgis-picker-fetching"> (loading...)</span>
                                                                )}
                                                            </div>
                                                            {isServiceExpanded && !layersLoading && (
                                                                <div className="arcgis-picker-layers-content">
                                                                    {layerTree.length === 0 ? (
                                                                        <p className="arcgis-picker-no-layers">No layers found.</p>
                                                                    ) : (
                                                                        layerTree.map(node => renderLayerNode(node, service))
                                                                    )}
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
                </div>
            );
        });
    };

    return (
        <div className="arcgis-picker-overlay" onClick={onClose}>
            <div className="arcgis-picker-modal" onClick={e => e.stopPropagation()}>
                {/* Header: search bar + close button */}
                <div className="arcgis-picker-header">
                    <div className="arcgis-picker-search-row">
                        <input
                            type="text"
                            className="arcgis-picker-search-input"
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Search services or layers..."
                        />
                        <button
                            className="arcgis-picker-search-btn"
                            title="Search"
                            onClick={handleSearch}
                        >
                            <FontAwesomeIcon icon={faSearch} />
                        </button>
                        <button
                            className="arcgis-picker-clear-btn"
                            title="Clear search"
                            onClick={handleClear}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                {/* Body: tree */}
                <div className="arcgis-picker-body">
                    {renderTree()}
                </div>

                {/* Footer: selected count + add/cancel */}
                <div className="arcgis-picker-footer">
                    <span className="arcgis-picker-count">
                        {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="arcgis-picker-footer-btns">
                        <button className="arcgis-picker-cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="arcgis-picker-add-btn"
                            onClick={handleAdd}
                            disabled={selectedItems.size === 0}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ArcGISPickerModal;
