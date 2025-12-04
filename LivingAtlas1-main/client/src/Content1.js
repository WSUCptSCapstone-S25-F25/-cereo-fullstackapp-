import React, { useRef, useEffect, useState } from 'react';
import mapboxgl, { Popup } from 'mapbox-gl';
import './Content1.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import updateMarkers from './PolygonFiltering.js';
import axios from 'axios';
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
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [lng, setLng] = useState(-120);
  const [lat, setLat] = useState(46);
  const [zoom, setZoom] = useState(5.5);
  const [mouseCoordinates, setMouseCoordinates] = useState({ lat: 0, lng: 0 });
  const [bounds, setBounds] = useState({});

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

  // Handle resizing map when sidebars open or close
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (props.isCollapsed && !(props.isUploadPanelOpen || props.isRemovedPanelOpen || props.isModalOpen || props.isLayerPanelOpen)) {
      mapContainerRef.current.style.width = '100%';
      mapContainerRef.current.style.left = '0';
    } else if (props.isCollapsed && (props.isUploadPanelOpen || props.isRemovedPanelOpen || props.isModalOpen)) {
      mapContainerRef.current.style.width = '71.1%';
      mapContainerRef.current.style.left = '420px';
    } else if (!props.isCollapsed && !(props.isUploadPanelOpen || props.isRemovedPanelOpen || props.isModalOpen || props.isLayerPanelOpen)) {
      mapContainerRef.current.style.width = '79.4%';
      mapContainerRef.current.style.left = '0';
    } else if (!props.isCollapsed && (props.isUploadPanelOpen || props.isRemovedPanelOpen || props.isModalOpen)) {
      mapContainerRef.current.style.width = '50.5%';
      mapContainerRef.current.style.left = '420px';
    } else if (props.isCollapsed && props.isLayerPanelOpen) {
      mapContainerRef.current.style.width = '75.9%';
      mapContainerRef.current.style.left = '350px';
    } else if (!props.isCollapsed && props.isLayerPanelOpen) {
      mapContainerRef.current.style.width = '55.3%';
      mapContainerRef.current.style.left = '350px';
    }
  }, [
    props.isCollapsed,
    props.isUploadPanelOpen,
    props.isRemovedPanelOpen,
    props.isLayerPanelOpen,
    props.isModalOpen
  ]);

  // Resize map when container changes
  useEffect(() => {
    if (mapRef.current) mapRef.current.resize();
  }, [props.isCollapsed]);

  // MAIN MAP INITIALIZATION
  useEffect(() => {
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

    // Clear any existing markers from previous instances
    allMarkers.forEach(m => m.remove());
    allMarkers = [];
    blueMarkers = [];
    greenMarkers = [];
    yellowMarkers = [];

    // FETCH MARKERS
    async function fetchData() {
      try {
        const response = await api.get('/getMarkers');
        const data = response.data;

        // if backend returns { data: [...] }
        const markersData = Array.isArray(data) ? data : data.data || [];

        for (let feature of markersData) {
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

          marker.setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                  <br><h3>${feature.title}</h3>
                  <p><b>Category:</b> ${feature.category}</p>
                  <p><b>Tags:</b> ${feature.tags}</p><br>
              `)
          );

          marker.getElement().addEventListener('click', () => {
            marker_clicked = true;
            props.setSearchCondition(feature.title);
          });

          marker.getPopup().on('close', () => {
            marker_clicked = false;
            props.setSearchCondition("");
          });

          marker.addTo(map);
          allMarkers.push(marker);
        }
      } catch (error) {
        console.error('Error fetching markers:', error);
      }
    }

    fetchData();

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
      // clean up map instance on unmount / login change
      map.remove();
    };
  }, [props.isLoggedIn]); // re-init map when login state changes

  return (
    <div className="AtlasMap">
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