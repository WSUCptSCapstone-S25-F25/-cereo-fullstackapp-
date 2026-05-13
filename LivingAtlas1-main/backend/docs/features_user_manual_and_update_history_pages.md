# User Manual and Update History Pages

## Scope

This document describes two global informational pages available from navbar links.

Covered:
- User Manual page structure and navigation behavior
- Update History page role and content behavior

---

## User Manual Page

Route: `/user-manual`
Component: `UserManual`

### Section model
User manual organizes content into section IDs and labels, including:
- overview
- card container and card workflows
- ArcGIS and custom layers sections
- basemap and map controls
- add-cards-from-map sub-sections

### In-page navigation behavior
- Left-side section nav updates active section state
- Supports deep link via query param `?section=<id>`
- Auto-opens nested add-cards-from-map group for matching section IDs

### Content role
Acts as the canonical in-app usage guide with visual examples and walkthrough text.

---

## Update History Page

Route: `/update-history`
Component: `ChangelogHistory`

### Page role
Provides full chronological release history in a standalone page.

### Content behavior
- Displays date-grouped updates and fixes
- Includes links when relevant (for example app URL entries)
- Acts as long-form historical changelog, while the Home `What's New` modal focuses on latest highlights

---

## Relationship Between the Two Pages

- `User Manual` explains how to use current features.
- `Update History` explains what changed across releases.

Both are global references and accessible directly from navbar regardless of login state.
