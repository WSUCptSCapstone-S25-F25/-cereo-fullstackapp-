import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHand, faRotate, faUpRightAndDownLeftFromCenter } from '@fortawesome/free-solid-svg-icons';
import './PolygonDrawingModal.css';

const PolygonDrawingModal = ({ onSave, onCancel, initialVertices, initialLineStyle, initialFillColor }) => {
    const [vertices, setVertices] = useState(initialVertices || []);
    const [isDrawing, setIsDrawing] = useState(!(initialVertices && initialVertices.length >= 3));
    const [lineStyle, setLineStyle] = useState(initialLineStyle || 'solid'); // 'solid', 'dashed', 'dotted'
    const [fillColor, setFillColor] = useState(initialFillColor || '#0077c0');
    const [showLineMenu, setShowLineMenu] = useState(false);
    const [showColorMenu, setShowColorMenu] = useState(false);
    const [showShapeMenu, setShowShapeMenu] = useState(false);
    const [showOpacityMenu, setShowOpacityMenu] = useState(false);
    const [fillOpacity, setFillOpacity] = useState(0.15);
    const [activeShape, setActiveShape] = useState(null); // 'triangle' | 'square' | 'rectangle' | 'circle' | 'dot' | null
    const [isDragMode, setIsDragMode] = useState(false);
    const [isRotateMode, setIsRotateMode] = useState(false);
    const [isResizeMode, setIsResizeMode] = useState(false);
    const shapePlacingRef = useRef(null); // { shape, origin: {lat,lng}, active: bool }
    const dragRef = useRef(null); // { origin: {lat,lng}, startVertices: [...] }
    const dragHandlersRef = useRef(null); // store bound handlers for cleanup
    const rotateRef = useRef(null); // { startAngle, centroid, startVertices }
    const rotateHandlersRef = useRef(null);
    const resizeHandlesRef = useRef([]); // 8 Mapbox markers for bounding-box handles
    const resizeStateRef = useRef(null); // { handleType, anchorLat, anchorLng, startVertices, startBBox }
    const circleMetaRef = useRef(null); // { center:{lat,lng}, radiusLat, radiusLng, segments } when current shape is circle/dot
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

    // Update fill opacity on map when fillOpacity changes
    useEffect(() => {
        const map = window.atlasMapInstance;
        if (!map || !map.getLayer(POLYGON_FILL_LAYER)) return;
        map.setPaintProperty(POLYGON_FILL_LAYER, 'fill-opacity', fillOpacity);
    }, [fillOpacity]);

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

    // Toggle label visibility on markers when drawing state changes
    const updateMarkerLabels = useCallback((show) => {
        markersRef.current.forEach(m => {
            const label = m.getElement().querySelector('.polygon-draw-vertex-label');
            if (label) {
                label.style.display = show ? '' : 'none';
            }
        });
    }, []);

    // ── Shape preset helpers ──
    const generateShapeVertices = useCallback((shape, center, dx, dy) => {
        // dx/dy are lng/lat offsets from center to the drag point
        // Compensate for Mercator distortion: 1° lng is visually cos(lat) × 1° lat
        const cosLat = Math.cos(center.lat * Math.PI / 180);
        const lngScale = cosLat > 0.0001 ? 1 / cosLat : 1;
        // Normalize dx to lat-equivalent units for radius computation
        const dxNorm = dx * cosLat;

        if (shape === 'triangle') {
            // Equilateral-ish triangle inscribed in the drag radius
            const r = Math.sqrt(dxNorm * dxNorm + dy * dy);
            if (r < 0.00001) return [];
            return [
                { lat: center.lat + r,        lng: center.lng },                          // top
                { lat: center.lat - r * 0.5,  lng: center.lng - r * 0.866 * lngScale },   // bottom-left
                { lat: center.lat - r * 0.5,  lng: center.lng + r * 0.866 * lngScale },   // bottom-right
            ];
        }
        if (shape === 'square') {
            const r = Math.sqrt(dxNorm * dxNorm + dy * dy);
            if (r < 0.00001) return [];
            const s = r / Math.SQRT2; // half-side so corners land on the circle
            return [
                { lat: center.lat + s, lng: center.lng - s * lngScale },
                { lat: center.lat + s, lng: center.lng + s * lngScale },
                { lat: center.lat - s, lng: center.lng + s * lngScale },
                { lat: center.lat - s, lng: center.lng - s * lngScale },
            ];
        }
        if (shape === 'rectangle') {
            const halfW = Math.abs(dx);
            const halfH = Math.abs(dy);
            if (halfW < 0.00001 && halfH < 0.00001) return [];
            return [
                { lat: center.lat + halfH, lng: center.lng - halfW },
                { lat: center.lat + halfH, lng: center.lng + halfW },
                { lat: center.lat - halfH, lng: center.lng + halfW },
                { lat: center.lat - halfH, lng: center.lng - halfW },
            ];
        }
        if (shape === 'circle') {
            const r = Math.sqrt(dxNorm * dxNorm + dy * dy);
            if (r < 0.00001) return [];
            const segments = 36;
            const verts = [];
            for (let i = 0; i < segments; i++) {
                const angle = (2 * Math.PI * i) / segments;
                verts.push({
                    lat: center.lat + r * Math.cos(angle),
                    lng: center.lng + r * Math.sin(angle) * lngScale,
                });
            }
            return verts;
        }
        if (shape === 'dot') {
            const r = Math.sqrt(dxNorm * dxNorm + dy * dy);
            // Dot uses a small fixed radius (clamp to a minimum)
            const dotR = Math.max(r, 0.0005);
            const segments = 24;
            const verts = [];
            for (let i = 0; i < segments; i++) {
                const angle = (2 * Math.PI * i) / segments;
                verts.push({
                    lat: center.lat + dotR * Math.cos(angle),
                    lng: center.lng + dotR * Math.sin(angle) * lngScale,
                });
            }
            return verts;
        }
        return [];
    }, []);

    // ── Whole-polygon drag mode ──
    const stopDragMode = useCallback(() => {
        const map = window.atlasMapInstance;
        if (!map) return;
        if (dragHandlersRef.current) {
            map.off('mousedown', dragHandlersRef.current.onMouseDown);
            map.off('mousemove', dragHandlersRef.current.onMouseMove);
            map.off('mouseup', dragHandlersRef.current.onMouseUp);
            dragHandlersRef.current = null;
        }
        dragRef.current = null;
        map.dragPan.enable();
        map.getCanvas().style.cursor = '';
        // Re-enable individual vertex dragging
        markersRef.current.forEach(m => m.setDraggable(true));
    }, []);

    const startDragMode = useCallback(() => {
        const map = window.atlasMapInstance;
        if (!map) return;

        // Disable vertex click handler
        if (mapClickHandlerRef.current) {
            map.off('click', mapClickHandlerRef.current);
            mapClickHandlerRef.current = null;
        }
        setIsDrawing(false);

        // Disable individual vertex dragging while in drag mode
        markersRef.current.forEach(m => m.setDraggable(false));

        map.getCanvas().style.cursor = 'grab';

        const onMouseDown = (e) => {
            e.preventDefault();
            const { lat, lng } = e.lngLat;
            setVertices(currentVerts => {
                dragRef.current = { origin: { lat, lng }, startVertices: currentVerts.map(v => ({ ...v })) };
                return currentVerts;
            });
            map.dragPan.disable();
            map.getCanvas().style.cursor = 'grabbing';
        };

        const onMouseMove = (e) => {
            if (!dragRef.current) return;
            const { origin, startVertices } = dragRef.current;
            const dLat = e.lngLat.lat - origin.lat;
            const dLng = e.lngLat.lng - origin.lng;
            const moved = startVertices.map(v => ({
                lat: parseFloat((v.lat + dLat).toFixed(6)),
                lng: parseFloat((v.lng + dLng).toFixed(6)),
            }));
            updatePolygonOnMap(moved);
            moved.forEach((v, i) => {
                if (markersRef.current[i]) {
                    markersRef.current[i].setLngLat([v.lng, v.lat]);
                }
            });
        };

        const onMouseUp = (e) => {
            if (!dragRef.current) return;
            const { origin, startVertices } = dragRef.current;
            const dLat = e.lngLat.lat - origin.lat;
            const dLng = e.lngLat.lng - origin.lng;
            const moved = startVertices.map(v => ({
                lat: parseFloat((v.lat + dLat).toFixed(6)),
                lng: parseFloat((v.lng + dLng).toFixed(6)),
            }));
            dragRef.current = null;
            map.dragPan.enable();
            map.getCanvas().style.cursor = 'grab';
            setVertices(moved);
            updatePolygonOnMap(moved);
            moved.forEach((v, i) => {
                if (markersRef.current[i]) {
                    markersRef.current[i].setLngLat([v.lng, v.lat]);
                }
            });
        };

        dragHandlersRef.current = { onMouseDown, onMouseMove, onMouseUp };
        map.on('mousedown', onMouseDown);
        map.on('mousemove', onMouseMove);
        map.on('mouseup', onMouseUp);
    }, [updatePolygonOnMap]);

    // ── Whole-polygon rotate mode ──
    const stopRotateMode = useCallback(() => {
        const map = window.atlasMapInstance;
        if (!map) return;
        if (rotateHandlersRef.current) {
            map.off('mousedown', rotateHandlersRef.current.onMouseDown);
            map.off('mousemove', rotateHandlersRef.current.onMouseMove);
            map.off('mouseup', rotateHandlersRef.current.onMouseUp);
            rotateHandlersRef.current = null;
        }
        rotateRef.current = null;
        map.dragPan.enable();
        map.getCanvas().style.cursor = '';
        markersRef.current.forEach(m => m.setDraggable(true));
    }, []);

    const startRotateMode = useCallback(() => {
        const map = window.atlasMapInstance;
        if (!map) return;

        if (mapClickHandlerRef.current) {
            map.off('click', mapClickHandlerRef.current);
            mapClickHandlerRef.current = null;
        }
        setIsDrawing(false);
        markersRef.current.forEach(m => m.setDraggable(false));
        map.getCanvas().style.cursor = 'crosshair';

        const onMouseDown = (e) => {
            e.preventDefault();
            const { lat, lng } = e.lngLat;
            setVertices(currentVerts => {
                const cx = currentVerts.reduce((s, v) => s + v.lng, 0) / currentVerts.length;
                const cy = currentVerts.reduce((s, v) => s + v.lat, 0) / currentVerts.length;
                const startAngle = Math.atan2(lat - cy, lng - cx);
                rotateRef.current = {
                    startAngle,
                    centroid: { lat: cy, lng: cx },
                    startVertices: currentVerts.map(v => ({ ...v })),
                };
                return currentVerts;
            });
            map.dragPan.disable();
        };

        const rotateVertices = (startVerts, centroid, angle) => {
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const cosLat = Math.cos(centroid.lat * Math.PI / 180);
            return startVerts.map(v => {
                const dx = (v.lng - centroid.lng) * cosLat;
                const dy = v.lat - centroid.lat;
                return {
                    lng: parseFloat((centroid.lng + (dx * cosA - dy * sinA) / cosLat).toFixed(6)),
                    lat: parseFloat((centroid.lat + dx * sinA + dy * cosA).toFixed(6)),
                };
            });
        };

        const onMouseMove = (e) => {
            if (!rotateRef.current) return;
            const { startAngle, centroid, startVertices } = rotateRef.current;
            const curAngle = Math.atan2(e.lngLat.lat - centroid.lat, e.lngLat.lng - centroid.lng);
            const delta = curAngle - startAngle;
            const rotated = rotateVertices(startVertices, centroid, delta);
            updatePolygonOnMap(rotated);
            rotated.forEach((v, i) => {
                if (markersRef.current[i]) markersRef.current[i].setLngLat([v.lng, v.lat]);
            });
        };

        const onMouseUp = (e) => {
            if (!rotateRef.current) return;
            const { startAngle, centroid, startVertices } = rotateRef.current;
            const curAngle = Math.atan2(e.lngLat.lat - centroid.lat, e.lngLat.lng - centroid.lng);
            const delta = curAngle - startAngle;
            const rotated = rotateVertices(startVertices, centroid, delta);
            rotateRef.current = null;
            map.dragPan.enable();
            setVertices(rotated);
            updatePolygonOnMap(rotated);
            rotated.forEach((v, i) => {
                if (markersRef.current[i]) markersRef.current[i].setLngLat([v.lng, v.lat]);
            });
        };

        rotateHandlersRef.current = { onMouseDown, onMouseMove, onMouseUp };
        map.on('mousedown', onMouseDown);
        map.on('mousemove', onMouseMove);
        map.on('mouseup', onMouseUp);
    }, [updatePolygonOnMap]);

    // ── Bounding-box resize mode ──
    const stopResizeMode = useCallback(() => {
        resizeHandlesRef.current.forEach(m => m.remove());
        resizeHandlesRef.current = [];
        resizeStateRef.current = null;
        markersRef.current.forEach(m => m.setDraggable(true));
    }, []);

    const startResizeMode = useCallback(() => {
        const map = window.atlasMapInstance;
        if (!map) return;

        if (mapClickHandlerRef.current) {
            map.off('click', mapClickHandlerRef.current);
            mapClickHandlerRef.current = null;
        }
        setIsDrawing(false);
        markersRef.current.forEach(m => m.setDraggable(false));

        // Compute bounding box
        const buildBBox = (verts) => {
            const lats = verts.map(v => v.lat);
            const lngs = verts.map(v => v.lng);
            return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) };
        };

        const computeHandles = (bbox) => {
            const { minLat, maxLat, minLng, maxLng } = bbox;
            const midLat = (minLat + maxLat) / 2;
            const midLng = (minLng + maxLng) / 2;
            return [
                // corners: type, lat, lng, cursor
                { type: 'corner-tl', lat: maxLat, lng: minLng, cursor: 'nwse-resize' },
                { type: 'corner-tr', lat: maxLat, lng: maxLng, cursor: 'nesw-resize' },
                { type: 'corner-br', lat: minLat, lng: maxLng, cursor: 'nwse-resize' },
                { type: 'corner-bl', lat: minLat, lng: minLng, cursor: 'nesw-resize' },
                // edges: top, right, bottom, left
                { type: 'edge-t', lat: maxLat, lng: midLng, cursor: 'ns-resize' },
                { type: 'edge-r', lat: midLat, lng: maxLng, cursor: 'ew-resize' },
                { type: 'edge-b', lat: minLat, lng: midLng, cursor: 'ns-resize' },
                { type: 'edge-l', lat: midLat, lng: minLng, cursor: 'ew-resize' },
            ];
        };

        const applyResize = (startVerts, startBBox, handleType, newLat, newLng) => {
            const { minLat, maxLat, minLng, maxLng } = startBBox;

            // Corner drag → uniform scale (preserve shape) with cos(lat) compensation
            if (handleType.startsWith('corner')) {
                // Determine anchor (opposite corner) and original corner
                let anchorLat, anchorLng, origLat, origLng;
                if (handleType === 'corner-tl') { anchorLat = minLat; anchorLng = maxLng; origLat = maxLat; origLng = minLng; }
                else if (handleType === 'corner-tr') { anchorLat = minLat; anchorLng = minLng; origLat = maxLat; origLng = maxLng; }
                else if (handleType === 'corner-br') { anchorLat = maxLat; anchorLng = minLng; origLat = minLat; origLng = maxLng; }
                else { /* corner-bl */ anchorLat = maxLat; anchorLng = maxLng; origLat = minLat; origLng = minLng; }

                const centerLat = (minLat + maxLat) / 2;
                const cosLat = Math.cos(centerLat * Math.PI / 180);
                const oDx = (origLng - anchorLng) * cosLat;
                const oDy = origLat - anchorLat;
                const origDist = Math.sqrt(oDx * oDx + oDy * oDy);
                const nDx = (newLng - anchorLng) * cosLat;
                const nDy = newLat - anchorLat;
                const newDist = Math.sqrt(nDx * nDx + nDy * nDy);
                const s = origDist > 1e-9 ? newDist / origDist : 1;

                return startVerts.map(v => ({
                    lng: parseFloat((anchorLng + (v.lng - anchorLng) * s).toFixed(6)),
                    lat: parseFloat((anchorLat + (v.lat - anchorLat) * s).toFixed(6)),
                }));
            }

            // Edge drag → stretch single axis
            let nMinLat = minLat, nMaxLat = maxLat, nMinLng = minLng, nMaxLng = maxLng;
            if (handleType === 'edge-t') { nMaxLat = newLat; }
            else if (handleType === 'edge-b') { nMinLat = newLat; }
            else if (handleType === 'edge-r') { nMaxLng = newLng; }
            else if (handleType === 'edge-l') { nMinLng = newLng; }

            const oW = maxLng - minLng;
            const oH = maxLat - minLat;
            const nW = nMaxLng - nMinLng;
            const nH = nMaxLat - nMinLat;
            const sX = oW > 1e-9 ? nW / oW : 1;
            const sY = oH > 1e-9 ? nH / oH : 1;

            return startVerts.map(v => ({
                lng: parseFloat((nMinLng + (v.lng - minLng) * sX).toFixed(6)),
                lat: parseFloat((nMinLat + (v.lat - minLat) * sY).toFixed(6)),
            }));
        };

        const placeHandles = (verts) => {
            // Remove old handles
            resizeHandlesRef.current.forEach(m => m.remove());
            resizeHandlesRef.current = [];

            const bbox = buildBBox(verts);
            const handles = computeHandles(bbox);

            handles.forEach(h => {
                const el = document.createElement('div');
                el.className = 'polygon-draw-resize-handle';
                if (h.type.startsWith('corner')) el.classList.add('polygon-draw-resize-handle-corner');
                else el.classList.add('polygon-draw-resize-handle-edge');
                el.style.cursor = h.cursor;

                const marker = new mapboxgl.Marker({ element: el, draggable: true, anchor: 'center' })
                    .setLngLat([h.lng, h.lat])
                    .addTo(map);

                marker._resizeType = h.type;

                marker.on('dragstart', () => {
                    setVertices(currentVerts => {
                        resizeStateRef.current = {
                            handleType: h.type,
                            startVertices: currentVerts.map(v => ({ ...v })),
                            startBBox: buildBBox(currentVerts),
                        };
                        return currentVerts;
                    });
                });

                marker.on('drag', () => {
                    if (!resizeStateRef.current) return;
                    const { handleType, startVertices, startBBox } = resizeStateRef.current;
                    const pos = marker.getLngLat();
                    const resized = applyResize(startVertices, startBBox, handleType, pos.lat, pos.lng);
                    updatePolygonOnMap(resized);
                    // For circle/dot: update center marker position
                    if (circleMetaRef.current && markersRef.current.length === 1) {
                        const rLats = resized.map(v => v.lat);
                        const rLngs = resized.map(v => v.lng);
                        const cLat = (Math.min(...rLats) + Math.max(...rLats)) / 2;
                        const cLng = (Math.min(...rLngs) + Math.max(...rLngs)) / 2;
                        markersRef.current[0].setLngLat([cLng, cLat]);
                    } else {
                        resized.forEach((v, i) => {
                            if (markersRef.current[i]) markersRef.current[i].setLngLat([v.lng, v.lat]);
                        });
                    }
                    // Update other handle positions
                    const newBBox = buildBBox(resized);
                    const newPositions = computeHandles(newBBox);
                    resizeHandlesRef.current.forEach(rm => {
                        if (rm === marker) return;
                        const np = newPositions.find(p => p.type === rm._resizeType);
                        if (np) rm.setLngLat([np.lng, np.lat]);
                    });
                });

                marker.on('dragend', () => {
                    if (!resizeStateRef.current) return;
                    const { handleType, startVertices, startBBox } = resizeStateRef.current;
                    const pos = marker.getLngLat();
                    const resized = applyResize(startVertices, startBBox, handleType, pos.lat, pos.lng);
                    resizeStateRef.current = null;
                    setVertices(resized);
                    updatePolygonOnMap(resized);
                    // For circle/dot: update center marker and metadata
                    if (circleMetaRef.current) {
                        const rLats = resized.map(v => v.lat);
                        const rLngs = resized.map(v => v.lng);
                        const cLat = (Math.min(...rLats) + Math.max(...rLats)) / 2;
                        const cLng = (Math.min(...rLngs) + Math.max(...rLngs)) / 2;
                        circleMetaRef.current = {
                            ...circleMetaRef.current,
                            center: { lat: cLat, lng: cLng },
                            radiusLat: (Math.max(...rLats) - Math.min(...rLats)) / 2,
                            radiusLng: (Math.max(...rLngs) - Math.min(...rLngs)) / 2,
                        };
                        if (markersRef.current.length === 1) {
                            markersRef.current[0].setLngLat([cLng, cLat]);
                        }
                    } else {
                        resized.forEach((v, i) => {
                            if (markersRef.current[i]) markersRef.current[i].setLngLat([v.lng, v.lat]);
                        });
                    }
                    // Reposition all handles to final bbox
                    const newBBox = buildBBox(resized);
                    const newPositions = computeHandles(newBBox);
                    resizeHandlesRef.current.forEach(rm => {
                        const np = newPositions.find(p => p.type === rm._resizeType);
                        if (np) rm.setLngLat([np.lng, np.lat]);
                    });
                });

                resizeHandlesRef.current.push(marker);
            });
        };

        setVertices(currentVerts => {
            placeHandles(currentVerts);
            return currentVerts;
        });
    }, [updatePolygonOnMap]);

    const handleToggleDragMode = useCallback(() => {
        // Exit rotate/resize mode if active
        if (isRotateMode) { stopRotateMode(); setIsRotateMode(false); }
        if (isResizeMode) { stopResizeMode(); setIsResizeMode(false); }
        setIsDragMode(prev => {
            if (!prev) {
                startDragMode();
            } else {
                stopDragMode();
            }
            return !prev;
        });
    }, [startDragMode, stopDragMode, isRotateMode, stopRotateMode, isResizeMode, stopResizeMode]);

    const handleToggleRotateMode = useCallback(() => {
        setIsRotateMode(prev => {
            if (!prev) {
                if (isDragMode) { stopDragMode(); setIsDragMode(false); }
                if (isResizeMode) { stopResizeMode(); setIsResizeMode(false); }
                startRotateMode();
            } else {
                stopRotateMode();
            }
            return !prev;
        });
    }, [startRotateMode, stopRotateMode, isDragMode, stopDragMode, isResizeMode, stopResizeMode]);

    const handleToggleResizeMode = useCallback(() => {
        setIsResizeMode(prev => {
            if (!prev) {
                if (isDragMode) { stopDragMode(); setIsDragMode(false); }
                if (isRotateMode) { stopRotateMode(); setIsRotateMode(false); }
                startResizeMode();
            } else {
                stopResizeMode();
            }
            return !prev;
        });
    }, [startResizeMode, stopResizeMode, isDragMode, stopDragMode, isRotateMode, stopRotateMode]);

    // Clean up drag/rotate/resize mode on unmount
    useEffect(() => {
        return () => {
            stopDragMode();
            stopRotateMode();
            stopResizeMode();
        };
    }, [stopDragMode, stopRotateMode, stopResizeMode]);

    // Start shape placement mode
    const startShapePlacement = useCallback((shape) => {
        // Exit drag mode if active
        if (isDragMode) { stopDragMode(); setIsDragMode(false); }
        if (isRotateMode) { stopRotateMode(); setIsRotateMode(false); }
        if (isResizeMode) { stopResizeMode(); setIsResizeMode(false); }
        const map = window.atlasMapInstance;
        if (!map) return;

        // Disable normal vertex-click while placing shape
        if (mapClickHandlerRef.current) {
            map.off('click', mapClickHandlerRef.current);
            mapClickHandlerRef.current = null;
        }

        setActiveShape(shape);
        setShowShapeMenu(false);
        map.getCanvas().style.cursor = 'crosshair';

        const onMouseDown = (e) => {
            e.preventDefault();
            const { lat, lng } = e.lngLat;
            shapePlacingRef.current = { shape, origin: { lat, lng }, active: true };
            map.getCanvas().style.cursor = 'nwse-resize';

            // Prevent map panning while dragging
            map.dragPan.disable();
        };

        const onMouseMove = (e) => {
            if (!shapePlacingRef.current?.active) return;
            const { origin } = shapePlacingRef.current;
            const dx = e.lngLat.lng - origin.lng;
            const dy = e.lngLat.lat - origin.lat;
            const preview = generateShapeVertices(shapePlacingRef.current.shape, origin, dx, dy);
            if (preview.length >= 3) {
                updatePolygonOnMap(preview);
            }
        };

        const onMouseUp = (e) => {
            if (!shapePlacingRef.current?.active) return;
            const { origin } = shapePlacingRef.current;
            const dx = e.lngLat.lng - origin.lng;
            const dy = e.lngLat.lat - origin.lat;
            const finalVerts = generateShapeVertices(shapePlacingRef.current.shape, origin, dx, dy);

            // Re-enable map panning
            map.dragPan.enable();
            shapePlacingRef.current = null;

            // Clean up listeners
            map.off('mousedown', onMouseDown);
            map.off('mousemove', onMouseMove);
            map.off('mouseup', onMouseUp);

            if (finalVerts.length >= 3) {
                // Round vertices
                const rounded = finalVerts.map(v => ({
                    lat: parseFloat(v.lat.toFixed(6)),
                    lng: parseFloat(v.lng.toFixed(6)),
                }));
                setVertices(rounded);
                updatePolygonOnMap(rounded);
                // For circle/dot: store metadata and show only a center marker
                const placedShape = shape;
                if (placedShape === 'circle' || placedShape === 'dot') {
                    // Compute circle metadata from the placed vertices
                    const lats = rounded.map(v => v.lat);
                    const lngs = rounded.map(v => v.lng);
                    const cLat = (Math.min(...lats) + Math.max(...lats)) / 2;
                    const cLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
                    circleMetaRef.current = {
                        center: { lat: cLat, lng: cLng },
                        radiusLat: (Math.max(...lats) - Math.min(...lats)) / 2,
                        radiusLng: (Math.max(...lngs) - Math.min(...lngs)) / 2,
                        segments: rounded.length,
                    };
                    // Show single center marker
                    markersRef.current.forEach(m => m.remove());
                    markersRef.current = [];
                    const el = document.createElement('div');
                    el.className = 'polygon-draw-vertex-marker';
                    const dot = document.createElement('div');
                    dot.className = 'polygon-draw-vertex-dot';
                    el.appendChild(dot);
                    const label = document.createElement('span');
                    label.className = 'polygon-draw-vertex-label';
                    label.textContent = '●';
                    label.style.display = 'none';
                    el.appendChild(label);
                    const centerMarker = new mapboxgl.Marker({ element: el, draggable: false, anchor: 'center' })
                        .setLngLat([cLng, cLat])
                        .addTo(window.atlasMapInstance);
                    markersRef.current.push(centerMarker);
                } else {
                    circleMetaRef.current = null;
                    rebuildMarkers(rounded);
                }
                setIsDrawing(false);
                updateMarkerLabels(false);
            }
            setActiveShape(null);
            map.getCanvas().style.cursor = '';
        };

        map.on('mousedown', onMouseDown);
        map.on('mousemove', onMouseMove);
        map.on('mouseup', onMouseUp);
    }, [generateShapeVertices, updatePolygonOnMap, rebuildMarkers, updateMarkerLabels, isDragMode, stopDragMode, isRotateMode, stopRotateMode, isResizeMode, stopResizeMode]);

    // Clear all drawn vertices and shapes
    const handleClearAll = useCallback(() => {
        // Exit drag/rotate mode if active
        if (isDragMode) { stopDragMode(); setIsDragMode(false); }
        if (isRotateMode) { stopRotateMode(); setIsRotateMode(false); }
        if (isResizeMode) { stopResizeMode(); setIsResizeMode(false); }
        setVertices([]);
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        circleMetaRef.current = null;
        updatePolygonOnMap([]);
        setIsDrawing(true);

        // Re-attach click handler if not already present
        const map = window.atlasMapInstance;
        if (map && !mapClickHandlerRef.current) {
            const handleMapClick = (e) => {
                const { lat, lng } = e.lngLat;
                const newVertex = { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
                setVertices(prev => {
                    const updated = [...prev, newVertex];
                    updatePolygonOnMap(updated);
                    const marker = createDraggableMarker(newVertex, updated.length - 1, updated);
                    if (marker) markersRef.current.push(marker);
                    return updated;
                });
            };
            mapClickHandlerRef.current = handleMapClick;
            map.on('click', handleMapClick);
            map.getCanvas().style.cursor = 'crosshair';
        }
    }, [updatePolygonOnMap, createDraggableMarker, isDragMode, stopDragMode, isRotateMode, stopRotateMode, isResizeMode, stopResizeMode]);

    // Hijack MapboxDraw trash button to clear polygon drawing
    useEffect(() => {
        const trashBtn = document.querySelector('.mapbox-gl-draw_trash');
        if (!trashBtn) return;

        const onTrashClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            handleClearAll();
        };

        trashBtn.addEventListener('click', onTrashClick, true);
        return () => trashBtn.removeEventListener('click', onTrashClick, true);
    }, [handleClearAll]);

    // Position modal flush with the draw control bar
    useEffect(() => {
        const modal = modalRef.current;
        const mapContainer = window.atlasMapInstance?.getContainer();
        if (!modal || !mapContainer) return;

        const drawGroup = mapContainer.querySelector('.mapboxgl-ctrl-top-right .mapboxgl-ctrl-group');
        if (!drawGroup) return;

        const mapRect = mapContainer.getBoundingClientRect();
        const barRect = drawGroup.getBoundingClientRect();

        modal.style.top = (barRect.top - mapRect.top) + 'px';
        modal.style.right = (mapRect.right - barRect.left) + 'px';
    }, []);

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
                    'fill-opacity': fillOpacity
                }
            });
        }

        // Render initial vertices if provided (edit mode)
        if (initialVertices && initialVertices.length >= 3) {
            updatePolygonOnMap(initialVertices);
            rebuildMarkers(initialVertices);
            updateMarkerLabels(false); // editing mode: hide labels initially
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

        // If editing existing polygon, start in drag/edit mode (not drawing)
        if (!(initialVertices && initialVertices.length >= 3)) {
            mapClickHandlerRef.current = handleMapClick;
            map.on('click', handleMapClick);
            map.getCanvas().style.cursor = 'crosshair';
        }

        return () => {
            // Clean up
            if (mapClickHandlerRef.current) {
                map.off('click', mapClickHandlerRef.current);
            }
            map.getCanvas().style.cursor = '';

            // Cancel any in-progress shape placement
            if (shapePlacingRef.current) {
                map.dragPan.enable();
                shapePlacingRef.current = null;
            }

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
        // Exit drag/rotate mode if active
        if (isDragMode) { stopDragMode(); setIsDragMode(false); }
        if (isRotateMode) { stopRotateMode(); setIsRotateMode(false); }
        if (isResizeMode) { stopResizeMode(); setIsResizeMode(false); }
        const map = window.atlasMapInstance;
        if (!map) return;setShowShapeMenu(false); 

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
        // Compute centroid for lat/lng fieldssetShowShapeMenu(false); 
        const centroid = vertices.reduce(
            (acc, v) => ({ lat: acc.lat + v.lat / vertices.length, lng: acc.lng + v.lng / vertices.length }),
            { lat: 0, lng: 0 }
        );
        onSave(vertices, centroid, { lineStyle, fillColor, fillOpacity });
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
                    {isResizeMode
                        ? 'Drag corner to scale, edge to stretch'
                        : isRotateMode
                            ? 'Drag to rotate the polygon'
                            : isDragMode
                                ? 'Drag to move the entire polygon'
                                : activeShape
                                    ? `Click & drag on map to place ${activeShape}`
                                    : isDrawing ? 'Click on the map to add points' : 'Drag points to adjust'}
                </span>
            </div>

            {/* Style toolbar */}
            <div className="polygon-draw-style-toolbar">
                <div className="polygon-draw-style-btn-wrap">
                    <button
                        type="button"
                        className="polygon-draw-style-btn"
                        title="Line Style"
                        onClick={() => { setShowLineMenu(v => !v); setShowColorMenu(false); setShowOpacityMenu(false); }}
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
                        onClick={() => { setShowColorMenu(v => !v); setShowLineMenu(false); setShowOpacityMenu(false); }}
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
                {/* Fill opacity */}
                <div className="polygon-draw-style-btn-wrap">
                    <button
                        type="button"
                        className="polygon-draw-style-btn"
                        title="Fill Opacity"
                        onClick={() => { setShowOpacityMenu(v => !v); setShowLineMenu(false); setShowColorMenu(false); setShowShapeMenu(false); }}
                    >
                        <span className="polygon-draw-opacity-swatch" style={{ background: fillColor, opacity: fillOpacity + 0.25 }} />
                    </button>
                    {showOpacityMenu && (
                        <div className="polygon-draw-dropdown polygon-draw-opacity-dropdown">
                            <label className="polygon-draw-opacity-label">
                                Opacity: {Math.round(fillOpacity * 100)}%
                            </label>
                            <input
                                type="range"
                                className="polygon-draw-opacity-slider"
                                min="0"
                                max="1"
                                step="0.01"
                                value={fillOpacity}
                                onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
                            />
                        </div>
                    )}
                </div>
                {/* Shape presets */}
                <div className="polygon-draw-style-btn-wrap">
                    <button
                        type="button"
                        className={`polygon-draw-style-btn${activeShape ? ' polygon-draw-shape-active' : ''}`}
                        title="Shape Presets"
                        onClick={() => { setShowShapeMenu(v => !v); setShowLineMenu(false); setShowColorMenu(false); setShowOpacityMenu(false); }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <rect x="2" y="2" width="12" height="12" rx="1" />
                        </svg>
                    </button>
                    {showShapeMenu && (
                        <div className="polygon-draw-dropdown polygon-draw-shape-dropdown">
                            <button type="button" className="polygon-draw-dropdown-item" onClick={() => startShapePlacement('triangle')}>
                                <svg width="20" height="18" viewBox="0 0 20 18" fill="none" stroke="currentColor" strokeWidth="1.4"><polygon points="10,1 1,17 19,17"/></svg>
                                <span>Triangle</span>
                            </button>
                            <button type="button" className="polygon-draw-dropdown-item" onClick={() => startShapePlacement('square')}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="1" width="16" height="16"/></svg>
                                <span>Square</span>
                            </button>
                            <button type="button" className="polygon-draw-dropdown-item" onClick={() => startShapePlacement('rectangle')}>
                                <svg width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="1" width="22" height="14"/></svg>
                                <span>Rectangle</span>
                            </button>
                            <button type="button" className="polygon-draw-dropdown-item" onClick={() => startShapePlacement('circle')}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="9" cy="9" r="8"/></svg>
                                <span>Circle</span>
                            </button>
                            <button type="button" className="polygon-draw-dropdown-item" onClick={() => startShapePlacement('dot')}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" stroke="none"><circle cx="9" cy="9" r="5"/></svg>
                                <span>Dot</span>
                            </button>
                        </div>
                    )}
                </div>
                {/* Move / drag whole polygon */}
                <div className="polygon-draw-style-btn-wrap">
                    <button
                        type="button"
                        className={`polygon-draw-style-btn${isDragMode ? ' polygon-draw-drag-active' : ''}`}
                        title="Move Polygon"
                        disabled={vertices.length < 3}
                        onClick={handleToggleDragMode}
                    >
                        <FontAwesomeIcon icon={faHand} style={{ fontSize: 16, width: 16, height: 16 }} />
                    </button>
                </div>
                {/* Rotate polygon */}
                <div className="polygon-draw-style-btn-wrap">
                    <button
                        type="button"
                        className={`polygon-draw-style-btn${isRotateMode ? ' polygon-draw-rotate-active' : ''}`}
                        title="Rotate Polygon"
                        disabled={vertices.length < 3}
                        onClick={handleToggleRotateMode}
                    >
                        <FontAwesomeIcon icon={faRotate} style={{ fontSize: 16, width: 16, height: 16 }} />
                    </button>
                </div>
                {/* Resize polygon */}
                <div className="polygon-draw-style-btn-wrap">
                    <button
                        type="button"
                        className={`polygon-draw-style-btn${isResizeMode ? ' polygon-draw-resize-active' : ''}`}
                        title="Resize Polygon"
                        disabled={vertices.length < 3}
                        onClick={handleToggleResizeMode}
                    >
                        <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} style={{ fontSize: 14, width: 16, height: 16 }} />
                    </button>
                </div>
            </div>

            <div className="polygon-draw-modal-vertices">
                {vertices.length === 0 && (
                    <div className="polygon-draw-modal-empty">No points yet</div>
                )}
                {circleMetaRef.current ? (
                    <div className="polygon-draw-modal-vertex-row">
                        <span className="polygon-draw-modal-vertex-num">●</span>
                        <div className="polygon-draw-modal-vertex-coords polygon-draw-modal-vertex-inputs">
                            <input
                                type="number"
                                step="any"
                                className="polygon-draw-vertex-input"
                                value={circleMetaRef.current.center.lat}
                                onChange={(e) => {
                                    const newLat = parseFloat(e.target.value);
                                    if (isNaN(newLat)) return;
                                    const meta = circleMetaRef.current;
                                    const dLat = newLat - meta.center.lat;
                                    setVertices(prev => {
                                        const updated = prev.map(v => ({ ...v, lat: parseFloat((v.lat + dLat).toFixed(6)) }));
                                        updatePolygonOnMap(updated);
                                        return updated;
                                    });
                                    circleMetaRef.current = { ...meta, center: { ...meta.center, lat: newLat } };
                                    if (markersRef.current[0]) markersRef.current[0].setLngLat([meta.center.lng, newLat]);
                                }}
                                title="Latitude"
                            />
                            <span className="polygon-draw-vertex-comma">,</span>
                            <input
                                type="number"
                                step="any"
                                className="polygon-draw-vertex-input"
                                value={circleMetaRef.current.center.lng}
                                onChange={(e) => {
                                    const newLng = parseFloat(e.target.value);
                                    if (isNaN(newLng)) return;
                                    const meta = circleMetaRef.current;
                                    const dLng = newLng - meta.center.lng;
                                    setVertices(prev => {
                                        const updated = prev.map(v => ({ ...v, lng: parseFloat((v.lng + dLng).toFixed(6)) }));
                                        updatePolygonOnMap(updated);
                                        return updated;
                                    });
                                    circleMetaRef.current = { ...meta, center: { ...meta.center, lng: newLng } };
                                    if (markersRef.current[0]) markersRef.current[0].setLngLat([newLng, meta.center.lat]);
                                }}
                                title="Longitude"
                            />
                        </div>
                    </div>
                ) : (
                    vertices.map((v, i) => (
                        <div key={i} className="polygon-draw-modal-vertex-row">
                            <span className="polygon-draw-modal-vertex-num">{i + 1}</span>
                            <div className="polygon-draw-modal-vertex-coords polygon-draw-modal-vertex-inputs">
                                <input
                                    type="number"
                                    step="any"
                                    className="polygon-draw-vertex-input"
                                    value={v.lat}
                                    onChange={(e) => {
                                        const newLat = parseFloat(e.target.value);
                                        if (isNaN(newLat)) return;
                                        setVertices(prev => {
                                            const updated = [...prev];
                                            updated[i] = { ...updated[i], lat: parseFloat(newLat.toFixed(6)) };
                                            updatePolygonOnMap(updated);
                                            if (markersRef.current[i]) markersRef.current[i].setLngLat([updated[i].lng, updated[i].lat]);
                                            return updated;
                                        });
                                    }}
                                    title="Latitude"
                                />
                                <span className="polygon-draw-vertex-comma">,</span>
                                <input
                                    type="number"
                                    step="any"
                                    className="polygon-draw-vertex-input"
                                    value={v.lng}
                                    onChange={(e) => {
                                        const newLng = parseFloat(e.target.value);
                                        if (isNaN(newLng)) return;
                                        setVertices(prev => {
                                            const updated = [...prev];
                                            updated[i] = { ...updated[i], lng: parseFloat(newLng.toFixed(6)) };
                                            updatePolygonOnMap(updated);
                                            if (markersRef.current[i]) markersRef.current[i].setLngLat([updated[i].lng, updated[i].lat]);
                                            return updated;
                                        });
                                    }}
                                    title="Longitude"
                                />
                            </div>
                            <button
                                type="button"
                                className="polygon-draw-modal-vertex-remove"
                                onClick={() => handleRemoveVertex(i)}
                                title="Remove"
                            >
                                &times;
                            </button>
                        </div>
                    ))
                )}
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
