import React, { useState, useEffect } from 'react';
import { fetchServicesByStateMap } from './arcgisServicesDb';
import { fetchArcgisLayers, fetchArcgisLegend } from './arcgisDataUtils';
import { buildLayerTree, getAllLeafLayers, getDescendantLeafLayers } from './LayerTree';
import './LayerTree.css';
import { filterUploadPanelData } from './arcgisUploadSearchUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import './ArcGISPickerModal.css';
import WA_ARCGIS_SERVICES from './arcgis_services_wa.json';
import ID_ARCGIS_SERVICES from './arcgis_services_id.json';
import OR_ARCGIS_SERVICES from './arcgis_services_or.json';

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
    const [serviceLegends, setServiceLegends] = useState({});
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

    // Fetch layers and legends when a service is expanded
    useEffect(() => {
        expandedServices.forEach(serviceKey => {
            const service = allServices.find(s => s.key === serviceKey);
            if (!service || !service.url) return;
            if (serviceLayers[serviceKey] === undefined) {
                fetchArcgisLayers(service.url).then(layers => {
                    setServiceLayers(prev => ({ ...prev, [serviceKey]: layers || [] }));
                }).catch(() => {
                    setServiceLayers(prev => ({ ...prev, [serviceKey]: [] }));
                });
            }
            if (serviceLegends[serviceKey] === undefined) {
                fetchArcgisLegend(service.url).then(legend => {
                    setServiceLegends(prev => ({ ...prev, [serviceKey]: legend || {} }));
                }).catch(() => {
                    setServiceLegends(prev => ({ ...prev, [serviceKey]: {} }));
                });
            }
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
    // Uses tree-node/tree-children/upload-layer-group/upload-layer-row for visual consistency with upload panel
    const renderLayerNode = (node, service, depth = 0) => {
        const isGroupLayer = node.type === 'Group Layer';
        const hasChildren = node.children && node.children.length > 0;
        const expandKey = `${service.key}-${node.id}`;
        const isExpanded = expandedLayers.has(expandKey);

        if (isGroupLayer || hasChildren) {
            const descendantLeaves = getDescendantLeafLayers(node);
            const checkedCount = descendantLeaves.filter(l =>
                selectedItems.has(`layer:${service.key}:${l.id}`)
            ).length;
            const allChecked = descendantLeaves.length > 0 && checkedCount === descendantLeaves.length;
            const someChecked = checkedCount > 0 && !allChecked;
            return (
                <div key={node.id} className="tree-node">
                    <div
                        className="upload-layer-group"
                        onClick={() => setExpandedLayers(prev => {
                            const n = new Set(prev);
                            n.has(expandKey) ? n.delete(expandKey) : n.add(expandKey);
                            return n;
                        })}
                    >
                        <input
                            type="checkbox"
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
                            style={{ marginRight: 4 }}
                        />
                        <span style={{ color: '#666', userSelect: 'none', marginRight: 4 }}>
                            {isExpanded ? '▼' : '►'}
                        </span>
                        <span className="upload-layer-name" title={node.name || node.label || `Layer ${node.id}`} style={{ flex: 1 }}>
                            {node.name || node.label || `Layer ${node.id}`}
                        </span>
                        {descendantLeaves.length > 0 && (
                            <span style={{ color: '#999', fontSize: '10px', marginLeft: 4 }}>
                                ({checkedCount}/{descendantLeaves.length})
                            </span>
                        )}
                    </div>
                    {isExpanded && hasChildren && (
                        <div className="tree-children">
                            {node.children.map(child => renderLayerNode(child, service, depth + 1))}
                        </div>
                    )}
                </div>
            );
        }

        // Leaf node — show legend icon(s)
        const layerKey = `layer:${service.key}:${node.id}`;
        const isChecked = selectedItems.has(layerKey);
        const legend = serviceLegends[service.key];
        let legendItems = [];
        if (legend && legend.layers) {
            const legendLayer = legend.layers.find(l => l.layerId === node.id);
            if (legendLayer) legendItems = legendLayer.legend || [];
        }
        const hasMultipleLegends = legendItems.length > 1;
        const isLegendExpanded = expandedLayers.has(expandKey);

        return (
            <div key={node.id} className="upload-layer-row tree-node" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: 2 }}>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 20, width: '100%', cursor: hasMultipleLegends ? 'pointer' : 'default' }}
                    onClick={hasMultipleLegends ? () => setExpandedLayers(prev => {
                        const n = new Set(prev);
                        n.has(expandKey) ? n.delete(expandKey) : n.add(expandKey);
                        return n;
                    }) : undefined}
                >
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
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginRight: 4 }}
                    />
                    {hasMultipleLegends && (
                        <span style={{ color: '#666', marginRight: 4, userSelect: 'none', fontSize: '0.72rem' }}>
                            {isLegendExpanded ? '▼' : '►'}
                        </span>
                    )}
                    {legendItems.length === 1 && (
                        <img
                            src={`data:${legendItems[0].contentType};base64,${legendItems[0].imageData}`}
                            alt={legendItems[0].label || ''}
                            className="legend-img"
                            style={{ width: 14, height: 14, flexShrink: 0 }}
                        />
                    )}
                    <span className="upload-layer-name" title={node.name || node.label || `Layer ${node.id}`} style={{ flex: 1 }}>
                        {node.name || node.label || `Layer ${node.id}`}
                    </span>
                    {hasMultipleLegends && (
                        <span style={{ color: '#888', fontSize: '10px', marginLeft: 4, flexShrink: 0 }}>
                            ({legendItems.length})
                        </span>
                    )}
                </div>
                {hasMultipleLegends && isLegendExpanded && (
                    <div className="tree-children" style={{ marginTop: 2 }}>
                        {legendItems.map((legendItem, index) => (
                            <div
                                key={index}
                                className="upload-layer-sublayer tree-node"
                                style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2, color: '#666', minHeight: 18 }}
                            >
                                <img
                                    src={`data:${legendItem.contentType};base64,${legendItem.imageData}`}
                                    alt={legendItem.label || ''}
                                    className="legend-img"
                                    style={{ width: 14, height: 14, flexShrink: 0 }}
                                />
                                <span className="upload-layer-name" title={legendItem.label}>{legendItem.label}</span>
                            </div>
                        ))}
                    </div>
                )}
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
