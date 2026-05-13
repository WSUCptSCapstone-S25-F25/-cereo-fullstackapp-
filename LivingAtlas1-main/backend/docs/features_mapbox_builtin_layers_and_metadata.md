# Mapbox Built-in Layers, Metadata, and Viewport Sync

## Scope

This document covers map-level built-in layers and metadata/UI sync features in `Content1` and related home state.

Included:
- Built-in vector tile layers
- Layer click popups and cursor changes
- Viewport bounds synchronization
- Mouse/location coordinate displays
- Credit/attribution portal placement

---

## Built-in Vector Tile Layers

On map load, app adds built-in vector layers:
- `vector-tileset` (Hydrological Boundaries theme)
- `urban-areas-fill` (City Limits fill)
- `urban-areas-outline` (City Limits outline)

These layers are initialized with visibility hidden and toggled by higher-level UI controls.

---

## Built-in Layer Popups

Click handlers provide metadata popups for built-in layers.

`vector-tileset` popup shows fields like:
- GNIS Name
- Object ID
- LengthKM
- GNIS ID

`urban-areas-fill` popup shows fields like:
- city name
- OBJECTID
- UGA_NM
- COUNTY_NM
- GMA
- INCORP

Hover changes cursor to pointer on interactive layers.

---

## Viewport Bound Sync for Filtering

Map emits bound updates to parent state on:
- zoomend
- dragend
- moveend

Bounds are converted to app format:
- `NE: { Lat, Lng }`
- `SW: { Lat, Lng }`

This supports card filtering by current viewport.

---

## Coordinate and Camera Display

Bottom-left info panel displays:
- map center lat/lng
- zoom level
- current mouse lat/lng

These values update on move and mousemove events.

---

## Geolocation Integration

Geolocate control updates current location coordinate store when geolocation events fire.

---

## Credit / Attribution Layout

App customizes bottom-right metadata area:
- Synchronizes custom credit host near attribution
- Moves Mapbox logo into managed metadata host
- Renders additional credit portal content (icon attribution)

This keeps branding/credit UI organized with map controls.

---

## Map Resize with Panel Layout

Map container left/right offsets react to sidebar and card-panel layout.

Resize logic runs on:
- container geometry changes
- card panel transition end

This prevents map rendering glitches when side panels open/close.
