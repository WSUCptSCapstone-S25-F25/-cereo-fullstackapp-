# Card Learn More Modal

## What This Covers

This document covers the Card Learn More modal, including read mode, edit mode, image management, file management, and toolbar actions.

---

## Opening and Closing

### Open
- Click a card item in the Card Container.

### Close
- Click the close button in modal toolbar.
- Overlay-close can be disabled while onboarding is active.

### Notes
- The modal can open in guided onboarding mode.
- Learn More visibility is coordinated with location/polygon edit tools.

---

## Toolbar Actions

### Left Side
- **Edit**: enter inline edit mode.
- **Save / Cancel**: shown while editing.
- **Download PDF**: export card details and images to PDF.
- **Delete Card**: remove card (permission checked).

### Right Side
- **Help**: opens user manual detail-view section.
- **Onboarding**: starts interactive Learn More tutorial.
- **Close**: closes modal.

### Delete Permission
- Only card creator or admin can delete a card.
- Confirmation prompt appears before deletion.

---

## Read Mode Content

Read mode shows:
- Title and category
- Author, creator, email
- Funding and organization
- Coordinates (non-overlay cards)
- Links list
- Description and tags
- Attached downloadable files
- Image gallery section with See all images option

---

## Edit Mode (Inline Editing)

### Editable Fields
- Title
- Category
- Author
- Email
- Funding
- Organization
- Coordinates (for non-overlay cards)
- Links (URL + optional display text)
- Description
- Tags

### Location Editing Actions
- **Select Location** (point cards)
- **Change to Polygon** (point cards)
- **Edit Polygon / Edit Image** (overlay cards)

### Save/Cancel Behavior
- Save writes changes and exits edit mode.
- Cancel can prompt to discard unsaved changes.

---

## Image Management in Learn More

### Main Gallery
- Up to 5 slots shown in Learn More gallery view.
- Clicking image opens preview.
- In edit mode, empty slots can be used to upload image.
- In edit mode, existing images can be deleted.

### See All Images View
- Opens full image list.
- In edit mode, users can:
  - Reorder images (move up/down)
  - Select multiple images
  - Delete selected images
  - Add new image

### Notes
- Upload and delete actions are guarded by loading state.
- Image operations refresh card image data after completion.

---

## File Management in Learn More

### Read Mode
- Shows downloadable file links.

### Edit Mode
- Shows current attached files.
- Allows deleting existing files (with confirmation).
- Allows staging multiple new files for upload.

---

## PDF Export

### Purpose
Generate a PDF snapshot of card information.

### Included Data
- Core card metadata and text fields
- Location type context
- Tags
- Links
- Images (proxy loading/fallback strategies used)

### Notes
- If an image cannot be embedded, export continues with placeholder text.

---

## Common Questions

**Q: Why can’t I close by clicking outside modal sometimes?**
A: Overlay close is locked during certain onboarding flows.

**Q: Why is creator username not editable?**
A: Card creator identity is intentionally read-only.

**Q: Why can delete fail even in modal?**
A: Deletion requires creator/admin permission and valid card metadata.
