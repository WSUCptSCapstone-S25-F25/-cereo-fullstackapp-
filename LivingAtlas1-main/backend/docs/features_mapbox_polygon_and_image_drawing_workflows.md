# Mapbox Polygon and Image Drawing Workflows

## Scope

This document describes map-integrated drawing workflows that use the custom `PolygonDrawingModal`.

Included:
- Polygon tool launch flow
- PNG image placement flow
- Save/cancel event contracts
- Modal capability summary
- Integration points with card workflows

---

## Launch Paths

### From Map Toolbar
- Add Tools -> Polygon Tools opens polygon modal
- Add Tools -> Add PNG starts image upload + image modal flow

### From Other UI (Card workflows)
The same modal component is also reused in card editing/upload flows for polygon/image location editing.

---

## Polygon Drawing Flow

When polygon tool starts:
- App opens `PolygonDrawingModal` in polygon mode
- On save, app dispatches `polygon-tool-save` event with:
  - vertices
  - centroid
  - style (`fillColor`, `lineStyle`)
- On cancel, modal closes with no save event

---

## Image Placement Flow (PNG)

Image flow sequence:
1. User selects PNG file via hidden file input.
2. App validates PNG type.
3. File is converted to preview data URL.
4. Image dimensions are measured.
5. Modal opens in image mode for placement/edit.

On save, app dispatches `map-image-tool-save` with:
- vertices
- centroid
- original file
- preview URL

On cancel, app dispatches `map-image-tool-cancel` and clears pending image state.

---

## Modal Core Capabilities

`PolygonDrawingModal` supports advanced editing behavior including:
- Interactive point placement
- Vertex drag/edit
- Shape presets
- Fill color/opacity adjustments
- Line-style options (including curve mode)
- Drag/rotate/resize workflows
- Undo/redo style interactions

Note: Detailed modal internals are shared with card editing flows and can be documented further if needed.

---

## Draw/Mode Coordination

App intercepts default MapboxDraw polygon mode changes and routes users into custom modal workflow for consistency.

This ensures all drawn polygons/images follow same save payload structure.

---

## Event-Based Integration

Map drawing features integrate with broader app via custom window events:
- `map-point-tool-start`
- `map-image-tool-start`
- `polygon-tool-save`
- `map-image-tool-save`
- `map-image-tool-cancel`

This event bridge allows independent panels/modals to react without tight coupling.
