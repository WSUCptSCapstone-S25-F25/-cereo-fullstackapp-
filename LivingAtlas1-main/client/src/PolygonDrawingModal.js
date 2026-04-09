import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import './PolygonDrawingModal.css';

const PolygonDrawingModal = ({ onSave, onCancel }) => {
    const [vertices, setVertices] = useState([]);
    const [isDrawing, setIsDrawing] = useState(true);
    const [lineStyle, setLineStyle] = useState('solid'); // 'solid', 'dashed', 'dotted'
    const [fillColor, setFillColor] = useState('#0077c0');
    const [showLineMenu, setShowLineMenu] = useState(false);
    const [showColorMenu, setShowColorMenu] = useState(false);
    const markersRef = useRef([]);
    const linesSourceAdded = useRef(false);
    const fillSourceAdded = useRef(false);
    const mapClickHandlerRef = useRef(null);
    const modalRef = useRef(null);

    const POLYGON_LINE_SOURCE = 'card-polygon-draw-line';
    const POLYGON_LINE_LAYER = 'card-polygon-draw-line-layer';
    const POLYGON_FILL_SOURCE = 'card-polygon-draw-fill';
    const POLYGON_FILL_LAYER = 'card-polygon-draw-fill-layer';

    const LINE_STYLES = {
        solid: [],
        dashed: [6, 3],
        dotted: [1.5, 3],
        dashdot: [6, 3, 1.5, 3],
    };

    const PALETTE_COLORS = [
        '#0077c0', '#e74c3c', '#27ae60', '#f39c12', '#8e44ad',
        '#1abc9c', '#2c3e50', '#d35400', '#c0392b', '#2980b9',
    ];

    // Update line style on map when lineStyle changes
    useEffect(() => {
        const map = window.atlasMapInstance;
        if (!map || !map.getLayer(POLYGON_LINE_LAYER)) return;
        const dash = LINE_STYLES[lineStyle] || [];
        map.setPaintProperty(POLYGON_LINE_LAYER, 'line-dasharray', dash.length ? dash : undefined);
    }, [lineStyle]);

    // Update fill color on map when fillColor changes
    useEffect(() => {
        const map = window.atlasMapInstance;
        if (!map) return;
        if (map.getLayer(POLYGON_LINE_LAYER)) {
            map.setPaintProperty(POLYGON_LINE_LAYER, 'line-color', fillColor);
        }
        if (map.getLayer(POLYGON_FILL_LAYER)) {
            map.setPaintProperty(POLYGON_FILL_LAYER, 'fill-color', fillColor);
        }
        // Update dot colors
        markersRef.current.forEach(m => {
            const dot = m.getElement().querySelector('.polygon-draw-vertex-dot');
            if (dot) dot.style.background = fillColor;
            const lbl = m.getElement().querySelector('.polygon-draw-vertex-label');
            if (lbl) lbl.style.color = fillColor;
        });
    }, [fillColor]);

    const updatePolygonOnMap = useCallback((verts) => {
        const map = window.atlasMapInstance;
        if (!map) return;

        // Build line coordinates (close the polygon if >= 3 points)
        const lineCoords = verts.map(v => [v.lng, v.lat]);
        if (lineCoords.length >= 3) {
            lineCoords.push(lineCoords[0]); // close
        }

        // Update line
        if (linesSourceAdded.current) {
            const src = map.getSource(POLYGON_LINE_SOURCE);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: {
                        type: lineCoords.length >= 2 ? 'LineString' : 'Point',
                        coordinates: lineCoords.length >= 2 ? lineCoords : (lineCoords[0] || [0, 0])
                    }
                });
            }
        }

        // Update fill (only if >= 3 points)
        if (fillSourceAdded.current) {
            const src = map.getSource(POLYGON_FILL_SOURCE);
            if (src) {
                if (verts.length >= 3) {
                    const fillCoords = verts.map(v => [v.lng, v.lat]);
                    fillCoords.push(fillCoords[0]);
                    src.setData({
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [fillCoords]
                        }
                    });
                } else {
                    src.setData({ type: 'FeatureCollection', features: [] });
                }
            }
        }
    }, []);

    const createDraggableMarker = useCallback((vertex, index, currentVertices) => {
        const map = window.atlasMapInstance;
        if (!map) return null;

        const el = document.createElement('div');
        el.className = 'polygon-draw-vertex-marker';

        const dot = document.createElement('div');
        dot.className = 'polygon-draw-vertex-dot';
        el.appendChild(dot);

        const label = document.createElement('span');
        label.className = 'polygon-draw-vertex-label';
        label.textContent = String(index + 1);
        el.appendChild(label);

        const marker = new mapboxgl.Marker({
            element: el,
            draggable: true,
            anchor: 'center'
        })
            .setLngLat([vertex.lng, vertex.lat])
            .addTo(map);

        marker.on('dragend', () => {
            const lngLat = marker.getLngLat();
            setVertices(prev => {
                const updated = [...prev];
                updated[index] = { lat: parseFloat(lngLat.lat.toFixed(6)), lng: parseFloat(lngLat.lng.toFixed(6)) };
                updatePolygonOnMap(updated);
                return updated;
            });
        });

        marker.on('drag', () => {
            const lngLat = marker.getLngLat();
            setVertices(prev => {
                const updated = [...prev];
                updated[index] = { lat: parseFloat(lngLat.lat.toFixed(6)), lng: parseFloat(lngLat.lng.toFixed(6)) };
                updatePolygonOnMap(updated);
                return updated;
            });
        });

        return marker;
    }, [updatePolygonOnMap]);

    const rebuildMarkers = useCallback((verts) => {
        // Remove old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        // Create new markers
        verts.forEach((v, i) => {
            const marker = createDraggableMarker(v, i, verts);
            if (marker) markersRef.current.push(marker);
        });
    }, [createDraggableMarker]);

    // Initialize map layers and click handler
    useEffect(() => {
        const map = window.atlasMapInstance;
        if (!map) return;

        // Add line source/layer
        if (!map.getSource(POLYGON_LINE_SOURCE)) {
            map.addSource(POLYGON_LINE_SOURCE, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
            linesSourceAdded.current = true;
        }
        if (!map.getLayer(POLYGON_LINE_LAYER)) {
            map.addLayer({
                id: POLYGON_LINE_LAYER,
                type: 'line',
                source: POLYGON_LINE_SOURCE,
                paint: {
                    'line-color': fillColor,
                    'line-width': 1.5,
                    'line-dasharray': LINE_STYLES[lineStyle] || []
                }
            });
        }

        // Add fill source/layer
        if (!map.getSource(POLYGON_FILL_SOURCE)) {
            map.addSource(POLYGON_FILL_SOURCE, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
            fillSourceAdded.current = true;
        }
        if (!map.getLayer(POLYGON_FILL_LAYER)) {
            map.addLayer({
                id: POLYGON_FILL_LAYER,
                type: 'fill',
                source: POLYGON_FILL_SOURCE,
                paint: {
                    'fill-color': fillColor,
                    'fill-opacity': 0.15
                }
            });
        }

        // Click handler for adding vertices
        const handleMapClick = (e) => {
            const { lat, lng } = e.lngLat;
            const newVertex = { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };

            setVertices(prev => {
                const updated = [...prev, newVertex];
                updatePolygonOnMap(updated);

                // Add draggable marker
                const marker = createDraggableMarker(newVertex, updated.length - 1, updated);
                if (marker) markersRef.current.push(marker);

                return updated;
            });
        };

        mapClickHandlerRef.current = handleMapClick;
        map.on('click', handleMapClick);

        // Change cursor
        map.getCanvas().style.cursor = 'crosshair';

        return () => {
            // Clean up
            if (mapClickHandlerRef.current) {
                map.off('click', mapClickHandlerRef.current);
            }
            map.getCanvas().style.cursor = '';

            // Remove markers
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];

            // Remove layers and sources
            if (map.getLayer(POLYGON_LINE_LAYER)) map.removeLayer(POLYGON_LINE_LAYER);
            if (map.getSource(POLYGON_LINE_SOURCE)) map.removeSource(POLYGON_LINE_SOURCE);
            if (map.getLayer(POLYGON_FILL_LAYER)) map.removeLayer(POLYGON_FILL_LAYER);
            if (map.getSource(POLYGON_FILL_SOURCE)) map.removeSource(POLYGON_FILL_SOURCE);
            linesSourceAdded.current = false;
            fillSourceAdded.current = false;
        };
    }, [updatePolygonOnMap, createDraggableMarker]);

    // Toggle label visibility on markers when drawing state changes
    const updateMarkerLabels = useCallback((show) => {
        markersRef.current.forEach(m => {
            const label = m.getElement().querySelector('.polygon-draw-vertex-label');
            if (label) {
                label.style.display = show ? '' : 'none';
            }
        });
    }, []);

    // Stop drawing mode (finish polygon)
    const handleFinishDrawing = () => {
        const map = window.atlasMapInstance;
        if (map && mapClickHandlerRef.current) {
            map.off('click', mapClickHandlerRef.current);
            mapClickHandlerRef.current = null;
            map.getCanvas().style.cursor = '';
        }
        setIsDrawing(false);
        updateMarkerLabels(false);
    };

    // Resume drawing
    const handleResumeDrawing = () => {
        const map = window.atlasMapInstance;
        if (!map) return;

        const handleMapClick = (e) => {
            const { lat, lng } = e.lngLat;
            const newVertex = { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };

            setVertices(prev => {
                const updated = [...prev, newVertex];
                updatePolygonOnMap(updated);
                rebuildMarkers(updated);
                return updated;
            });
        };

        mapClickHandlerRef.current = handleMapClick;
        map.on('click', handleMapClick);
        map.getCanvas().style.cursor = 'crosshair';
        setIsDrawing(true);
        updateMarkerLabels(true);
    };

    const handleRemoveVertex = (index) => {
        setVertices(prev => {
            const updated = prev.filter((_, i) => i !== index);
            updatePolygonOnMap(updated);
            rebuildMarkers(updated);
            return updated;
        });
    };

    const handleSave = () => {
        if (vertices.length < 3) {
            alert('A polygon needs at least 3 points.');
            return;
        }
        // Compute centroid for lat/lng fields
        const centroid = vertices.reduce(
            (acc, v) => ({ lat: acc.lat + v.lat / vertices.length, lng: acc.lng + v.lng / vertices.length }),
            { lat: 0, lng: 0 }
        );
        onSave(vertices, centroid, { lineStyle, fillColor });
    };

    const handleCancel = () => {
        onCancel();
    };

    const mapContainer = window.atlasMapInstance?.getContainer();
    if (!mapContainer) return null;

    return ReactDOM.createPortal(
        <div className="polygon-draw-modal" ref={modalRef}>
            <div className="polygon-draw-modal-header">
                <h3>Draw Polygon</h3>
                <span className="polygon-draw-modal-hint">
                    {isDrawing ? 'Click on the map to add points' : 'Drag points to adjust'}
                </span>
            </div>

            {/* Style toolbar */}
            <div className="polygon-draw-style-toolbar">
                <div className="polygon-draw-style-btn-wrap">
                    <button
                        type="button"
                        className="polygon-draw-style-btn"
                        title="Line Style"
                        onClick={() => { setShowLineMenu(v => !v); setShowColorMenu(false); }}
                    >
                        <svg width="18" height="10" viewBox="0 0 18 10">
                            {lineStyle === 'solid' && <line x1="0" y1="5" x2="18" y2="5" stroke="currentColor" strokeWidth="2"/>}
                            {lineStyle === 'dashed' && <line x1="0" y1="5" x2="18" y2="5" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"/>}
                            {lineStyle === 'dotted' && <line x1="0" y1="5" x2="18" y2="5" stroke="currentColor" strokeWidth="2" strokeDasharray="1 3" strokeLinecap="round"/>}
                            {lineStyle === 'dashdot' && <line x1="0" y1="5" x2="18" y2="5" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2 1 2"/>}
                        </svg>
                    </button>
                    {showLineMenu && (
                        <div className="polygon-draw-dropdown">
                            {Object.keys(LINE_STYLES).map(key => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`polygon-draw-dropdown-item${lineStyle === key ? ' active' : ''}`}
                                    onClick={() => { setLineStyle(key); setShowLineMenu(false); }}
                                >
                                    <svg width="32" height="8" viewBox="0 0 32 8">
                                        {key === 'solid' && <line x1="0" y1="4" x2="32" y2="4" stroke="currentColor" strokeWidth="2"/>}
                                        {key === 'dashed' && <line x1="0" y1="4" x2="32" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray="6 3"/>}
                                        {key === 'dotted' && <line x1="0" y1="4" x2="32" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray="1.5 3" strokeLinecap="round"/>}
                                        {key === 'dashdot' && <line x1="0" y1="4" x2="32" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray="6 3 1.5 3"/>}
                                    </svg>
                                    <span>{key}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="polygon-draw-style-btn-wrap">
                    <button
                        type="button"
                        className="polygon-draw-style-btn"
                        title="Fill Color"
                        onClick={() => { setShowColorMenu(v => !v); setShowLineMenu(false); }}
                    >
                        <span className="polygon-draw-color-swatch" style={{ background: fillColor }} />
                    </button>
                    {showColorMenu && (
                        <div className="polygon-draw-dropdown polygon-draw-color-grid">
                            {PALETTE_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`polygon-draw-color-option${fillColor === c ? ' active' : ''}`}
                                    style={{ background: c }}
                                    onClick={() => { setFillColor(c); setShowColorMenu(false); }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="polygon-draw-modal-vertices">
                {vertices.length === 0 && (
                    <div className="polygon-draw-modal-empty">No points yet</div>
                )}
                {vertices.map((v, i) => (
                    <div key={i} className="polygon-draw-modal-vertex-row">
                        <span className="polygon-draw-modal-vertex-num">{i + 1}</span>
                        <span className="polygon-draw-modal-vertex-coords">
                            {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
                        </span>
                        <button
                            type="button"
                            className="polygon-draw-modal-vertex-remove"
                            onClick={() => handleRemoveVertex(i)}
                            title="Remove"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>

            <div className="polygon-draw-modal-actions">
                {isDrawing && vertices.length >= 3 && (
                    <button
                        type="button"
                        className="polygon-draw-modal-btn polygon-draw-modal-btn-finish"
                        onClick={handleFinishDrawing}
                    >
                        Finish Drawing
                    </button>
                )}
                {!isDrawing && (
                    <button
                        type="button"
                        className="polygon-draw-modal-btn polygon-draw-modal-btn-resume"
                        onClick={handleResumeDrawing}
                    >
                        Add More Points
                    </button>
                )}
                <button
                    type="button"
                    className="polygon-draw-modal-btn polygon-draw-modal-btn-save"
                    onClick={handleSave}
                    disabled={vertices.length < 3}
                >
                    Save
                </button>
                <button
                    type="button"
                    className="polygon-draw-modal-btn polygon-draw-modal-btn-cancel"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
            </div>
        </div>,
        mapContainer
    );
};

export default PolygonDrawingModal;
