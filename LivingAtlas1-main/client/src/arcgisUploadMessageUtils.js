import { useState, useRef, useMemo } from "react";

// Custom hook for managing loading messages (consolidated into single messages)
export function useArcgisLoadingMessages() {
    const [rawMessages, setRawMessages] = useState([]);
    const timersRef = useRef({});

    // Add a loading message
    function addLoadingMessage(id, text) {
        setRawMessages(prev => [{ id, text, type: "loading" }, ...prev.filter(m => m.id !== id)]);
    }

    // Remove a loading message
    function removeLoadingMessage(id) {
        setRawMessages(prev => prev.filter(m => m.id !== id));
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }
    }

    // Show finished message, then auto-remove after 2.5s
    function showFinishedMessage(id, text) {
        setRawMessages(prev => [{ id, text, type: "finished" }, ...prev.filter(m => m.id !== id)]);
        timersRef.current[id] = setTimeout(() => {
            setRawMessages(prev => prev.filter(m => m.id !== id));
            delete timersRef.current[id];
        }, 2500);
    }

    // Consolidate messages: show at most one loading and one finished message
    const messages = useMemo(() => {
        const loadingItems = rawMessages.filter(m => m.type === "loading");
        const finishedItems = rawMessages.filter(m => m.type === "finished");
        const consolidated = [];

        if (loadingItems.length === 1) {
            consolidated.push(loadingItems[0]);
        } else if (loadingItems.length > 1) {
            consolidated.push({
                id: "__consolidated_loading__",
                text: `Loading ${loadingItems.length} layers...`,
                type: "loading"
            });
        }

        if (finishedItems.length === 1) {
            consolidated.push(finishedItems[0]);
        } else if (finishedItems.length > 1) {
            consolidated.push({
                id: "__consolidated_finished__",
                text: `Finished loading ${finishedItems.length} layers.`,
                type: "finished"
            });
        }

        return consolidated;
    }, [rawMessages]);

    function clearAllMessages() {
        Object.keys(timersRef.current).forEach(id => {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        });
        setRawMessages([]);
    }

    return {
        messages,
        addLoadingMessage,
        removeLoadingMessage,
        showFinishedMessage,
        clearAllMessages
    };
}

export function getLoadingMsgId(service, layer) {
    return layer
        ? `${service.folder || 'Root'}/${service.label}/${layer.name || layer.id}`
        : `${service.folder || 'Root'}/${service.label}/All layers`;
}

export function getLoadingMsgText(service, layer, finished = false) {
    const base = layer
        ? `${service.folder || 'Root'}/${service.label}/${layer.name || layer.id}`
        : `${service.folder || 'Root'}/${service.label}/All layers`;
    return finished
        ? `Finished Loading ${base}.`
        : `Loading ${base}...`;
}