import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const { setSearchCondition, onMarkerCardSelect } = props;
  const [lng, setLng] = useState(-120);
  const [lat, setLat] = useState(46);
  const [zoom, setZoom] = useState(5.5);
  const [mouseCoordinates, setMouseCoordinates] = useState({ lat: 0, lng: 0 });
  const [bounds, setBounds] = useState({});
  const descriptionPreviewLength = 320;

  const closeMarkerPopup = useCallback(() => {
    if (markerPopupRef.current) {
      markerPopupRef.current.remove();
      markerPopupRef.current = null;
    }
    marker_clicked = false;
    setSearchCondition("");
    onMarkerCardSelect?.(null);
  }, [setSearchCondition, onMarkerCardSelect]);

  const parseMarkerFiles = useCallback((filesValue) => {
    if (Array.isArray(filesValue)) {
      return filesValue;
    }
    if (typeof filesValue === 'string') {
      try {
        const parsed = JSON.parse(filesValue);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, []);

  const buildMarkerPopupContent = useCallback((feature) => {
    const root = document.createElement('div');
    root.className = 'card-pin-popup-panel';

    const header = document.createElement('div');
    header.className = 'card-pin-popup-header';

    const thumbnail = document.createElement('img');
    thumbnail.className = 'card-pin-popup-thumbnail';
    thumbnail.alt = 'Card Thumbnail';
    thumbnail.src = feature.thumbnail_link && String(feature.thumbnail_link).trim() !== ''
      ? feature.thumbnail_link
      : '/CEREO-logo.png';

    const titleBlock = document.createElement('div');
    titleBlock.className = 'card-pin-popup-title-block';

    const title = document.createElement('h3');
    title.textContent = feature.title || 'Untitled Card';

    const subtitle = document.createElement('p');
    subtitle.className = 'card-pin-popup-subtitle';
    subtitle.textContent = feature.category || 'Uncategorized';

    titleBlock.appendChild(title);
    titleBlock.appendChild(subtitle);

    header.appendChild(thumbnail);
    header.appendChild(titleBlock);

    const body = document.createElement('div');
    body.className = 'card-pin-popup-body';

    const appendInfoLine = (label, value) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = `${label}: `;
      p.appendChild(strong);
      p.appendChild(document.createTextNode(value || 'N/A'));
      body.appendChild(p);
    };

    appendInfoLine('Author', feature.name);
    appendInfoLine('Card Creator', feature.username);
    appendInfoLine('Email', feature.email);
    appendInfoLine('Funding', feature.funding);
    appendInfoLine('Organization', feature.org);

    const linkWrap = document.createElement('p');
    const linkLabel = document.createElement('strong');
    linkLabel.textContent = 'Link: ';
    linkWrap.appendChild(linkLabel);
    if (feature.link) {
      const link = document.createElement('a');
      link.href = feature.link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = feature.link;
      linkWrap.appendChild(link);
    } else {
      linkWrap.appendChild(document.createTextNode('N/A'));
    }
    body.appendChild(linkWrap);

    const descriptionWrap = document.createElement('div');
    descriptionWrap.className = 'card-pin-popup-description-wrap';

    const description = String(feature.description || '');
    const hasLongDescription = description.length > descriptionPreviewLength;
    let expanded = false;
    let toggleButton = null;

    const descriptionText = document.createElement('p');
    descriptionText.className = 'card-pin-popup-description';

    const descriptionLabel = document.createElement('strong');
    descriptionLabel.textContent = 'Description: ';
    descriptionText.appendChild(descriptionLabel);

    const descriptionValueNode = document.createTextNode('');
    descriptionText.appendChild(descriptionValueNode);

    const updateDescription = () => {
      if (!description) {
        descriptionValueNode.textContent = 'No description provided.';
      } else if (!hasLongDescription || expanded) {
        descriptionValueNode.textContent = description;
      } else {
        descriptionValueNode.textContent = `${description.slice(0, descriptionPreviewLength)}...`;
      }

      if (toggleButton) {
        toggleButton.textContent = expanded ? 'Show less' : 'Show more';
      }
    };

    if (hasLongDescription) {
      descriptionText.appendChild(document.createTextNode(' '));
      toggleButton = document.createElement('button');
      toggleButton.type = 'button';
      toggleButton.className = 'card-pin-popup-description-toggle-inline';
      toggleButton.addEventListener('click', () => {
        expanded = !expanded;
        updateDescription();
      });
      descriptionText.appendChild(toggleButton);
    }

    updateDescription();
    descriptionWrap.appendChild(descriptionText);

    body.appendChild(descriptionWrap);

    appendInfoLine('Tags', feature.tags);
    appendInfoLine('Latitude', feature.latitude != null ? String(feature.latitude) : 'N/A');
    appendInfoLine('Longitude', feature.longitude != null ? String(feature.longitude) : 'N/A');

    const markerFiles = parseMarkerFiles(feature.files);
    if (markerFiles.length > 0) {
      const fileList = document.createElement('div');
      fileList.className = 'card-pin-popup-file-list';

      const heading = document.createElement('h4');
      heading.textContent = 'Downloadable Files';
      fileList.appendChild(heading);

      const ul = document.createElement('ul');
      markerFiles.forEach((file, index) => {
        const li = document.createElement('li');
        if (file.file_link) {
          const anchor = document.createElement('a');
          anchor.href = file.file_link;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          anchor.textContent = file.filename || `Download ${file.fileextension || 'file'}`;
          li.appendChild(anchor);
        } else {
          li.textContent = file.filename || `File ${index + 1}`;
        }
        ul.appendChild(li);
      });
      fileList.appendChild(ul);
      body.appendChild(fileList);
    }

    root.appendChild(header);
    root.appendChild(body);
    return root;
  }, [parseMarkerFiles]);

  const openMarkerPopup = useCallback((feature, markerInstance, mapInstance) => {
    closeMarkerPopup();

    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      anchor: 'bottom-left',
      offset: [12, -8],
      className: 'card-pin-rich-popup'
    })
      .setLngLat(markerInstance.getLngLat())
      .setDOMContent(buildMarkerPopupContent(feature))
      .addTo(mapInstance);

    popup.on('close', () => {
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
    props.isModalOpen
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

        marker.getElement().addEventListener('click', () => {
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
      closeMarkerPopup();

      // Clean up map instance on unmount.
      // Keep this lifecycle tied to mount/unmount rather than auth state to avoid
      // auth-transition races that can leave markers missing until a hard refresh.
      map.remove();
    };
  }, []);

  // Compute styles for outer map container to respond to card panel state
  const mapContainerWidth = (props.isUploadPanelOpen || props.isRemovedPanelOpen || props.isModalOpen)
    ? 420
    : (props.isLayerPanelOpen ? 350 : 0);
  const mapContainerRight = props.isCollapsed ? 0 : (Number(props.cardPanelWidth) || 300);

  return (
    <div 
      className="AtlasMap" 
      ref={atlasMapRef}
      style={{
        left: `${mapContainerWidth}px`,
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

      <div className="AtlasMap__credit">
        <a>Map icons by </a>
        <a href="https://icons8.com/icon/" title="marker icons">icons8.</a>
      </div>
    </div>
  );
};

export { allMarkers, draw, blueMarkers, greenMarkers, yellowMarkers, curLocationCoordinates, searchLocationCoordinates };
export default Content1;