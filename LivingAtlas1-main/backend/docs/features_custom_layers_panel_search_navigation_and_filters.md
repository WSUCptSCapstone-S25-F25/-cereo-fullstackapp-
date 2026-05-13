# Custom Layers Panel: Search, Navigation, and Filters

## What This Covers

This document explains search and navigation features in Custom Layers Panel.

Covered areas:
- Path-scoped search
- Search type selector
- Auto-expansion of matches
- Previous/next result navigator
- Added-only filtering
- Clear search behavior

---

## Path-Scoped Search

Search scope depends on current folder path:
- At root: search all custom services
- Inside a folder: search only services in that folder

This ensures results stay relevant to user context.

---

## Search Type Selector

Custom panel supports explicit search types:
- `any`
- `folder`
- `service`
- `layer`

Users can search by pressing Enter or clicking search button.

---

## Lazy Layer Loading During Search

For layer-name search completeness, panel loads missing service layers on demand.

While loading:
- Search loading indicator appears
- Remaining service count is shown

When new layer data arrives:
- Active search is re-run automatically
- Match set and expansion state update

---

## Search Result Expansion

After a search run, panel auto-expands matched structure:
- Folder matches
- Service matches
- Layer/group matches

This reduces manual expansion steps.

---

## Result Navigation Mini Bar

When search is active, panel shows mini navigation controls:
- Previous match
- Next match
- Match counter (e.g., `3 / 12`)

Current matched item receives highlight state.

---

## Clear Search

Clear action resets:
- Search keyword and type context output
- Search result object
- Expanded folders/services/layers driven by search
- Result navigator state

---

## Show Added-Only Filter

"Show only services added to map" filters visible services to ones with checked layers.

When enabled:
- Panel auto-expands folders/services containing active map selections

When disabled:
- Expansion state related to this filter is reset

---

## Folder Navigation

Navigation behavior includes:
- Click folder to enter path
- Breadcrumb back button to move up one level
- Breadcrumb path display for current folder hierarchy

Search mode can temporarily supersede normal folder-only view by showing matched folders directly.
