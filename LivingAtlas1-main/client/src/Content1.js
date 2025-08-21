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
  const mapRef = useRef(null); // Store map instance
  const [lng, setLng] = useState(-117.181738);
  const [lat, setLat] = useState(46.729777);
  const [zoom, setZoom] = useState(9);
  const [mouseCoordinates, setMouseCoordinates] = useState({ lat: 0, lng: 0 });
  const [bounds, setBounds] = useState({});

  // Move map when selectedCardCoords changes
  React.useEffect(() => {
    if (
      mapRef.current &&
      props.selectedCardCoords &&
      typeof props.selectedCardCoords.latitude === 'number' &&
      typeof props.selectedCardCoords.longitude === 'number'
    ) {
      console.log('[Content1] Moving map to:', props.selectedCardCoords);
      mapRef.current.flyTo({
        center: [props.selectedCardCoords.longitude, props.selectedCardCoords.latitude],
        zoom: 13
      });
    } else if (props.selectedCardCoords) {
      console.warn('[Content1] Invalid selectedCardCoords:', props.selectedCardCoords);
    }
  }, [props.selectedCardCoords]);

  // Resize map when content2 collapses
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.resize();
    }
  }, [props.isCollapsed]);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });
    mapRef.current = map;

    
    // Needed for the map to have bounds defined on startup
    setBounds(map.getBounds())
    props.setboundCondition(map.getBounds());

    // Update lat,long,zoom sidebar
    map.on('move', () => {
      setLng(map.getCenter().lng.toFixed(4));
      setLat(map.getCenter().lat.toFixed(4));
      setZoom(map.getZoom().toFixed(2));
      // To update the state of the bounds with the current map view
      //setBounds(map.getBounds());
    });

    // Given a query in the form "lng, lat" or "lat, lng"
    // returns the matching geographic coordinate(s)
    const coordinatesGeocoder = function (query) {

      // Match anything which looks like
      // decimal degrees coordinate pair.
      const matches = query.match(/^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i);
      if (!matches) {
        return null;
      }

      function coordinateFeature(lng, lat) {
        return {
          center: [lng, lat],
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },

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
        // must be lng, lat
        geocodes.push(coordinateFeature(coord1, coord2));
      }

      if (coord2 < -90 || coord2 > 90) {
        // must be lat, lng
        geocodes.push(coordinateFeature(coord2, coord1));
      }

      if (geocodes.length === 0) {
        // else could be either lng, lat or lat, lng
        geocodes.push(coordinateFeature(coord1, coord2));
        geocodes.push(coordinateFeature(coord2, coord1));
      }
      return geocodes;
    };

    // Search
    map.addControl(
      new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: coordinatesGeocoder,
        // zoom: 6,
        placeholder: 'Address or LAT, LONG',
        mapboxgl: mapboxgl,
        reverseGeocode: true,
        marker: {
          color: 'green'
        }
      })
    );

    map.addControl(draw);

    // updateMarkers() will be the function for polygon filtering
    map.on('draw.create', updateMarkers);
    map.on('draw.delete', showAll);
    map.on('draw.update', updateMarkers);

    // Add full screen function to the map
    map.addControl(new mapboxgl.FullscreenControl(), 'top-left');

    // Add zoom function to the map
    map.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Add current location (user's)
    const currentLocation = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },

      // When active the map will receive updates to the device's location as it changes.
      trackUserLocation: true,
      // Draw an arrow next to the location dot to indicate which direction the device is heading.
      showUserHeading: true
    });
    map.addControl(
      currentLocation, 'top-left'
    );

    // UNDER CONSTRUCTION
    currentLocation.on('geolocate', (e) => {
      const { latitude, longitude } = e.coords;
      curLocationCoordinates = { lat: latitude, lng: longitude };
    });

    async function fetchData() {
      try {
        const response = await api.get('/getMarkers');
        var data = response.data;

        // Assign the parsed GeoJSON data to a variable
        for (let i = 0; i < data.data.length; i++) {
          const feature = data.data[i];
          const el = document.createElement('div');
          if (feature.category == "River") {
            // blue
            el.className = 'blue-marker';
            blueMarkers.push([feature.category, feature.tags, [feature.longitude, feature.latitude]])
          }
          else if (feature.category == "Watershed") {
            // green
            el.className = 'green-marker';
            greenMarkers.push([feature.category, feature.tags, [feature.longitude, feature.latitude]])
          }
          else {
            // yellow for places
            el.className = 'yellow-marker';
            yellowMarkers.push([feature.category, feature.tags, [feature.longitude, feature.latitude]])
          }

          var x = new mapboxgl.Marker(el);
          //"did", "title", "description", "longitude", "latitude"
          if (!isNaN(feature.longitude) && !isNaN(feature.latitude)) {
            x.setLngLat([feature.longitude, feature.latitude]);
          } else {
              console.warn("Skipping invalid marker:", feature);
              continue;
          }
          x.setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(
                `<br><h3>${feature.title}</h3><p><b>Category: </b>${feature.category}</p><p><b>Tags: </b>${feature.tags}</p><br>`
              )
          );
          x.getElement().addEventListener('click', function (e) {
            // Update the search bar when the marker is clicked
            marker_clicked = true;
            console.log("CLICKED ON MARKER:", feature.title);
            props.setSearchCondition(feature.title);
          });
          x.getPopup().on('close', () => {
            // reset search bar
            marker_clicked = false;
            props.setSearchCondition("");
          });

          x.addTo(map); // comment out when zoom function is uncommented
          allMarkers.push(x);
        }
      }
      catch (error) {
        console.error('Error fetching data:', error);
        throw error;
      }
    }

    fetchData();

    // Update the lat/long values once the zoom ends
    map.on('zoomend', () => {
      // set bounds 
      setBounds(map.getBounds())
      props.setboundCondition(map.getBounds());
    });

    function updateVisibility() {
      if (allMarkers.length == 0) {
        // reset arrays to reload data
        allMarkers = [];
        greenMarkers = [];
        blueMarkers = [];
        yellowMarkers = [];
        // re-fetch data
        fetchData();
      }
      // get bounds
      const bounds = map.getBounds(); // Get the current map bounds

      // filter markers
      const filteredMarkers = allMarkers.filter(marker => {
        // Check if the marker coordinates are within the map bounds
        return bounds.contains(marker.getLngLat());
      });

      // hide everything
      for (let i = 0; i < allMarkers.length; i++) {
        allMarkers[i].remove();
      }

      // show only what satisfied the filter criteria
      for (let i = 0; i < filteredMarkers.length; i++) {
        filteredMarkers[i].addTo(map);
      }

    }

    // Attach an event listener to the map's 'moveend' event, which fires when the map's position or zoom changes.
    map.on('moveend', () => {
      if (props.CategoryCondition === '' && props.filterCondition === '') {
        updateVisibility();
      }
    });

    updateVisibility();
    // Change the lat/long values once the user is done dragging the view
    map.on('dragend', () => {
      setBounds(map.getBounds());
      props.setboundCondition(map.getBounds());
    });

    // update cursor with coordinates
    map.on('mousemove', (e) => {
      setMouseCoordinates({
        lat: e.lngLat.lat.toFixed(4),
        lng: e.lngLat.lng.toFixed(4),
      });
    });

    // Load river stream data and urban area from using vector tileset from mapbox studio
    map.on('load', function () {
      // Add a layer for NHD_stream
      map.addLayer({
        id: 'vector-tileset',
        type: 'fill',
        source: {
          type: 'vector',
          // Tileset URL or ID from mapbox studio
          url: 'mapbox://livingatlas.71vcn3c7',
        },
        // Get the source layer name from tileset on mapbox studio
        'source-layer': 'NHD_streams-6qjkxa',
        paint: {
          'fill-color': 'blue',
          'fill-opacity': 0.5,
        },
      });

      // Add another layer for Urban area 
      map.addLayer({
        id: 'urban-areas-fill',
        type: 'fill',
        source: {
          type: 'vector',
          // Tileset URL or ID from mapbox studio
          url: 'mapbox://livingatlas.78fvgfpd',
        },
        // Source name from tileset on mapbox studio
        'source-layer': 'Washington_State_City_Urban_G-0e7hes',
        paint: {
          'fill-color': 'red', // Set the fill color to red
          'fill-opacity': 0.4,
        },
      });

      // Add urban area outline
      map.addLayer({
        id: 'urban-areas-outline',
        type: 'line',
        source: {
          type: 'vector',
          // Tileset URL or ID from mapbox studio
          url: 'mapbox://phearakboth.6pnz5bgy',
        },
        // Source name from tileset on mapbox studio
        'source-layer': 'Washington_State_City_Urban_G-48j9h8',
        paint: {
          'line-color': 'white',
          'line-width': 1,
        },

      })

      // Create an event listener (when we click on the stream)
      map.on('click', 'vector-tileset', (e) => {
        // Set stream_clicked to true when it is clicked
        stream_clicked = true;
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['vector-tileset']
        });

        if (!features.length) {
          return;
        }

        const feature = features[0];
        // We display a pop for some important features of the NHD streams
        // new mapboxgl.Popup({ offset: 30 })
        var stream_popup = new mapboxgl.Popup({ offset: 30 })
          .setLngLat(e.lngLat)
          .setHTML(`
                          <br><ul><strong>GNIS Name: </strong>${feature.properties.GNIS_Name}</ul>
                          <ul><strong>Object ID: </strong>${feature.properties.OBJECTID}</ul>
                          <ul><strong>Length in KM: </strong>${feature.properties.LengthKM}</ul>
                          <ul><strong>GNIS ID: </strong>${feature.properties.GNIS_ID}</ul>
                      `)
          .addTo(map);
        stream_popup.on('close', () => {
          stream_clicked = false;
        });
      });

      // Add event listener for urban area
      map.on('click', 'urban-areas-fill', (e) => {
        // Only display the popup for urban area when Markers or water stream aren't clicked 
        // This will prevent showing popups for everything when only 1 element is clicked
        if (!marker_clicked && !stream_clicked) {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['urban-areas-fill']
          });
          if (!features.length) {
            return;
          }
          const feature = features[0];
          // We display a pop for the important description of the urban area
          new mapboxgl.Popup({ offset: 30 })
            .setLngLat(e.lngLat)
            .setHTML(`
                          <br><h3><strong>${feature.properties.CITY_NM}</h3></strong>
                          <ul><strong>OBJECTID:</strong> ${feature.properties.OBJECTID}</ul>
                          <ul><strong>UGA_NM:</strong> ${feature.properties.UGA_NM}</ul>
                          <ul><strong>UGA_NM2:</strong> ${feature.properties.UGA_NM2}</ul>
                          <ul><strong>COUNTY_NM:</strong> ${feature.properties.COUNTY_NM}</ul>
                          <ul><strong>GMA:</strong> ${feature.properties.GMA}</ul>
                          <ul><strong>FIPS_PLC:</strong> ${feature.properties.FIPS_PLC}</ul>
                          <ul><strong>INCORP:</strong> ${feature.properties.INCORP}</ul>
                          <ul><strong>ORIGIN:</strong> ${feature.properties.ORIGIN}</ul>
                          <ul><strong>DATEMOD:</strong> ${feature.properties.DATEMOD}</ul>
                      `)
            .addTo(map);
        }
      });
    })
    // Clean up on unmount
    return () => map.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  return (
    // set zIndex to '0' so that the map will be displayed below other components (like modals for example)
    <div style={{ zIndex: '0' }}>
      <div className='map-container' ref={mapContainerRef}>
        {/* Map info box now inside map-container */}
        <div className="map-info-bottomleft">
          <div>
            Map Center - Lat: {lat} | Long: {lng} | Zoom: {zoom}
          </div>
          <div>
            Mouse Coordinates - Lat: {mouseCoordinates.lat} | Long: {mouseCoordinates.lng}
          </div>
        </div>
      </div>

      {/* Giving credit to the authors of the map icons used. */}
      <div>
        <a>Map icons by </a><a href="https://icons8.com/icon/" title="marker icons">icons8. </a>
      </div>

      {/* Render Content2 and pass onCardClick
      {props.renderContent2 && props.renderContent2({ onCardClick: handleCardClick })} */}
    </div>
  );

};

export { allMarkers, draw, blueMarkers, greenMarkers, yellowMarkers, curLocationCoordinates};
export default Content1;


// import React from 'react';
// import './Content1.css';


// function Content1() {
//     return (
//         <section id="content-1">
//             <h1>Content Area 1</h1>
//             <p>
//                 Below is a map that shows all the data points in our system. Each marker represents a unique data point, and you can click on each marker to view more information about that point.
//             </p>
//         </section>
//     );
// }

// export default Content1;
