# Custom Layers Panel: Context Menu, Modals, Pinning, and Onboarding

## What This Covers

This document explains right-click actions, info modals, pinning, and onboarding workflow in Custom Layers Panel.

Covered areas:
- Context menu by target type
- Remove-from-library flow
- Service and layer info modals
- Pin/unpin persistence behavior
- Onboarding guided tour

---

## Context Menu Actions

Context menu is shared pattern with upload panel and adapts by target type.

### Folder target
- Rename
- Delete Folder

### Service target
- Rename
- Learn More
- Pin / Unpin (Auto-load label)
- Remove from Custom Layers

### Layer target
- Learn More
- Pin / Unpin

### Sublayer target
- Pin / Unpin

---

## Remove from Custom Layers

Service-level remove action:
1. Calls `deleteCustomLayer`
2. Removes map layers/sources for that service
3. Cleans related local states (`checked`, `added`, `sublayer`)
4. Shows status toast message

---

## Pinning Behavior

Pinned custom items are stored in browser local storage key:
- `custom_layers_pinned_items`

Stored item shape includes:
- `serviceKey`
- optional `layerId`
- optional `sublayerIndex`

Panel writes storage when pin state changes.

Note:
- This panel currently persists pin state and menu state checks.
- It does not auto-apply pinned selections on panel open in the current implementation.

---

## Service Info Modal

Open paths:
- Service row action button (`...`)
- Service context menu -> Learn More

Modal includes:
- Service description / metadata
- Spatial reference summary
- Service opacity slider
- Layer and sublayer link tree
- External ArcGIS service page link

Service metadata is cached by service key.

---

## Layer Info Modal

Open paths:
- Layer links inside service info modal
- Layer context menu -> Learn More

Modal includes (when available):
- Description
- Layer name
- Geometry type
- Copyright
- Min/Max scale
- Default visibility
- Attachment support
- Field summary
- External ArcGIS layer page link

Layer metadata cache key format:
- `${serviceKey}-${layerId}`

---

## Status Messages

Panel displays temporary bottom status messages for operations like:
- Remove success/failure
- Other local operation feedback

Messages auto-dismiss after timer expiry.

---

## Onboarding Tour

Tutorial button opens guided onboarding overlay.

Tour highlights:
- Panel overview
- New folder button
- Folder area
- Service row
- Search area
- Service info button
- Layer tree
- Display controls

Behavior:
- Supports previous/next/finish controls
- Supports keyboard arrows and Escape
- Locks panel into onboarding-oriented UI state and restores prior UI state on close
