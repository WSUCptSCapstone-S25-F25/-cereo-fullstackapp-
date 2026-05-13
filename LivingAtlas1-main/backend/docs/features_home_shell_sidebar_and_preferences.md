# Home Shell, Sidebar Controls, and UI Preferences

## Scope

This document describes Home-level orchestration features outside individual panel internals.

Covered:
- Left sidebar global controls
- Panel open/close coordination
- Mini search workflow
- UI preference load/save and sync rules

---

## Home Shell Role

`Home` coordinates the app workspace by composing:
- map canvas (`Main`)
- card container (`Content2`)
- left sidebar global launchers
- global modals and chatbot widget

---

## Left Sidebar Global Controls

Sidebar includes:
- Search button (mini search modal)
- Cards toggle button
- GIS Services panel toggle
- Custom Layers panel toggle
- Basemap panel toggle
- What's New button
- General onboarding button

### Mutual exclusivity
GIS panel and Custom Layers panel are coordinated so opening one closes the other.

---

## Mini Search Workflow

Mini search modal allows quick card search input.

Submit behavior:
1. normalize search term to lowercase
2. set trigger source to `sidebar-mini`
3. increment search request id
4. update shared `searchCondition`
5. auto-expand card container

---

## Card Panel Shell Controls

Home manages high-level card panel shell state:
- collapsed vs expanded
- width
- side placement (left/right)

These values are passed to map and card container components for coordinated layout.

---

## UI Preferences Synchronization

Preferences tracked at Home shell level:
- `basemapId`
- `cardViewMode` (`grid` or `list`)
- `cardPanelSide` (`left` or `right`)

### Logged-in behavior
- fetch cloud preferences by email
- merge with pending local preferences
- apply merged result to UI
- persist merged state back to cloud
- clear pending local cache when synced

### Logged-out behavior
- load local pending preferences
- apply locally when available
- write new changes to local pending cache

### Save cadence
When logged in and preferences are loaded, UI changes are debounced before save.

---

## ArcGIS Linked Navigation Bridge

Home listens to window event `open-arcgis-panel`.

On event:
- opens ArcGIS panel
- closes custom layers panel
- sets navigation target for ArcGIS panel to locate requested linked item

This allows card-linked ArcGIS items to jump users directly into ArcGIS panel context.
