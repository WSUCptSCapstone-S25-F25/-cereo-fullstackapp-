import React, { useRef, useEffect, useState } from 'react';
import mapboxgl, { Popup } from 'mapbox-gl'; // import mapbox api
import './Content1.css'; // css styling for map container
import MapboxDraw from '@mapbox/mapbox-gl-draw' // imports polygon drawing
import "mapbox-gl/dist/mapbox-gl.css"; // imports mapbox button icons for fullscreen,zoom,gps
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"; // import mapbox button icons for draw polygon
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'; // search bar for map at top right
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'; // styling for search bar
import updateMarkers from './PolygonFiltering.js';
import axios from 'axios';
import { loadMarkers, loadUrbanAreas, loadRivers } from './Shapes';
import { showAll } from './Filter';
import api from './api.js';

//access key (livingatlas)
mapboxgl.accessToken =
  'pk.eyJ1IjoibGl2aW5nYXRsYXMiLCJhIjoiY2xwcDU4OHJyMHZwYTJpcGdvdDN3NWNneiJ9.86JTUg6ZUVm1PdqQ177WYQ'

// Polygon drawing functionality
const draw = new MapboxDraw({
  displayControlsDefault: false,
  // Select which mapbox-gl-draw control buttons to add to the map.
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

const Content1 = (props) => {
  
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [lng, setLng] = useState(-117.181738);
  const [lat, setLat] = useState(46.729777);
  const [zoom, setZoom] = useState(9);
  const [mouseCoordinates, setMouseCoordinates] = useState({ lat: 0, lng: 0 });

  // Added this for the map bounds
  //NE: Lng: -116.5981, Lat: 47.0114
  //SW: Lng: -117.7654, Lat: 46.4466
  const [bounds, setBounds] = useState({});

  // Initialize map when component mounts
  const fetchData = async () => {
    try {
        console.log("📌 showFavoritesOnly:", props.showFavoritesOnly);
        console.log("📌 bookmarkedCardIDs:", props.bookmarkedCardIDs);

        if (props.showFavoritesOnly && bookmarkedSet.size === 0) {
          console.warn("⚠️ showFavoritesOnly is ON but no bookmarks available.");
        }

        const bookmarkedSet = props.bookmarkedCardIDs instanceof Set
            ? props.bookmarkedCardIDs
            : new Set();
      

        const response = await api.get('/getMarkers');
        const data = response.data.data;

        allMarkers.forEach(marker => marker.remove());
        allMarkers = [];
        greenMarkers = [];
        blueMarkers = [];
        yellowMarkers = [];

        for (let feature of data) {
            if (props.showFavoritesOnly && !bookmarkedSet.has(feature.cardID)) continue;

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

            if (
                typeof feature.longitude !== 'number' ||
                typeof feature.latitude !== 'number' ||
                isNaN(feature.longitude) ||
                isNaN(feature.latitude)
            ) {
                console.warn("⛔ Skipping invalid coordinate:", feature);
                continue;
            }

            const marker = new mapboxgl.Marker(el)
                .setLngLat([feature.longitude, feature.latitude])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 }).setHTML(`
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

            marker.addTo(mapRef.current);
            allMarkers.push(marker);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });

    mapRef.current = map;
    setBounds(map.getBounds());
    props.setboundCondition(map.getBounds());

    map.on('move', () => {
      setLng(map.getCenter().lng.toFixed(4));
      setLat(map.getCenter().lat.toFixed(4));
      setZoom(map.getZoom().toFixed(2));
    });

    const coordinatesGeocoder = function (query) {
      const matches = query.match(/^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i);
      if (!matches) return null;

      function coordinateFeature(lng, lat) {
        return {
          center: [lng, lat],
          geometry: { type: 'Point', coordinates: [lng, lat] },
          place_name: 'Lat: ' + lat + ' Lng: ' + lng,
          place_type: ['coordinate'],
          properties: {},
          type: 'Feature'
        };
      }

      const coord1 = Number(matches[1]);
      const coord2 = Number(matches[2]);
      const geocodes = [];

      if (coord1 < -90 || coord1 > 90) {
        geocodes.push(coordinateFeature(coord1, coord2));
      }
      if (coord2 < -90 || coord2 > 90) {
        geocodes.push(coordinateFeature(coord2, coord1));
      }
      if (geocodes.length === 0) {
        geocodes.push(coordinateFeature(coord1, coord2));
        geocodes.push(coordinateFeature(coord2, coord1));
      }
      return geocodes;
    };

    map.addControl(new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      localGeocoder: coordinatesGeocoder,
      placeholder: 'Address or LAT, LONG',
      mapboxgl: mapboxgl,
      reverseGeocode: true,
      marker: { color: 'green' }
    }));

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
      const { latitude, longitude } = e.coords;
      curLocationCoordinates = { lat: latitude, lng: longitude };
    });

    map.on('zoomend', () => {
      setBounds(map.getBounds());
      props.setboundCondition(map.getBounds());
    });

    map.on('dragend', () => {
      setBounds(map.getBounds());
      props.setboundCondition(map.getBounds());
    });

    map.on('mousemove', (e) => {
      setMouseCoordinates({
        lat: e.lngLat.lat.toFixed(4),
        lng: e.lngLat.lng.toFixed(4),
      });
    });

    map.on('load', function () {
    });

    fetchData();

    return () => map.remove();
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      fetchData();
    }
  }, [props.showFavoritesOnly, JSON.stringify(Array.from(props.bookmarkedCardIDs || []))]);

  return (
    <div style={{ zIndex: '0' }}>
      <div className='map-container' ref={mapContainerRef} />
      <div className='sidebarStyle'>
        <div>Map Center - Lat: {lat} | Long: {lng} | Zoom: {zoom}</div>
        <div>Mouse Coordinates - Lat: {mouseCoordinates.lat} | Long: {mouseCoordinates.lng}</div>
      </div>
      <div>
        <a>Map icons by </a>
        <a href="https://icons8.com/icon/" title="marker icons">icons8.</a>
      </div>
    </div>
  );
};

export { allMarkers, draw, blueMarkers, greenMarkers, yellowMarkers, curLocationCoordinates };
export default Content1;
