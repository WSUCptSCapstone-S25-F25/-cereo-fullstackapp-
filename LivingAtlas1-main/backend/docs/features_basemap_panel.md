# Basemap Panel Features

## Scope

This document covers the Basemap Panel (BasemapSwitcher) used to change Mapbox base style.

Included:
- Basemap list and preview behavior
- Style-switch application flow
- State persistence integration
- Onboarding and help entry

---

## Panel Entry and Placement

Basemap Panel is opened from the left sidebar map-style button.

Main props used by the panel:
- `isOpen`
- `onClose`
- `mapInstance`
- `currentBasemapId`
- `onBasemapChange`

---

## Available Basemap Styles

Panel currently provides predefined Mapbox styles:
- `navigation-day-v1`
- `navigation-night-v1`
- `outdoors-v12`
- `satellite-streets-v12`
- `satellite-v9`
- `streets-v12`

Each item includes:
- style id
- style URL
- static thumbnail URL (token-appended)

---

## Basemap Apply Logic

When a basemap is selected:
1. Current camera state is captured (center, zoom, bearing, pitch).
2. Existing custom non-mapbox sources/layers are collected.
3. `map.setStyle()` applies the target basemap style.
4. On `style.load`, camera state is restored.
5. Custom sources/layers are re-added.

This avoids losing user-added overlay content during style switches.

---

## Controlled/Uncontrolled Sync

The panel keeps internal selected state in sync with controlled prop `currentBasemapId`.

If map instance is not immediately available, a delayed retry attempts applying the requested basemap.

---

## Preference Persistence (via Home)

Basemap id is persisted through user UI preferences:
- Logged-in user: cloud preferences API
- Anonymous user: local pending preferences cache

On app load, preferred basemap is restored and panel reflects active choice.

---

## Help and Onboarding

Header actions include:
- Help: opens user manual basemap section
- Tutorial: opens panel-specific onboarding overlay
- Close

Onboarding highlights:
- Panel container
- Help button
- Basemap list
- Basemap item
- Active item

Keyboard support includes left/right step navigation and Escape close.

---

## UX Notes

Active basemap item is visually highlighted.

Thumbnail URLs append access token at render time.

If panel closes while onboarding is open, onboarding auto-closes.
