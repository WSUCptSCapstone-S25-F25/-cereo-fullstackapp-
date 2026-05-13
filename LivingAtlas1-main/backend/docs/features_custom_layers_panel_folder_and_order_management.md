# Custom Layers Panel: Folder and Order Management

## What This Covers

This document explains folder operations and drag-and-drop ordering in Custom Layers Panel.

Covered areas:
- Create/delete/rename folders
- Service reorder and move between folders
- Nested folder move and rename propagation
- Breadcrumb drop behavior
- Persistence APIs

---

## Folder Model

Folder names can represent nested hierarchy using `/` separators.

Examples:
- `Hydrology`
- `Hydrology/Rivers`

Panel root view shows top-level folders; entering folder reveals nested level.

---

## Create Folder

New Folder button prompts for name.

Validation:
- Empty names rejected
- Duplicate folder names rejected

On success:
- Folder is added to local folder list
- Folder expansion state is updated
- Backend `createCustomFolder` persists folder

---

## Rename Folder

Folder rename updates:
- `dbFolders` entries
- Service folder paths for affected rows
- Expanded folder state when needed

Persistence uses `renameCustomFolder` API.

---

## Delete Folder

Delete folder from folder context menu.

Behavior:
- Confirmation dialog explains impact
- If folder has services, they move to `Root`
- Folder entry is removed from local folder list

Persistence uses `deleteCustomFolder` API.

---

## Service Reorder and Move

Services can be dragged:
- Within same folder for ordering
- Across folders to change folder assignment

Drop result updates local sort order and folder value, then calls batch persist:
- `reorderCustomLayers(userEmail, order)`

---

## Folder-to-Folder Nesting

Dragging one folder onto another nests source folder under target.

Implementation details:
- Source base path is rewritten to `target/sourceName`
- All descendant folder paths are rewritten accordingly
- Services under moved subtree receive updated folder paths
- Each affected folder path is persisted via `renameCustomFolder`

Safety rule:
- Prevent dropping a folder into its own descendant path

---

## Breadcrumb Drop (Move Out)

While inside a folder path, breadcrumb acts as drop target.

Dropping a folder there moves it up to parent of current path.

This supports quick "move out" behavior without full tree expansion.

---

## Layer-Level Reorder

Inside expanded service, top-level layers can be reordered by drag handle.

Persistence uses per-service API:
- `saveLayerOrder(userEmail, serviceKey, layerOrder)`

---

## Persistence Endpoints Used

Folder/order management relies on:
- Create folder
- Delete folder
- Rename folder
- Batch reorder services
- Save per-service layer order
