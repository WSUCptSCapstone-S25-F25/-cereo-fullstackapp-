# Custom Layers Panel: Layer Selection and Map Rendering

## What This Covers

This document explains how Custom Layers Panel controls map rendering.

Covered areas:
- Service/layer/sublayer selection model
- Group-layer bulk selection
- Map add/remove logic for vector and raster layers
- Opacity controls
- Clear-all behavior

---

## Selection Hierarchy

Selections are tracked at multiple levels:
- Service-level (select all leaf layers)
- Layer-level (single leaf layer)
- Group-layer level (all descendant leaf layers)
- Sublayer level (legend-driven entries)

Core states:
- `checkedLayerIds`
- `checkedSublayerIds`
- `serviceLayerAdded`

---

## Service-Level Select All

Selecting service checkbox:
- Checks all leaf layer IDs
- Marks service as added
- Initializes sublayer checks where multiple legend entries exist

Unselecting service checkbox:
- Clears all checked layers and sublayers for that service
- Marks service as not added

---

## Layer-Level Selection

When layer is checked:
- Layer ID is added to checked set
- Legend-derived sublayers are auto-checked (if available)

When layer is unchecked:
- Layer ID is removed
- Related sublayer checks are cleared

---

## Group-Layer Bulk Toggle

For group nodes, panel computes descendant leaf layers and applies bulk toggle.

Supported behavior:
- Select all descendant layers
- Deselect all descendant layers
- Sync sublayer states accordingly

---

## Sublayer Behavior

Sublayer checkbox updates parent-layer status:
- If at least one sublayer selected -> parent layer stays selected
- If no sublayers selected -> parent layer is deselected

Service added-state is recalculated from sublayer selections.

---

## Map Diff Rendering

Panel compares previous vs current checked states and updates map layers incrementally.

Per checked layer it can:
- Add/remove vector style layers and source
- Add/remove raster source/layers
- Rebuild sublayer raster stacks when sublayer selection changes

IDs use `custom` prefixes to isolate custom-layer map artifacts.

---

## Opacity Controls

### Global Opacity
Main slider updates all custom raster/vector paint opacity.

### Service Opacity
Service info modal includes per-service opacity slider for active custom-layer map IDs tied to that service key.

---

## Clear All

Clear All action resets selection states:
- `checkedLayerIds`
- `checkedSublayerIds`
- `serviceLayerAdded`

Map layers are then removed by render-diff effect because all checked IDs become empty.

---

## Layer Order Within Service

Service layer tree respects saved `layer_order` when available.

Users can drag top-level layer nodes to reorder.

On drop:
- Local `layerOrder` updates
- Backend `saveLayerOrder` persists order per service
