import React, { useState } from 'react';
import './BasemapSwitcher.css';

const BASEMAPS = [
    {
        id: 'dark-v11',
        label: 'dark-v11',
        style: 'mapbox://styles/mapbox/dark-v11',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
    },
    {
        id: 'light-v11',
        label: 'light-v11',
        style: 'mapbox://styles/mapbox/light-v11',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/light-v11/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
    },
    {
        id: 'navigation-day-v1',
        label: 'navigation-day-v1',
        style: 'mapbox://styles/mapbox/navigation-day-v1',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
    },
    {
        id: 'navigation-night-v1',
        label: 'navigation-night-v1',
        style: 'mapbox://styles/mapbox/navigation-night-v1',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
    },
    {
        id: 'outdoors-v12',
        label: 'outdoors-v12',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
    },
    {
        id: 'satellite-streets-v12',
        label: 'satellite-streets-v12',
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
    },
    {
        id: 'satellite-v9',
        label: 'satellite-v9',
        style: 'mapbox://styles/mapbox/satellite-v9',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
    },
    {
        id: 'standard',
        label: 'standard',
        style: 'mapbox://styles/mapbox/standard',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/standard/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
    },
    {
        id: 'streets-v12',
        label: 'streets-v12',
        style: 'mapbox://styles/mapbox/streets-v12',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
    },
];

function getAccessToken() {
    // Read token from mapboxgl global (set in Content1.js)
    if (window.mapboxgl && window.mapboxgl.accessToken) return window.mapboxgl.accessToken;
    try {
        const mapboxgl = require('mapbox-gl');
        return mapboxgl.accessToken || '';
    } catch {
        return '';
    }
}

export default function BasemapSwitcher({ isOpen, onClose, mapInstance }) {
    const [currentBasemap, setCurrentBasemap] = useState('streets-v12');
    const token = getAccessToken();

    const handleSelect = (basemap) => {
        const map = typeof mapInstance === 'function' ? mapInstance() : mapInstance;
        if (!map) return;

        // Save current map state
        const center = map.getCenter();
        const zoom = map.getZoom();
        const bearing = map.getBearing();
        const pitch = map.getPitch();

        // Collect existing non-basemap sources and layers to restore after style change
        const style = map.getStyle();
        const customSources = {};
        const customLayers = [];

        if (style) {
            // Save custom (non-mapbox) sources
            Object.keys(style.sources || {}).forEach(id => {
                if (!id.startsWith('mapbox') && !id.startsWith('composite')) {
                    customSources[id] = style.sources[id];
                }
            });
            // Save custom layers
            (style.layers || []).forEach(layer => {
                const src = layer.source || '';
                if (src && !src.startsWith('mapbox') && !src.startsWith('composite')) {
                    customLayers.push(layer);
                }
            });
        }

        map.setStyle(basemap.style);
        setCurrentBasemap(basemap.id);

        // Restore custom sources and layers after style loads
        map.once('style.load', () => {
            // Restore view
            map.setCenter(center);
            map.setZoom(zoom);
            map.setBearing(bearing);
            map.setPitch(pitch);

            // Re-add custom sources
            Object.keys(customSources).forEach(id => {
                if (!map.getSource(id)) {
                    try {
                        map.addSource(id, customSources[id]);
                    } catch (e) {
                        console.warn('Failed to restore source:', id, e);
                    }
                }
            });

            // Re-add custom layers
            customLayers.forEach(layer => {
                if (!map.getLayer(layer.id)) {
                    try {
                        map.addLayer(layer);
                    } catch (e) {
                        console.warn('Failed to restore layer:', layer.id, e);
                    }
                }
            });
        });
    };

    if (!isOpen) return null;

    return (
        <div className="basemap-switcher-panel">
            <div className="basemap-switcher-header">
                <span className="basemap-switcher-title">Map Style</span>
                <button className="basemap-switcher-close" onClick={onClose}>✕</button>
            </div>
            <div className="basemap-switcher-list">
                {BASEMAPS.map(basemap => (
                    <div
                        key={basemap.id}
                        className={`basemap-switcher-item${currentBasemap === basemap.id ? ' basemap-switcher-item--active' : ''}`}
                        onClick={() => handleSelect(basemap)}
                    >
                        <img
                            className="basemap-switcher-thumb"
                            src={basemap.thumbnail + token}
                            alt={basemap.label}
                            loading="lazy"
                        />
                        <span className="basemap-switcher-label">{basemap.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
