import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import './PolygonDrawingModal.css';

const PolygonDrawingModal = ({ onSave, onCancel }) => {
    const [vertices, setVertices] = useState([]);
    const [isDrawing, setIsDrawing] = useState(true);
    const markersRef = useRef([]);
    const linesSourceAdded = useRef(false);
    const fillSourceAdded = useRef(false);
    const mapClickHandlerRef = useRef(null);
    const modalRef = useRef(null);

    const POLYGON_LINE_SOURCE = 'card-polygon-draw-line';
    const POLYGON_LINE_LAYER = 'card-polygon-draw-line-layer';
    const POLYGON_FILL_SOURCE = 'card-polygon-draw-fill';
    const POLYGON_FILL_LAYER = 'card-polygon-draw-fill-layer';

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
            draggable: true
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
                    'line-color': '#0077c0',
                    'line-width': 2.5,
                    'line-dasharray': [2, 1]
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
                    'fill-color': '#0077c0',
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
        onSave(vertices, centroid);
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

            <div className="polygon-draw-modal-vertices">
                {vertices.length === 0 && (
                    <div className="polygon-draw-modal-empty">No points added yet</div>
                )}
                {vertices.map((v, i) => (
                    <div key={i} className="polygon-draw-modal-vertex-row">
                        <span className="polygon-draw-modal-vertex-num">{i + 1}</span>
                        <span className="polygon-draw-modal-vertex-coords">
                            {v.lat.toFixed(6)}, {v.lng.toFixed(6)}
                        </span>
                        <button
                            type="button"
                            className="polygon-draw-modal-vertex-remove"
                            onClick={() => handleRemoveVertex(i)}
                            title="Remove point"
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
