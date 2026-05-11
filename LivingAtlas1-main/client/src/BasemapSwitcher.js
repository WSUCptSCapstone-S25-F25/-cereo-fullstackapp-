import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faQuestion, faPlay } from '@fortawesome/free-solid-svg-icons';
import './BasemapSwitcher.css';
import BasemapPanelOnboarding from './OnboardingBasemapPanel';

const SF_TILE_SAMPLE = { z: 12, y: 1583, x: 6542 };

function createRasterStyle(id, tileUrl, attribution = '') {
    return {
        version: 8,
        name: id,
        sources: {
            [id]: {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: 256,
                attribution,
            },
        },
        layers: [
            {
                id: `${id}-layer`,
                type: 'raster',
                source: id,
                minzoom: 0,
                maxzoom: 22,
            },
        ],
    };
}

const BASEMAPS = [
    {
        id: 'navigation-day-v1',
        label: 'navigation-day-v1',
        style: 'mapbox://styles/mapbox/navigation-day-v1',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
        thumbnailNeedsToken: true,
    },
    {
        id: 'navigation-night-v1',
        label: 'navigation-night-v1',
        style: 'mapbox://styles/mapbox/navigation-night-v1',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
        thumbnailNeedsToken: true,
    },
    {
        id: 'outdoors-v12',
        label: 'outdoors-v12',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
        thumbnailNeedsToken: true,
    },
    {
        id: 'satellite-streets-v12',
        label: 'satellite-streets-v12',
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
        thumbnailNeedsToken: true,
    },
    {
        id: 'satellite-v9',
        label: 'satellite-v9',
        style: 'mapbox://styles/mapbox/satellite-v9',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
        thumbnailNeedsToken: true,
    },
    {
        id: 'streets-v12',
        label: 'streets-v12',
        style: 'mapbox://styles/mapbox/streets-v12',
        thumbnail: 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/-122.4194,37.7749,12,0/200x140@2x?access_token=',
        thumbnailNeedsToken: true,
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

export default function BasemapSwitcher({ isOpen, onClose, mapInstance, currentBasemapId, onBasemapChange }) {
    const [currentBasemap, setCurrentBasemap] = useState(currentBasemapId || 'streets-v12');
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const previousControlledBasemapRef = useRef(currentBasemapId || 'streets-v12');
    const token = getAccessToken();

    const applyBasemap = (map, basemap) => {
        if (!map || !basemap) return;

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

    useEffect(() => {
        const controlledId = currentBasemapId || 'streets-v12';
        if (controlledId === currentBasemap) {
            return;
        }

        const previousId = previousControlledBasemapRef.current;
        previousControlledBasemapRef.current = controlledId;
        setCurrentBasemap(controlledId);

        if (previousId === controlledId) {
            return;
        }

        const target = BASEMAPS.find(item => item.id === controlledId);
        if (!target) return;

        const map = typeof mapInstance === 'function' ? mapInstance() : mapInstance;
        if (map) {
            applyBasemap(map, target);
            return;
        }

        const retryTimer = window.setTimeout(() => {
            const retryMap = typeof mapInstance === 'function' ? mapInstance() : mapInstance;
            if (retryMap) {
                applyBasemap(retryMap, target);
            }
        }, 500);

        return () => window.clearTimeout(retryTimer);
    }, [currentBasemapId, currentBasemap, mapInstance]);

    const handleSelect = (basemap) => {
        const map = typeof mapInstance === 'function' ? mapInstance() : mapInstance;
        if (!map) return;
        applyBasemap(map, basemap);
        setCurrentBasemap(basemap.id);
        previousControlledBasemapRef.current = basemap.id;
        onBasemapChange?.(basemap.id);
    };

    useEffect(() => {
        if (!isOpen && isOnboardingOpen) {
            setIsOnboardingOpen(false);
        }
    }, [isOpen, isOnboardingOpen]);

    if (!isOpen) return null;

    return (
        <>
        <div className={`basemap-switcher-panel${isOnboardingOpen ? ' onboarding-locked' : ''}`}>
            <div className="basemap-switcher-header">
                <span className="basemap-switcher-title">Map Style</span>
                <div className="basemap-switcher-header-actions">
                    <button className="basemap-switcher-icon-btn" data-onboarding-target="basemap-help-button" title="Help" onClick={() => window.open('/user-manual?section=basemap-panel', '_blank')}>
                        <FontAwesomeIcon icon={faQuestion} />
                    </button>
                    <button className="basemap-switcher-icon-btn basemap-switcher-icon-btn--play" title="Tutorial" onClick={() => setIsOnboardingOpen(true)}>
                        <FontAwesomeIcon icon={faPlay} />
                    </button>
                    <button className="basemap-switcher-icon-btn" title="Close" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            </div>
            <div className="basemap-switcher-list" data-onboarding-target="basemap-list">
                {BASEMAPS.map(basemap => (
                    <div
                        key={basemap.id}
                        className={`basemap-switcher-item${currentBasemap === basemap.id ? ' basemap-switcher-item--active' : ''}`}
                        data-onboarding-target={currentBasemap === basemap.id ? 'basemap-active-item' : 'basemap-item'}
                        onClick={() => handleSelect(basemap)}
                    >
                        <img
                            className="basemap-switcher-thumb"
                            src={basemap.thumbnailNeedsToken ? basemap.thumbnail + token : basemap.thumbnail}
                            alt={basemap.label}
                            loading="lazy"
                        />
                        <span className="basemap-switcher-label">{basemap.label}</span>
                    </div>
                ))}
            </div>
        </div>
        <BasemapPanelOnboarding
            isOpen={isOnboardingOpen}
            onClose={() => setIsOnboardingOpen(false)}
            isPanelCollapsed={!isOpen}
        />
        </>
    );
}
