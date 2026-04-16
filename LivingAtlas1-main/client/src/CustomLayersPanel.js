import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { addArcgisVectorLayer } from './arcgisVectorUtils';
import { showArcgisPopup } from './arcgisPopupUtils';
import {
    fetchArcgisLayers,
    fetchArcgisLegend,
    getArcgisTileUrl,
} from './arcgisDataUtils';
import { fetchCustomLayers, deleteCustomLayer } from './arcgisServicesDb';
import './CustomLayersPanel.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

// Reuse from ArcgisUploadPanel
function buildLayerTree(flatLayers) {
    const filtered = flatLayers.filter(l =>
        !(typeof l.name === 'string' && l.name.trim().toLowerCase() === 'placeholder')
    );
    const layerMap = {};
    filtered.forEach(l => { layerMap[l.id] = { ...l, children: [] }; });
    const roots = [];
    filtered.forEach(l => {
        const pid = l.parentLayer ? l.parentLayer.id : (l.parentLayerId !== undefined ? l.parentLayerId : -1);
        if (pid === -1 || pid === null || pid === undefined || !layerMap[pid]) {
            roots.push(layerMap[l.id]);
        } else {
            layerMap[pid].children.push(layerMap[l.id]);
        }
    });
    return roots;
}

function getAllLeafLayers(nodes) {
    const result = [];
    function collect(node) {
        if (node.type !== 'Group Layer') result.push(node);
        if (node.children) node.children.forEach(collect);
    }
    nodes.forEach(collect);
    return result;
}

function getDescendantLeafLayers(node) {
    const result = [];
    function collect(n) {
        if (n.type !== 'Group Layer') result.push(n);
        if (n.children) n.children.forEach(collect);
    }
    if (node.children) node.children.forEach(collect);
    return result;
}

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
    const [contextMenu, setContextMenu] = useState(null);
    const [statusMsg, setStatusMsg] = useState(null);
    const statusTimer = useRef(null);

    const prevCheckedLayerIds = useRef({});

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

    // Group services by folder
    const servicesByFolder = {};
    customServices.forEach(service => {
        const folder = service.folder || 'Root';
        if (!servicesByFolder[folder]) servicesByFolder[folder] = [];
        servicesByFolder[folder].push(service);
    });
    const folderNames = Object.keys(servicesByFolder).sort();

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

    // --- Map interaction: add/remove raster layers ---
    const addRasterLayer = useCallback((service, layerIds) => {
        const map = mapInstance && mapInstance();
        if (!map) return;
        const sourceId = `custom-raster-${service.key}`;
        const layerId = `custom-raster-layer-${service.key}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        if (!layerIds || layerIds.length === 0) return;

        const tileUrl = getArcgisTileUrl(service.url, layerIds);
        map.addSource(sourceId, {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
        });
        map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: { 'raster-opacity': layerOpacity },
        });
    }, [mapInstance, layerOpacity]);

    const removeRasterLayer = useCallback((service) => {
        const map = mapInstance && mapInstance();
        if (!map) return;
        const sourceId = `custom-raster-${service.key}`;
        const layerIdStr = `custom-raster-layer-${service.key}`;
        if (map.getLayer(layerIdStr)) map.removeLayer(layerIdStr);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
    }, [mapInstance]);

    // Update map whenever checked layers change
    useEffect(() => {
        customServices.forEach(service => {
            const checked = checkedLayerIds[service.key] || [];
            const prevChecked = prevCheckedLayerIds.current[service.key] || [];
            if (JSON.stringify(checked) === JSON.stringify(prevChecked)) return;

            if (checked.length > 0) {
                addRasterLayer(service, checked);
                setServiceLayerAdded(prev => ({ ...prev, [service.key]: true }));
            } else {
                removeRasterLayer(service);
                setServiceLayerAdded(prev => ({ ...prev, [service.key]: false }));
            }
        });
        prevCheckedLayerIds.current = { ...checkedLayerIds };
    }, [checkedLayerIds, customServices, addRasterLayer, removeRasterLayer]);

    // Opacity change handler
    const handleOpacityChange = (newOpacity) => {
        setLayerOpacity(newOpacity);
        const map = mapInstance && mapInstance();
        if (!map || !map.getStyle) return;
        const style = map.getStyle();
        if (!style || !Array.isArray(style.layers)) return;
        style.layers.forEach(l => {
            if (l.id.startsWith('custom-raster-layer-')) {
                map.setPaintProperty(l.id, 'raster-opacity', newOpacity);
            }
        });
    };

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
            const current = prev[service.key] || [];
            const newChecked = current.includes(layerId)
                ? current.filter(id => id !== layerId)
                : [...current, layerId];
            return { ...prev, [service.key]: newChecked };
        });
    };

    const handleSelectAll = (service, allFeatureLayers) => {
        setCheckedLayerIds(prev => {
            const current = prev[service.key] || [];
            const allIds = allFeatureLayers.map(l => l.id);
            const newChecked = current.length === allIds.length ? [] : allIds;
            return { ...prev, [service.key]: newChecked };
        });
    };

    const handleGroupLayerCheckbox = (service, node, allChecked) => {
        const descendantLeaves = getDescendantLeafLayers(node);
        const descendantIds = descendantLeaves.map(l => l.id);
        setCheckedLayerIds(prev => {
            const current = prev[service.key] || [];
            let newChecked;
            if (allChecked) {
                newChecked = current.filter(id => !descendantIds.includes(id));
            } else {
                const combined = new Set([...current, ...descendantIds]);
                newChecked = Array.from(combined);
            }
            return { ...prev, [service.key]: newChecked };
        });
    };

    const handleSublayerCheckbox = (service, layerId, sublayerIndex, allFeatureLayers) => {
        setCheckedSublayerIds(prev => {
            const serviceSublayers = prev[service.key] || {};
            const layerSublayers = serviceSublayers[layerId] || [];
            const newSublayers = layerSublayers.includes(sublayerIndex)
                ? layerSublayers.filter(i => i !== sublayerIndex)
                : [...layerSublayers, sublayerIndex];
            return {
                ...prev,
                [service.key]: { ...serviceSublayers, [layerId]: newSublayers }
            };
        });
        // Also check the parent layer if not checked
        setCheckedLayerIds(prev => {
            const current = prev[service.key] || [];
            if (!current.includes(layerId)) {
                return { ...prev, [service.key]: [...current, layerId] };
            }
            return prev;
        });
    };

    // Context menu
    const handleContextMenu = (e, type, data) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, type, data });
    };

    const closeContextMenu = () => setContextMenu(null);

    useEffect(() => {
        if (!contextMenu) return;
        const handler = () => closeContextMenu();
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, [contextMenu]);

    const handleRemoveCustomLayer = async () => {
        if (!contextMenu || contextMenu.type !== 'service') return;
        const service = contextMenu.data.service;
        closeContextMenu();
        try {
            await deleteCustomLayer(userEmail, service.key);
            // Remove from map
            removeRasterLayer(service);
            // Remove from local state
            setCustomServices(prev => prev.filter(s => s.key !== service.key));
            setServiceLayerAdded(prev => { const n = { ...prev }; delete n[service.key]; return n; });
            setCheckedLayerIds(prev => { const n = { ...prev }; delete n[service.key]; return n; });
            showStatus(`Removed "${service.label}" from custom layers`);
        } catch (err) {
            showStatus(`Failed to remove: ${err.message}`);
        }
    };

    // Recursive layer node renderer (simplified from ArcgisUploadPanel)
    const renderLayerNode = (node, service, checkedIds, allFeatureLayers, depth = 0) => {
        const isGroupLayer = node.type === 'Group Layer';
        const expandKey = `${service.key}-${node.id}`;
        const isExpanded = expandedLayers.has(expandKey);

        if (isGroupLayer) {
            const descendantLeaves = getDescendantLeafLayers(node);
            const descendantIds = descendantLeaves.map(l => l.id);
            const checkedCount = descendantIds.filter(id => checkedIds.includes(id)).length;
            const allChecked = descendantIds.length > 0 && checkedCount === descendantIds.length;
            const someChecked = checkedCount > 0 && !allChecked;

            return (
                <div key={node.id} className="tree-node">
                    <div
                        className="upload-layer-group"
                        onClick={() => handleLayerClick(service.key, node.id)}
                    >
                        <input
                            type="checkbox"
                            checked={allChecked}
                            ref={el => { if (el) el.indeterminate = someChecked; }}
                            onChange={(e) => {
                                e.stopPropagation();
                                handleGroupLayerCheckbox(service, node, allChecked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginRight: 4 }}
                        />
                        <span style={{ color: '#666', userSelect: 'none', marginRight: 4 }}>
                            {isExpanded ? "▼" : "►"}
                        </span>
                        <span className="upload-layer-name" title={node.name} style={{ flex: 1 }}>{node.name}</span>
                        {descendantIds.length > 0 && (
                            <span style={{ color: '#999', fontSize: '10px', marginLeft: 4 }}>
                                ({checkedCount}/{descendantIds.length})
                            </span>
                        )}
                    </div>
                    {isExpanded && node.children.length > 0 && (
                        <div className="tree-children">
                            {node.children.map(child =>
                                renderLayerNode(child, service, checkedIds, allFeatureLayers, depth + 1)
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Feature/Raster layer node
        let legendItems = [];
        const legend = serviceLegends[service.key];
        if (legend && legend.layers) {
            const legendLayer = legend.layers.find(l => l.layerId === node.id);
            if (legendLayer) legendItems = legendLayer.legend || [];
        }
        const hasMultipleLegends = legendItems.length > 1;
        const checkedSublayers = checkedSublayerIds[service.key]?.[node.id] || [];

        return (
            <li key={node.id} className="upload-layer-row tree-node" style={{
                flexDirection: 'column', alignItems: 'flex-start', marginBottom: 2
            }}>
                <div
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        minHeight: 20, width: '100%',
                        cursor: hasMultipleLegends ? 'pointer' : 'default'
                    }}
                    onClick={hasMultipleLegends ? () => handleLayerClick(service.key, node.id) : undefined}
                >
                    <input
                        type="checkbox"
                        checked={checkedIds.includes(node.id)}
                        onChange={() => handleLayerCheckbox(service, node.id, allFeatureLayers)}
                        style={{ marginRight: 8 }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    {hasMultipleLegends && (
                        <span style={{ color: '#666', marginRight: 4, userSelect: 'none' }}>
                            {expandedLayers.has(`${service.key}-${node.id}`) ? "▼" : "►"}
                        </span>
                    )}
                    {legendItems.length === 1 && (
                        <img
                            src={`data:${legendItems[0].contentType};base64,${legendItems[0].imageData}`}
                            alt={legendItems[0].label}
                            className="legend-img"
                        />
                    )}
                    <span className="upload-layer-name" title={node.name} style={{ flex: 1 }}>{node.name}</span>
                    {hasMultipleLegends && (
                        <span style={{ color: '#888', marginLeft: 8 }}>
                            ({checkedSublayers.length}/{legendItems.length})
                        </span>
                    )}
                </div>
                {hasMultipleLegends && expandedLayers.has(`${service.key}-${node.id}`) && (
                    <div className="tree-children" style={{ marginTop: 4 }}>
                        {legendItems.map((legendItem, index) => (
                            <div
                                key={index}
                                className="upload-layer-sublayer tree-node"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    marginBottom: 3, color: '#666', minHeight: '18px'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={checkedSublayers.includes(index)}
                                    onChange={() => handleSublayerCheckbox(service, node.id, index, allFeatureLayers)}
                                    style={{ marginRight: 6, width: '12px', height: '12px', flexShrink: 0 }}
                                />
                                <img
                                    src={`data:${legendItem.contentType};base64,${legendItem.imageData}`}
                                    alt={legendItem.label}
                                    className="legend-img"
                                    style={{ width: '14px', height: '14px', marginRight: '6px' }}
                                />
                                <span className="upload-layer-name" title={legendItem.label}>{legendItem.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </li>
        );
    };

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

            {/* Opacity slider */}
            <div className="custom-layers-panel-opacity-slider-row">
                <label>Layer Opacity:</label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={layerOpacity}
                    onChange={e => handleOpacityChange(parseFloat(e.target.value))}
                    className="custom-layers-panel-opacity-slider"
                    style={{ background: `linear-gradient(to right, #1976d2 ${layerOpacity * 100}%, #d0d0d0 ${layerOpacity * 100}%)` }}
                />
                <span className="custom-layers-panel-opacity-value">{Math.round(layerOpacity * 100)}%</span>
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
                    {folderNames.map(folder => {
                        const services = servicesByFolder[folder];
                        const isFolderExpanded = expandedFolders.has(folder);
                        return (
                            <div key={folder}>
                                <div
                                    className="custom-layers-folder"
                                    onClick={() => handleFolderClick(folder)}
                                >
                                    <span>{isFolderExpanded ? "▼" : "►"} {folder}</span>
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

                                            return (
                                                <div key={service.key}>
                                                    <div
                                                        className="custom-layers-item"
                                                        onClick={() => handleServiceClick(service.key)}
                                                        onContextMenu={(e) => handleContextMenu(e, 'service', { service })}
                                                    >
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
                                                        <span className="custom-layers-item-label" title={service.label}>
                                                            {service.label}
                                                        </span>
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
            {contextMenu && (
                <div
                    className="custom-layers-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.type === 'service' && (
                        <button onClick={handleRemoveCustomLayer}>Remove from Custom Layers</button>
                    )}
                </div>
            )}

            {/* Status messages */}
            {statusMsg && (
                <div className="custom-layers-loading-messages">
                    <div className="custom-layers-loading-message">{statusMsg}</div>
                </div>
            )}
        </div>
    );
}

export default CustomLayersPanel;
