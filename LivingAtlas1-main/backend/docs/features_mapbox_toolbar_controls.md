# Mapbox Toolbar and Control Features

## Scope

This document covers toolbar/control features mounted on the Mapbox map in `Content1`.

Included:
- Native Mapbox controls
- Geocoder and coordinate search
- Draw control group custom buttons
- Add Tools dropdown workflows
- Visibility toggle, reset view, screenshot

---

## Native Mapbox Controls

Mounted controls include:
- FullscreenControl (`top-left`)
- NavigationControl (`top-left`)
- GeolocateControl (`top-left`, high-accuracy + heading)
- MapboxGeocoder search control
- MapboxDraw control (polygon/trash enabled)

---

## Geocoder Behavior

Geocoder supports:
- Address/place search
- Reverse geocode
- Custom coordinate parser (`Lat,Lng` style)

On result:
- Search location coordinates are updated
- Bound-condition sync is triggered for filtering pipeline

---

## Draw Group Customization

After draw control is mounted, app injects custom controls into draw group.

Custom toolbar actions:
- Add Tools button (plus icon)
- Marker/polygon visibility toggle
- Reset Map View
- Screenshot Map

---

## Add Tools Dropdown

Add Tools menu options:
- Add Single Point
- Polygon Tools
- Add PNG

Event dispatch behavior:
- Single Point -> `map-point-tool-start`
- Polygon -> open polygon drawing modal
- Add PNG -> `map-image-tool-start`

Menu closes on outside click and on option selection.

---

## Marker/Polygon Visibility Toggle

Toggle button switches global visibility state for:
- Marker DOM elements (`allMarkers`)
- Card polygon/image overlay layers (by id prefix matching)

Button icon and title update between show/hide states.

---

## Reset View Button

Reset view action performs `map.flyTo()` back to default map camera:
- center: `[-120, 46]`
- zoom: `5.5`

---

## Screenshot Button

Screenshot uses `html2canvas` on map container.

Behavior:
- Captures map viewport
- Excludes map control corners from capture
- Downloads PNG file with timestamp

---

## Draw Mode Intercept

When MapboxDraw enters `draw_polygon` mode, app immediately switches draw to `simple_select` and opens custom polygon drawing modal.

This standardizes polygon creation through the app's richer drawing workflow.
