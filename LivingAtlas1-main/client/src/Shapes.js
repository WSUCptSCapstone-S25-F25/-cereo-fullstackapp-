import mapboxgl, { Popup } from 'mapbox-gl'; // import mapbox api
const allMarkers = [];
let stream_clicked = false;
let marker_clicked = false;
// function loadMarkers(map){
//     fetch('https://api.mapbox.com/datasets/v1/f-alvarezpenate/clo4rbl4102hw2dpgdfccfp3l/features?access_token=pk.eyJ1IjoiZi1hbHZhcmV6cGVuYXRlIiwiYSI6ImNsZWh0ZXB6cTB5YnIzcW16NTJ5OGpvbGMifQ.0e-hIYt1VVSoRXujuzJnMA')
//       .then(response => response.json())
//       .then(data => {
//         // Create an empty array to store markers
//         var markers = [];
//         // Assign the parsed GeoJSON data to a variable
//         for (let i = 0; i < data.features.length; i++){
//           const feature = data.features[i]; 
//           const el = document.createElement('div');
//           if (feature.properties.category == "River") {
//             // blue
//             el.className = 'blue-marker';
//           }
//           else if (feature.properties.category == "Watershed") {
//             // green
//             el.className = 'green-marker';
//           }
//           else {
//             // yellow for places
//             el.className = 'yellow-marker';
//           }
          
//           // make a marker for each feature and add it to the map
//           var x = new mapboxgl.Marker(el)
//           x.setLngLat(feature.geometry.coordinates)
//           x.setPopup(
//               new mapboxgl.Popup({ offset: 25 }) // add popups
//               .setHTML( //Attach popups to markers
//                   `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`
//               )
//           )
//           x.getElement().addEventListener('click', function (e) {
//             // Update the variable when the marker is clicked
//             // setOpenedMarker(4); // 4 is just a placeholder bc test data doesnt have did
//             console.log('marker clicked:', 4);
//             // Update marker_clicked to True when it's clicked
//             marker_clicked = true;
//           });
//           x.getPopup().on('close', () => {
//             // setOpenedMarker(0); // reset opened marker did to show all cards again in front end.
//             console.log('popup was closed');
//             // Update marker_clicked to False when marker is closed
//             marker_clicked = false;
//           });
          
//           markers.push(x);
//           x.addTo(map);
//           allMarkers.push([feature.properties.category, feature.geometry.coordinates])
//         }
//         // Create an event listener for zoom
//         // map.on('zoom', function (e) {
//         //   var zoomLevel = map.getZoom();
//         //   // We add the markers to the map if the zoom level is greater than or equal to 10
//         //   // If it's less than that, we don't display the marker
//         //   for (let i = 0; i < markers.length; i++) {
//         //     if (zoomLevel >= 10) {
//         //       markers[i].addTo(map);
//         //     } else {
//         //       markers[i].remove();
//         //     }
//         //   }
          
//         // });       
//       }
//     );
// };

function loadUrbanAreas(map){
    // Now we fetch the data from github repo using GitHub Raw
    // Github raw allows us to fetch raw data file without having additional html or formatting added by github
    fetch('https://raw.githubusercontent.com/f-alvarezpenate/MarkerDataLivingAtlas/main/Washington_State_City_Urban_Growth_Areas.geojson')
        .then(response => response.json())
        .then(data => {
          // Add the GeoJSON data as a fill layer to the map
          map.addSource('urban-areas', {
              type: 'geojson',
              data: data,
          });

          // Add the urban area layer
          map.addLayer({
              id: 'urban-areas-fill',
              type: 'fill',
              source: 'urban-areas',
              paint: {
                  'fill-color': 'red', // Set the fill color to red
                  'fill-opacity': 0.4, // Adjust the opacity if needed
              },
          });

          // Outline the urban area
          map.addLayer({
              id: 'urban-areas-outline',
              type: 'line',
              source: 'urban-areas',
              paint: {
                  'line-color': 'white', // Set the outline color
                  'line-width': 1, 
              },
          });

          //  We change the cursor to a pointer when hovering over urban areas
          map.on('mouseenter', 'urban-areas-fill', () => {
              map.getCanvas().style.cursor = 'pointer';
          });
      
          // We change the cursor back to the default if not hover over
          map.on('mouseleave', 'urban-areas-fill', () => {
              map.getCanvas().style.cursor = '';
          });
        })
      
        .catch(error => {
            console.error('Error fetching urban area data:', error);
        });
        
        // Load river stream data from using vector tileset from mapbox studio
        map.on('load', function () {
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
                              <h3><strong>${feature.properties.CITY_NM}</h3></strong>
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
      });
};

function loadRivers(map){
    map.on('load', function() {
        map.addLayer({
            id: 'vector-tileset',
            type: 'fill',
            source: {
              type: 'vector',
              // Tileset URL or ID from mapbox studio
              url: 'mapbox://phearakboth.3q578f33', 
            },
            // Get the source layer name from tileset on mapbox studio
            'source-layer': 'NHD_streams-6uidcp', 
            paint: {
              'fill-color': 'blue', 
              'fill-opacity': 0.5, 
            },
          });
          // Create an event listener (when we click on the stream)
          map.on('click','vector-tileset', (e) => {
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
                            <ul><strong>GNIS Name: </strong>${feature.properties.GNIS_Name}</ul>
                            <ul><strong>Object ID: </strong>${feature.properties.OBJECTID}</ul>
                            <ul><strong>Length in KM: </strong>${feature.properties.LengthKM}</ul>
                            <ul><strong>GNIS ID: </strong>${feature.properties.GNIS_ID}</ul>
                        `)
                .addTo(map);
            stream_popup.on('close', () => {
              stream_clicked = false;
            });                    
          });
    })
};

export {loadUrbanAreas, loadRivers, allMarkers};