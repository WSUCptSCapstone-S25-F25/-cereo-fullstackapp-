import React, { useEffect, useState, useCallback } from "react";
import './LayerContextMenu.css';

/**
 * Hook: manages context menu state, outside-click dismiss, and pin/unpin logic.
 *
 * Returns contextMenu state plus handlers that panels can use directly or wrap.
 *
 * @param {Object} opts
 * @param {Array}    opts.pinnedItems    - pinned items array
 * @param {Function} opts.setPinnedItems - setState for pinned items
 */
export function useLayerContextMenu({ pinnedItems, setPinnedItems }) {
    const [contextMenu, setContextMenu] = useState(null); // { x, y, type, data }

    const handleContextMenu = useCallback((e, type, data) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, type, data });
    }, []);

    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    // Close on outside click
    useEffect(() => {
        if (!contextMenu) return;
        const handler = () => setContextMenu(null);
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, [contextMenu]);

    const isPinned = useCallback((serviceKey, layerId, sublayerIndex) => {
        return pinnedItems.some(p =>
            p.serviceKey === serviceKey &&
            p.layerId === (layerId ?? null) &&
            p.sublayerIndex === (sublayerIndex ?? null)
        );
    }, [pinnedItems]);

    const handleTogglePin = useCallback(() => {
        if (!contextMenu) return;
        const { type, data } = contextMenu;
        let pinEntry;
        if (type === 'service') {
            pinEntry = { serviceKey: data.service.key, layerId: null, sublayerIndex: null };
        } else if (type === 'layer') {
            pinEntry = { serviceKey: data.service.key, layerId: data.layer.id, sublayerIndex: null };
        } else if (type === 'sublayer') {
            pinEntry = { serviceKey: data.service.key, layerId: data.layerId, sublayerIndex: data.sublayerIndex };
        } else {
            setContextMenu(null);
            return;
        }
        setPinnedItems(prev => {
            const exists = prev.some(p =>
                p.serviceKey === pinEntry.serviceKey &&
                p.layerId === pinEntry.layerId &&
                p.sublayerIndex === pinEntry.sublayerIndex
            );
            if (exists) {
                return prev.filter(p =>
                    !(p.serviceKey === pinEntry.serviceKey &&
                      p.layerId === pinEntry.layerId &&
                      p.sublayerIndex === pinEntry.sublayerIndex)
                );
            } else {
                return [...prev, pinEntry];
            }
        });
        setContextMenu(null);
    }, [contextMenu, setPinnedItems]);

    return {
        contextMenu,
        setContextMenu,
        handleContextMenu,
        closeContextMenu,
        isPinned,
        handleTogglePin,
    };
}

/**
 * Renders the floating context menu.
 *
 * @param {Object}   props.contextMenu       - { x, y, type, data } or null
 * @param {Function} props.isPinned          - (serviceKey, layerId?, sublayerIndex?) => bool
 * @param {Function} props.onRename          - rename handler
 * @param {Function} props.onLearnMore       - learn more handler
 * @param {Function} props.onTogglePin       - pin/unpin handler
 * @param {Array}    [props.extraServiceItems] - extra buttons for service type: [{ label, onClick }]
 * @param {string}   [props.className]       - optional extra CSS class
 */
export function LayerContextMenuPopup({
    contextMenu,
    isPinned,
    onRename,
    onLearnMore,
    onTogglePin,
    extraServiceItems = [],
    extraFolderItems = [],
    className = '',
}) {
    if (!contextMenu) return null;

    return (
        <div
            className={`layer-context-menu ${className}`.trim()}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
        >
            {contextMenu.type === 'folder' && (
                <>
                    {onRename && <button onClick={onRename}>Rename</button>}
                    {extraFolderItems.map((item, i) => (
                        <button key={i} onClick={item.onClick}>{item.label}</button>
                    ))}
                </>
            )}
            {contextMenu.type === 'service' && (
                <>
                    {onRename && <button onClick={onRename}>Rename</button>}
                    <button onClick={onLearnMore}>Learn More</button>
                    {extraServiceItems.map((item, i) => (
                        <button key={i} onClick={item.onClick}>{item.label}</button>
                    ))}
                    <button onClick={onTogglePin}>
                        {isPinned(contextMenu.data.service.key) ? 'Unpin' : 'Pin (Auto-load)'}
                    </button>
                </>
            )}
            {contextMenu.type === 'layer' && (
                <>
                    <button onClick={onLearnMore}>Learn More</button>
                    <button onClick={onTogglePin}>
                        {isPinned(contextMenu.data.service.key, contextMenu.data.layer.id) ? 'Unpin' : 'Pin (Auto-load)'}
                    </button>
                </>
            )}
            {contextMenu.type === 'sublayer' && (
                <button onClick={onTogglePin}>
                    {isPinned(contextMenu.data.service.key, contextMenu.data.layerId, contextMenu.data.sublayerIndex) ? 'Unpin' : 'Pin (Auto-load)'}
                </button>
            )}
        </div>
    );
}
