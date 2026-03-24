import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import './Content1.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import updateMarkers from './PolygonFiltering.js';
import { showAll } from './Filter';
import api from './api.js';

// Mapbox Token
mapboxgl.accessToken =
  'pk.eyJ1IjoibGl2aW5nYXRsYXMiLCJhIjoiY2xwcDU4OHJyMHZwYTJpcGdvdDN3NWNneiJ9.86JTUg6ZUVm1PdqQ177WYQ';

const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    polygon: true,
    trash: true
  }
});

let marker_clicked = false;
let stream_clicked = false;
let allMarkers = [];
let blueMarkers = [];
let greenMarkers = [];
let yellowMarkers = [];
let curLocationCoordinates = { lat: 0, lng: 0 };
let searchLocationCoordinates = { lat: 0, lng: 0 };

// helper to convert mapbox bounds → your Home.js bounding format
const convertBounds = (b) => ({
  NE: { Lat: b._ne.lat, Lng: b._ne.lng },
  SW: { Lat: b._sw.lat, Lng: b._sw.lng }
});

const Content1 = (props) => {
  const atlasMapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerPopupRef = useRef(null);
  const [creditPortalHost, setCreditPortalHost] = useState(null);
  const { setSearchCondition, onMarkerCardSelect } = props;
  const [lng, setLng] = useState(-120);
  const [lat, setLat] = useState(46);
  const [zoom, setZoom] = useState(5.5);
  const [mouseCoordinates, setMouseCoordinates] = useState({ lat: 0, lng: 0 });
  const [bounds, setBounds] = useState({});

  const closeMarkerPopup = useCallback(() => {
    if (markerPopupRef.current) {
      markerPopupRef.current.remove();
      markerPopupRef.current = null;
    }
    marker_clicked = false;
    setSearchCondition("");
    onMarkerCardSelect?.(null);
  }, [setSearchCondition, onMarkerCardSelect]);

  const buildMarkerPopupContent = useCallback((feature) => {
    const root = document.createElement('div');
    root.className = 'card-pin-popup-panel';

    let imageOverlay = null;
    let removeOverlayKeyHandler = null;

    const cleanupImageOverlay = () => {
      if (removeOverlayKeyHandler) {
        document.removeEventListener('keydown', removeOverlayKeyHandler);
        removeOverlayKeyHandler = null;
      }

      if (imageOverlay) {
        imageOverlay.remove();
        imageOverlay = null;
      }
    };

    const thumbnail = document.createElement('img');
    thumbnail.className = 'card-pin-popup-thumbnail';
    thumbnail.alt = 'Card Thumbnail';
    thumbnail.src = feature.thumbnail_link && String(feature.thumbnail_link).trim() !== ''
      ? feature.thumbnail_link
      : '/CEREO-logo.png';

    const thumbnailButton = document.createElement('button');
    thumbnailButton.type = 'button';
    thumbnailButton.className = 'card-pin-popup-thumbnail-button';
    thumbnailButton.setAttribute('aria-label', 'Open larger image preview');
    thumbnailButton.appendChild(thumbnail);

    const openLargeImagePreview = () => {
      cleanupImageOverlay();

      imageOverlay = document.createElement('div');
      imageOverlay.className = 'card-pin-popup-image-overlay';

      const imageDialog = document.createElement('div');
      imageDialog.className = 'card-pin-popup-image-dialog';

      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'card-pin-popup-image-close';
      closeButton.setAttribute('aria-label', 'Close image preview');
      closeButton.textContent = '×';

      const largeImage = document.createElement('img');
      largeImage.className = 'card-pin-popup-image-large';
      largeImage.src = thumbnail.src;
      largeImage.alt = thumbnail.alt;

      closeButton.addEventListener('click', cleanupImageOverlay);
      imageOverlay.addEventListener('click', (event) => {
        if (event.target === imageOverlay) {
          cleanupImageOverlay();
        }
      });
      imageDialog.addEventListener('click', (event) => {
        event.stopPropagation();
      });

      removeOverlayKeyHandler = (event) => {
        if (event.key === 'Escape') {
          cleanupImageOverlay();
        }
      };
      document.addEventListener('keydown', removeOverlayKeyHandler);

      imageDialog.appendChild(closeButton);
      imageDialog.appendChild(largeImage);
      imageOverlay.appendChild(imageDialog);
      document.body.appendChild(imageOverlay);
    };

    thumbnailButton.addEventListener('click', openLargeImagePreview);

    const infoPanel = document.createElement('div');
    infoPanel.className = 'card-pin-popup-info-panel';
    infoPanel.setAttribute('role', 'button');
    infoPanel.setAttribute('tabindex', '0');
    infoPanel.setAttribute('aria-label', 'Open full card details');

    const title = document.createElement('h3');
    title.className = 'card-pin-popup-title';
    title.textContent = feature.title || 'Untitled Card';

    const category = document.createElement('p');
    category.className = 'card-pin-popup-category';
    category.textContent = feature.category || 'Uncategorized';

    const tags = document.createElement('p');
    tags.className = 'card-pin-popup-tags';
    tags.textContent = `Tags: ${feature.tags ? String(feature.tags) : 'N/A'}`;

    const openLearnMore = () => {
      window.dispatchEvent(new CustomEvent('atlas:open-card-learn-more', {
        detail: { cardID: feature.cardID }
      }));
    };

    infoPanel.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openLearnMore();
    });

    infoPanel.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLearnMore();
      }
    });

    infoPanel.appendChild(title);
    infoPanel.appendChild(category);
    infoPanel.appendChild(tags);

    root.appendChild(thumbnailButton);
    root.appendChild(infoPanel);
    root.cleanupImageOverlay = cleanupImageOverlay;
    return root;
  }, []);

  const openMarkerPopup = useCallback((feature, markerInstance, mapInstance) => {
    closeMarkerPopup();

    const popupContent = buildMarkerPopupContent(feature);

    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      anchor: 'bottom-left',
      offset: [12, -8],
      className: 'card-pin-rich-popup'
    })
      .setLngLat(markerInstance.getLngLat())
      .setDOMContent(popupContent)
      .addTo(mapInstance);

    popup.on('close', () => {
      popupContent.cleanupImageOverlay?.();
      if (markerPopupRef.current === popup) {
        markerPopupRef.current = null;
      }
      marker_clicked = false;
      setSearchCondition("");
      onMarkerCardSelect?.(null);
    });

    markerPopupRef.current = popup;
    onMarkerCardSelect?.(feature.cardID);
  }, [buildMarkerPopupContent, closeMarkerPopup, setSearchCondition, onMarkerCardSelect]);

  // Move map when user clicks a card
  useEffect(() => {
    if (
      mapRef.current &&
      props.selectedCardCoords &&
      typeof props.selectedCardCoords.latitude === 'number' &&
      typeof props.selectedCardCoords.longitude === 'number'
    ) {
      mapRef.current.flyTo({
        center: [props.selectedCardCoords.longitude, props.selectedCardCoords.latitude],
        zoom: 13
      });
    }
  }, [props.selectedCardCoords]);



  // Resize map when container changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Trigger resize immediately and once more after layout/transition settles.
    mapRef.current.resize();

    const rafId = window.requestAnimationFrame(() => {
      if (mapRef.current) mapRef.current.resize();
    });

    const timeoutId = window.setTimeout(() => {
      if (mapRef.current) mapRef.current.resize();
    }, 220);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [
    props.isCollapsed,
    props.cardPanelWidth,
    props.isUploadPanelOpen,
    props.isRemovedPanelOpen,
    props.isLayerPanelOpen,
    props.isModalOpen,
    props.isSidebarOpen
  ]);

  // Keep map size in sync when the card panel finishes its open/close transition.
  useEffect(() => {
    const cardPanel = document.getElementById('content-2');
    if (!cardPanel) return;

    const handleTransitionEnd = (event) => {
      if (event.propertyName !== 'transform') return;
      if (mapRef.current) mapRef.current.resize();
    };

    cardPanel.addEventListener('transitionend', handleTransitionEnd);
    return () => {
      cardPanel.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, []);

  // MAIN MAP INITIALIZATION
  useEffect(() => {
    let isActive = true;
    let markersFetchInFlight = false;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });

    window.atlasMapInstance = map;
    mapRef.current = map;

    // INITIAL bounds sync
    let b = map.getBounds();
    setBounds(b);
    props.setboundCondition(convertBounds(b));

    // Update center + zoom UI
    map.on('move', () => {
      setLng(map.getCenter().lng.toFixed(4));
      setLat(map.getCenter().lat.toFixed(4));
      setZoom(map.getZoom().toFixed(2));
    });

    // Mapbox geocoder setup
    const coordinatesGeocoder = function (query) {
      const matches = query.match(/^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i);
      if (!matches) return null;

      const coord1 = Number(matches[1]);
      const coord2 = Number(matches[2]);

      function feature(lng, lat) {
        return {
          center: [lng, lat],
          geometry: { type: 'Point', coordinates: [lng, lat] },
          place_name: `Lat: ${lat} Lng: ${lng}`,
          place_type: ['coordinate'],
          properties: {},
          type: 'Feature'
        };
      }

      const geocodes = [];

      if (coord1 < -90 || coord1 > 90) geocodes.push(feature(coord1, coord2));
      if (coord2 < -90 || coord2 > 90) geocodes.push(feature(coord2, coord1));
      if (geocodes.length === 0) {
        geocodes.push(feature(coord1, coord2), feature(coord2, coord1));
      }
      return geocodes;
    };

    const searchBar = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      localGeocoder: coordinatesGeocoder,
      placeholder: 'Address or LAT, LONG',
      mapboxgl: mapboxgl,
      reverseGeocode: true,
      marker: { color: 'green' }
    });

    map.addControl(searchBar);

    searchBar.on('result', (e) => {
      const [lng, lat] = e.result.center;
      searchLocationCoordinates = { lat, lng };

      // update bounds after geocoder selects a result
      const b = map.getBounds();
      props.setboundCondition(convertBounds(b));
    });

    map.addControl(draw);

    map.on('draw.create', updateMarkers);
    map.on('draw.delete', showAll);
    map.on('draw.update', updateMarkers);

    map.addControl(new mapboxgl.FullscreenControl(), 'top-left');
    map.addControl(new mapboxgl.NavigationControl(), 'top-left');

    const currentLocation = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    });

    map.addControl(currentLocation, 'top-left');

    const syncBottomRightMeta = () => {
      if (!atlasMapRef.current) return;

      const bottomRightControls = atlasMapRef.current.querySelector('.mapboxgl-ctrl-bottom-right');
      if (!bottomRightControls) return;
      const attributionCtrl = bottomRightControls.querySelector('.mapboxgl-ctrl-attrib');

      let metaHost = atlasMapRef.current.querySelector('.AtlasMap__bottom-right-meta');
      if (!metaHost) {
        metaHost = document.createElement('div');
        metaHost.className = 'AtlasMap__bottom-right-meta mapboxgl-ctrl';
      }

      if (attributionCtrl) {
        bottomRightControls.insertBefore(metaHost, attributionCtrl);
      } else if (metaHost.parentElement !== bottomRightControls) {
        bottomRightControls.appendChild(metaHost);
      }

      const mapboxLogo = atlasMapRef.current.querySelector('.mapboxgl-ctrl-bottom-left .mapboxgl-ctrl-logo');
      if (mapboxLogo && mapboxLogo.parentElement !== metaHost) {
        metaHost.insertBefore(mapboxLogo, metaHost.firstChild);
      }

      setCreditPortalHost(metaHost);
    };

    syncBottomRightMeta();
    const creditSyncRafId = window.requestAnimationFrame(syncBottomRightMeta);
    map.on('load', syncBottomRightMeta);

    currentLocation.on('geolocate', (e) => {
      curLocationCoordinates = { lat: e.coords.latitude, lng: e.coords.longitude };
    });

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const clearMarkers = () => {
      allMarkers.forEach(m => m.remove());
      allMarkers = [];
      blueMarkers = [];
      greenMarkers = [];
      yellowMarkers = [];
    };

    const renderMarkers = (markersData) => {
      clearMarkers();

      for (let feature of markersData) {
        if (!isActive) return;

        const el = document.createElement('div');

        if (feature.category === "River") {
          el.className = 'blue-marker';
          blueMarkers.push([feature.category, feature.tags, [feature.longitude, feature.latitude]]);
        } else if (feature.category === "Watershed") {
          el.className = 'green-marker';
          greenMarkers.push([feature.category, feature.tags, [feature.longitude, feature.latitude]]);
        } else {
          el.className = 'yellow-marker';
          yellowMarkers.push([feature.category, feature.tags, [feature.longitude, feature.latitude]]);
        }

        const marker = new mapboxgl.Marker(el);

        if (!isNaN(feature.longitude) && !isNaN(feature.latitude)) {
          marker.setLngLat([feature.longitude, feature.latitude]);
        } else {
          continue;
        }

        marker.getElement().addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          marker_clicked = true;
          setSearchCondition(feature.title);
          openMarkerPopup(feature, marker, map);
        });

        marker.addTo(map);
        allMarkers.push(marker);
      }

      showAll();
    };

    const fetchMarkersWithRetry = async (reason = 'initial-load') => {
      if (markersFetchInFlight) return;
      markersFetchInFlight = true;

      const maxAttempts = 4;
      const baseDelayMs = 1200;
      const timeoutMs = 90000;

      try {
        for (let attempt = 1; attempt <= maxAttempts && isActive; attempt++) {
          try {
            const response = await api.get('/getMarkers', { timeout: timeoutMs });
            if (!isActive) return;

            const data = response.data;
            const markersData = Array.isArray(data) ? data : data.data || [];
            renderMarkers(markersData);

            if (attempt > 1) {
              console.log(`[Content1] Marker fetch recovered after retry ${attempt}/${maxAttempts} (${reason}).`);
            }
            return;
          } catch (error) {
            const status = error?.response?.status || 'NO_RESPONSE';
            console.warn(`[Content1] /getMarkers failed on attempt ${attempt}/${maxAttempts} (${reason}), status=${status}`);

            if (attempt < maxAttempts) {
              const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
              await wait(delayMs);
            } else {
              console.error('Error fetching markers after retries:', error);
            }
          }
        }
      } finally {
        markersFetchInFlight = false;
      }
    };

    const handleCardsLoaded = () => {
      if (!isActive) return;
      if (allMarkers.length > 0) return;
      fetchMarkersWithRetry('cards-loaded-event');
    };

    clearMarkers();
    window.addEventListener('atlas:cards-loaded', handleCardsLoaded);

    // Wait for map style/container readiness before mounting marker DOM nodes.
    if (map.loaded()) {
      fetchMarkersWithRetry('map-ready');
    } else {
      map.once('load', () => {
        fetchMarkersWithRetry('map-load');
      });
    }

    // BOUNDS SYNC — zoomend
    map.on('zoomend', () => {
      let b = map.getBounds();
      setBounds(b);
      props.setboundCondition(convertBounds(b));
    });

    // BOUNDS SYNC — dragend
    map.on('dragend', () => {
      let b = map.getBounds();
      setBounds(b);
      props.setboundCondition(convertBounds(b));
    });

    // BOUNDS SYNC — moveend (critical for viewport filtering)
    map.on('moveend', () => {
      let b = map.getBounds();
      props.setboundCondition(convertBounds(b));
    });

    // Track mouse coordinate display
    map.on('mousemove', (e) => {
      setMouseCoordinates({
        lat: e.lngLat.lat.toFixed(4),
        lng: e.lngLat.lng.toFixed(4)
      });
    });

    // Tileset layering (unchanged)
    map.on('load', function () {
      map.addLayer({
        id: 'vector-tileset',
        type: 'fill',
        source: {
          type: 'vector',
          url: 'mapbox://livingatlas.71vcn3c7',
        },
        'source-layer': 'NHD_streams-6qjkxa',
        paint: {
          'fill-color': 'blue',
          'fill-opacity': 0.5,
        },
      });

      map.addLayer({
        id: 'urban-areas-fill',
        type: 'fill',
        source: {
          type: 'vector',
          url: 'mapbox://livingatlas.78fvgfpd',
        },
        'source-layer': 'Washington_State_City_Urban_G-0e7hes',
        paint: {
          'fill-color': 'red',
          'fill-opacity': 0.4,
        },
      });

      map.addLayer({
        id: 'urban-areas-outline',
        type: 'line',
        source: {
          type: 'vector',
          url: 'mapbox://phearakboth.6pnz5bgy',
        },
        'source-layer': 'Washington_State_City_Urban_G-48j9h8',
        paint: {
          'line-color': 'white',
          'line-width': 1,
        },
      });
    });

    return () => {
      isActive = false;
      window.removeEventListener('atlas:cards-loaded', handleCardsLoaded);
      window.cancelAnimationFrame(creditSyncRafId);
      map.off('load', syncBottomRightMeta);
      closeMarkerPopup();

      // Clean up map instance on unmount.
      // Keep this lifecycle tied to mount/unmount rather than auth state to avoid
      // auth-transition races that can leave markers missing until a hard refresh.
      map.remove();
    };
  }, []);

  // Compute styles for outer map container to respond to card panel state
  const leftSidebarWidth = props.isSidebarOpen ? 300 : 60;
  const leftPanelWidth = (props.isUploadPanelOpen || props.isRemovedPanelOpen || props.isModalOpen)
    ? 420
    : (props.isLayerPanelOpen ? 350 : 0);
  const mapContainerLeft = leftSidebarWidth + leftPanelWidth;
  const mapContainerRight = props.isCollapsed ? 0 : (Number(props.cardPanelWidth) || 300);

  return (
    <div 
      className="AtlasMap" 
      ref={atlasMapRef}
      style={{
        left: `${mapContainerLeft}px`,
        right: `${mapContainerRight}px`
      }}
    >
      <div className="AtlasMap__container" ref={mapContainerRef}>
        <div className="AtlasMap__info-bottomleft">
          <div>
            Map Center - Lat: {lat} | Long: {lng} | Zoom: {zoom}
          </div>
          <div>
            Mouse Coordinates - Lat: {mouseCoordinates.lat} | Long: {mouseCoordinates.lng}
          </div>
        </div>
      </div>

      {creditPortalHost && createPortal(
        <div className="AtlasMap__credit">
          <span>Map icons by </span>
          <a href="https://icons8.com/icon/" title="marker icons" target="_blank" rel="noopener noreferrer">icons8.</a>
        </div>,
        creditPortalHost
      )}
    </div>
  );
};

export { allMarkers, draw, blueMarkers, greenMarkers, yellowMarkers, curLocationCoordinates, searchLocationCoordinates };
export default Content1;