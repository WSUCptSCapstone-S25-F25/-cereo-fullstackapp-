import React from 'react';
import './LayerTree.css';

// --- Layer tree helpers (shared between ArcgisUploadPanel and CustomLayersPanel) ---

export function buildLayerTree(flatLayers) {
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

export function getAllLeafLayers(nodes) {
    const result = [];
    function collect(node) {
        if (node.type !== 'Group Layer') result.push(node);
        if (node.children) node.children.forEach(collect);
    }
    nodes.forEach(collect);
    return result;
}

export function getDescendantLeafLayers(node) {
    const result = [];
    function collect(n) {
        if (n.type !== 'Group Layer') result.push(n);
        if (n.children) n.children.forEach(collect);
    }
    if (node.children) node.children.forEach(collect);
    return result;
}

// --- Shared LayerTreeNode component ---
// Renders a single node (group or leaf) in the layer tree, recursively.
// All behavior is driven via callback props so each panel can plug in its own handlers.

export function LayerTreeNode({
    node,
    service,
    checkedIds,
    allFeatureLayers,
    serviceLegends,
    checkedSublayerIds,
    expandedLayers,
    searchResult,
    onLayerClick,
    onLayerCheckbox,
    onGroupCheckbox,
    onSublayerCheckbox,
    onContextMenu,
    depth = 0,
}) {
    const isGroupLayer = node.type === 'Group Layer';
    const expandKey = `${service.key}-${node.id}`;
    const isExpanded = expandedLayers.has(expandKey);

    // Bold highlighting for search matches
    const isBold = (name) =>
        searchResult?.matchedLayerIds?.[service.key]?.has(node.id) ||
        (searchResult?.keyword && name && name.toLowerCase().includes(searchResult.keyword));

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
                    onClick={() => onLayerClick(service.key, node.id)}
                    onContextMenu={onContextMenu ? (e) => onContextMenu(e, 'layer', { service, layer: node }) : undefined}
                >
                    <input
                        type="checkbox"
                        checked={allChecked}
                        ref={el => { if (el) el.indeterminate = someChecked; }}
                        onChange={(e) => {
                            e.stopPropagation();
                            onGroupCheckbox(service, node, allChecked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginRight: 4 }}
                    />
                    <span style={{ color: '#666', userSelect: 'none', marginRight: 4 }}>
                        {isExpanded ? "▼" : "►"}
                    </span>
                    <span className="upload-layer-name" title={node.name} style={{ flex: 1, fontWeight: isBold(node.name) ? 'bold' : 'normal' }}>{node.name}</span>
                    {descendantIds.length > 0 && (
                        <span style={{ color: '#999', fontSize: '10px', marginLeft: 4 }}>
                            ({checkedCount}/{descendantIds.length})
                        </span>
                    )}
                </div>
                {isExpanded && node.children.length > 0 && (
                    <div className="tree-children">
                        {node.children.map(child =>
                            <LayerTreeNode
                                key={child.id}
                                node={child}
                                service={service}
                                checkedIds={checkedIds}
                                allFeatureLayers={allFeatureLayers}
                                serviceLegends={serviceLegends}
                                checkedSublayerIds={checkedSublayerIds}
                                expandedLayers={expandedLayers}
                                searchResult={searchResult}
                                onLayerClick={onLayerClick}
                                onLayerCheckbox={onLayerCheckbox}
                                onGroupCheckbox={onGroupCheckbox}
                                onSublayerCheckbox={onSublayerCheckbox}
                                onContextMenu={onContextMenu}
                                depth={depth + 1}
                            />
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
                onClick={hasMultipleLegends ? () => onLayerClick(service.key, node.id) : undefined}
                onContextMenu={onContextMenu ? (e) => onContextMenu(e, 'layer', { service, layer: node }) : undefined}
            >
                <input
                    type="checkbox"
                    checked={checkedIds.includes(node.id)}
                    onChange={() => onLayerCheckbox(service, node.id, allFeatureLayers)}
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
                <span className="upload-layer-name" title={node.name} style={{ flex: 1, fontWeight: isBold(node.name) ? 'bold' : 'normal' }}>{node.name}</span>
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
                            onContextMenu={onContextMenu ? (e) => onContextMenu(e, 'sublayer', { service, layerId: node.id, sublayerIndex: index }) : undefined}
                        >
                            <input
                                type="checkbox"
                                checked={checkedSublayers.includes(index)}
                                onChange={() => onSublayerCheckbox(service, node.id, index, allFeatureLayers)}
                                style={{ marginRight: 6, width: '12px', height: '12px', flexShrink: 0 }}
                            />
                            <img
                                src={`data:${legendItem.contentType};base64,${legendItem.imageData}`}
                                alt={legendItem.label}
                                className="legend-img"
                                style={{ width: '14px', height: '14px', marginRight: '6px' }}
                            />
                            <span className="upload-layer-name" title={legendItem.label} style={{ fontWeight: (searchResult?.keyword && legendItem.label && legendItem.label.toLowerCase().includes(searchResult.keyword)) ? 'bold' : 'normal' }}>{legendItem.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </li>
    );
}
