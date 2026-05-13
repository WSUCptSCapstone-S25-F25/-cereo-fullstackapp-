# Mapbox Map Interactions and Card Overlay Features

## Scope

This document covers core map interactions tied to cards and overlay rendering in `Content1`.

Included:
- Marker fetch/retry and render
- Marker popup behavior
- Card polygon/image overlays
- Click/hover interactions
- Search-condition linkage

---

## Marker Data Loading

Markers are fetched from backend (`/getMarkers`) with retry strategy:
- Multiple attempts with exponential backoff
- Long timeout support
- Recovery logging when retries succeed

Triggers include:
- Initial map ready/load
- `atlas:cards-loaded` event
- `atlas:card-uploaded` event

---

## Marker Rendering by Category

Each marker is rendered as custom DOM marker with category class:
- `blue-marker` (River)
- `green-marker` (Watershed)
- `yellow-marker` (other category)

Category marker arrays are maintained for filtering/visibility flows.

---

## Marker Popup Interaction

Marker click behavior:
- Stops event propagation to prevent background close
- Toggles popup if same marker is clicked
- Updates search condition with card title
- Notifies card panel selection via callback

Map background click closes active popup unless click originated from guarded overlay click flow.

---

## Card Polygon Overlay Rendering

For cards with polygon vertices:
- Creates GeoJSON polygon source
- Adds fill layer with configured color/opacity
- Adds line layer with configurable dash style

Supported line styles map to dash arrays (solid/dashed/dotted/dashdot).

Polygon click opens card popup; hover shows pointer cursor.

---

## Card Image Overlay Rendering

For image cards with four-corner vertices:
- Adds transparent hit polygon layer for click targeting
- Loads raster image through backend proxy endpoint
- Adds image source/layer with provided coordinates

Image hit layer click opens associated card popup.

---

## Overlay Cleanup

Before re-rendering card overlays, app removes existing per-card polygon/image layers and sources to avoid stale duplication.

---

## Marker + Overlay Cohesion

`renderMarkers()` deliberately skips point-marker creation for cards represented as polygon/image overlays.

This ensures one visual representation per card location type.

---

## Popup/Selection UX Details

The app tracks currently open marker card id and popup ref to support:
- idempotent close/open behavior
- avoiding accidental close during overlay click
- synchronization with search selection state
