import { useState, useRef } from "react";

// Custom hook for managing loading messages
export function useArcgisLoadingMessages() {
    const [messages, setMessages] = useState([]);
    const timersRef = useRef({});

    // Add a loading message
    function addLoadingMessage(id, text) {
        setMessages(prev => [{ id, text, type: "loading" }, ...prev.filter(m => m.id !== id)]);
    }

    // Remove a loading message
    function removeLoadingMessage(id) {
        setMessages(prev => prev.filter(m => m.id !== id));
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }
    }

    // Show finished message, then auto-remove after 2.5s
    function showFinishedMessage(id, text) {
        setMessages(prev => [{ id, text, type: "finished" }, ...prev.filter(m => m.id !== id)]);
        timersRef.current[id] = setTimeout(() => {
            setMessages(prev => prev.filter(m => m.id !== id));
            delete timersRef.current[id];
        }, 2500);
    }

    return {
        messages,
        addLoadingMessage,
        removeLoadingMessage,
        showFinishedMessage
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