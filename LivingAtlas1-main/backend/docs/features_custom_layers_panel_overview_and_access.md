# Custom Layers Panel: Overview and Access

## What This Covers

This document describes the purpose, entry conditions, and top-level structure of the Custom Layers Panel.

Covered areas:
- Panel purpose and data source
- Login requirement and empty states
- Header controls
- Main workspace layout
- Integration with ArcGIS Upload Panel save flow

---

## Panel Purpose

Custom Layers Panel is a per-user library for saved ArcGIS services.

It allows users to:
- Reuse frequently used services quickly
- Organize services into custom folders
- Toggle layers and sublayers without re-finding services in the upload panel

---

## Data Source and Scope

Panel data is user-scoped and loaded from backend APIs.

Primary datasets:
- Saved custom services (`fetchCustomLayers`)
- User-created folders (`fetchCustomFolders`)

Load behavior:
- Data is fetched when panel opens and user is logged in.
- Load key includes `userEmail + refreshKey` to avoid redundant refetch in repeated open/close operations.

---

## Login Requirement

If user email is missing, panel shows a login-required message.

In this state:
- Layer library features are unavailable
- Header still provides Help and Close

---

## Header Controls

Panel header includes:
- New Folder button
- Help button (opens manual section)
- Tutorial button (opens onboarding)
- Close button

---

## Sticky Toolbar

Top sticky section includes:
- Search input and search type selector
- Search/clear buttons
- Global opacity slider
- "Show only services added to map" filter
- Clear All layers button

---

## Folder Workspace

Main panel body uses file-explorer-like folder navigation:
- Root level shows top-level folders
- Entering folder shows its services and direct subfolders
- Breadcrumb provides back navigation and drag target behavior

---

## Empty States

When no saved services and no custom folders exist:
- Panel shows guidance text to save services from GIS Services panel

---

## Integration with Save Flow

Services are usually added into this panel from ArcGIS Upload Panel context menu action:
- "Save to Custom Layers"

After save:
- Parent page can trigger `refreshKey` increment
- Custom Layers Panel reloads and displays new item

---

## Related API Operations

Backend-facing operations involved in this panel:
- Fetch custom layers
- Fetch/create/delete/rename custom folders
- Delete custom layer
- Reorder custom layers
- Save per-service layer order
