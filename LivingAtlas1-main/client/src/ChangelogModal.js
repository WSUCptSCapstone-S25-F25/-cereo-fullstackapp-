import React from 'react';
import Modal from 'react-modal';

function ChangelogModal({ isOpen, onClose }) {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="changelog-modal"
            overlayClassName="changelog-modal-overlay"
        >
            <div className="changelog-modal-header">
                <h2>What's New</h2>
                <button className="changelog-modal-close" onClick={onClose} aria-label="Close">x</button>
            </div>
            <div className="changelog-modal-body">

                <h3>Update Date: 4/29/2026</h3>
                <p>Added a pin button to cards in the card container. Pinned cards are always sorted to the top of the card list.</p>
                <p>Fixed a sizing issue with the card container list view when it first loads.</p>
                <p>Improved image display in the Learn More modal so the image fills the display area completely.</p>
                <p>Improved button styles in the Learn More modal and ArcGIS Picker modal for a more consistent visual appearance.</p>
                <p>Added an unsaved changes confirmation prompt to the cancel/close button in the Learn More modal's edit mode.</p>
                <p>In list view, card action buttons (Favorite, Locate on Map, Pin to Top) are now grouped inside a "⋮" menu that opens a small modal near the button, keeping the card row clean.</p>
                <p>Improved the display of empty fields in the Learn More modal's card info section.</p>
                <p>Improved the display structure of linked ArcGIS services and layers in the Learn More modal to use a hierarchical layout.</p>
                <p>Fixed a bug in the ArcGIS Picker modal where sublayers could not be displayed; layers now also show legend images.</p>
                <p>Fixed a bug in the ArcGIS Picker modal's search feature and added previous/next navigation controls for search results.</p>
                <p>Added previous/next search result navigation to the Upload Panel and Custom Layers Panel.</p>
                <p>Fixed an issue in the ArcGIS Upload Panel and Custom Layers Panel where search results were incomplete due to layers not yet being loaded.</p>
                <p>Fixed a bug in the Draw Polygon modal where changing the fill color would make the polygon and vertex points invisible.</p>
                <hr />

                <h3>Update Date: 4/29/2026</h3>
                <p>Improved button icon in the Draw Polygon modal toolbar.</p>
                <p>Added a "Curve" option to the line style menu in the Draw Polygon modal. When enabled, all polygon edges are rendered as smooth quadratic bezier curves. Each edge shows a draggable control-point handle and dragging adjusts the curvature of that edge.</p>
                <p>Added pentagon and hexagon shape presets to the Draw Polygon modal's shape menu.</p>
                <p>Added a "Reset Map View" button to the draw control bar that flies the map back to the default view.</p>
                <p>Fixed a bug in the Draw Polygon modal where the mouse cursor failed to display as a crosshair.</p>
                <hr />

                <h3>Update Date: 4/28/2026</h3>

                <p>Added undo/redo support to the Draw Polygon modal. Use Ctrl+Z to undo and Ctrl+Y (or Ctrl+Shift+Z) to redo any change to polygon vertices.</p>
                <p>The draw bar's delete button has been permanently moved inside the Draw Polygon modal toolbar. Standardized all toolbar button icons to use solid FontAwesome icons for a consistent visual style.</p>
                <p>Fixed a bug where clicking a linked item in the Learn More modal's "Linked ArcGIS Services/Layers" section would open the Upload Panel but fail to expand the correct folder or scroll to the target item.</p>
                <p>Fixed a bug where opening the Upload Panel via a linked item in Learn More would not show the layer-loading animation.</p>

                <hr />

                <h3>Update Date: 4/26/2026</h3>
                <p>Added a feature that allows users to create links to ArcGIS services through the Learn More modal edit mode. (Bugs related to this feature still exist and will be fixed in later updates.)</p>
                <p>Refactored the Administration page and added a nav tab to access all tabs.</p>
                <p>Revised the login workflow so that it redirects users to the home page after login.</p>
                <p>Improved the display of links in the link section of the Learn More modal, and allow links to display as custom text labels.</p>
                <p>Resolved a backend deployment timeout failure caused by a missing database connection timeout and an unguarded startup call.</p>

                <hr />

                <h3>Update Date: 4/24/2026</h3>
                <p>Overhauled the visual design of the Profile page — content is now presented in a clean card layout with structured info rows, a styled bio section, polished form inputs with focus states, and a feedback message banner.</p>
                <p>Fixed a bug where saving a profile image in edit mode would always fail with an error — the backend endpoints for profile image upload, bio, and username updates were missing from the active router and have now been added, along with a database migration to create the required columns.</p>
                <p>Reduced the global size of all card markers on the map for a less cluttered view.</p>

                <hr />

                <h3>Update Date: 4/19/2026</h3>
                <p>Refined the Administration page UI for both User Management and Signup Requests, and added typed confirmation modals for sensitive actions (Change Role and Delete Account) to reduce accidental operations.</p>
                <p>Refreshed the Login and Signup page designs for a more consistent visual style, and polished related UI details including left sidebar controls and profile menu hover interactions.</p>
                <p>Fixed an intermittent Upload Panel rendering issue where one folder could fail to appear after opening the panel.</p>
                <p>Updated the Map Style (basemap) modal options by replacing generic entries with more practical real-world map style choices.</p>
                <p>Added database-backed user UI preferences for basemap selection, card container view mode (list/grid), card container size, and left/right panel placement, with local pre-login caching and merge-on-login sync behavior.</p>

                <hr />

                <h3>Update Date: 4/16/2026</h3>
                <p>Folders and first/second-level layers in the Custom Layers Panel can now be reordered via drag-and-drop, with changes saved to the database.</p>
                <p>Added support for creating custom folders in the Custom Layers Panel. You can drag any layer into a folder, rename or delete folders via right-click, and all folder data is persisted in the database.</p>
                <p>Removed the Rename and Remove options from layer items in the GIS Services panel. These actions are now exclusively available in the Custom Layers Panel.</p>
                <p>Fixed a display issue with expandable second-level layers in the Custom Layers Panel.</p>

                <hr />

                <h3>Update Date: 4/15/2026</h3>
                <p>Added a new Custom Layers Panel in the left sidebar (faObjectGroup icon), allowing you to save frequently used GIS layers from the GIS Services panel into a personal collection for quick access.</p>
                <p>Right-click any service or layer in the GIS Services panel and select "Save to Custom Layers" to add it. Saved layers can be toggled on/off, searched, renamed, pinned (auto-load), and removed from within the Custom Layers Panel.</p>
                <p>The panel shares the same tree-style layout, right-click context menu, opacity slider, and search/filter toolbar as the GIS Services panel.</p>
                <p>More features for the Custom Layers Panel are currently in development.</p>

                <hr />

                <h3>Update Date: 4/14/2026</h3>
                <p>Added a "Change to Polygon" button in the Learn More modal, allowing you to convert a marker-based card into a polygon area directly from the card detail view.</p>
                <p>Shape coordinates in the Draw Polygons modal can now be edited manually in real time. Additional shape presets have also been added to the modal.</p>
                <p>Refreshed the visual appearance of the Upload Panel and the card container toolbar for a cleaner, more modern look.</p>
                <p>Added a visibility toggle button to the Polygon tool (P) menu on the map, allowing you to show or hide all markers and polygons at once.</p>
                <p>Fixed an issue where cards with only the default image would incorrectly display the logo in the Learn More gallery instead of showing the "No Image" placeholder. Also fixed a bug where clicking blank areas in the image preview mode would unintentionally open the Learn More modal.</p>

                <hr />

                <h3>Update Date: 4/12/2026</h3>
                <p>Fixed an issue where custom colors and line styles for polygons were not saved correctly.</p>
                <p>Added more features to the Draw Polygon modal: adjust shape opacity, drag to reposition, rotate, and scale (enlarge/shrink) shapes.</p>
                <p>Fixed polygon display issues during editing and resolved a bug where the Save button in the Learn More modal would not appear after completing polygon edits.</p>
                <p>Improved card container layout and button display for a cleaner toolbar appearance.</p>
                <p>Enhanced card container toolbar: merged "Filter by Category" and "Filter by Tags" into a single unified modal, and added more sort options (Newest First, Oldest First).</p>
                <p>Added a List View mode to the card container, toggleable via a toolbar button.</p>
                <p>Added a left-side display mode for the card container, which can be shown alongside the Upload Panel in a split layout.</p>

                <hr />

                <h3>Update Date: 4/9/2026</h3>
                <p>Cards now support polygon areas as an alternative to single-point locations. You can represent a card with a custom polygon shape drawn directly on the map.</p>
                <p>Two workflows are available to draw a polygon: (1) open the Upload Card panel → choose "Polygon Area" → click "Draw Polygon on Map"; or (2) click the Polygon tool (P) button in the top-right map controls.</p>
                <p>The polygon drawing modal includes options for border line style, fill color, and quick shape presets (triangle, square, rectangle). Note: custom color and line style may not persist after saving — this will be fixed in a future update.</p>
                <p>Improved the layout of the Learn More modal — short fields are now arranged in a two-column grid for a cleaner, more compact view.</p>
                <p>Added "Other" and "None" as new Category options when creating or editing a card.</p>

                <hr />

                <h3>Update Date: 4/8/2026</h3>
                <p>Improved the Profile page — added profile image upload and a bio section, and removed the card container that was previously shown on the profile page.</p>
                <p>Users can now click the Edit button on their profile to modify their username, profile image, and bio in a single edit session.</p>
                <p>Fixed an issue where newly created cards without a custom thumbnail would show a broken image. A default CEREO logo is now used as fallback.</p>
                <p>Cards now display their creation date at the bottom of the Learn More modal. Existing cards without a date default to today's date.</p>

                <hr />

                <h3>Update Date: 4/7/2026</h3>
                <p>Improved layer popup appearance and stacking behavior — when multiple popups are open at the same time, they now stack with visible offsets and distinct border colors so each one stays readable.</p>
                <p>The "Add Card" form is now accessible directly from the card panel toolbar via the "+" button, instead of a separate page.</p>
                <p>A "Tags" button was added to the card panel toolbar, allowing you to filter cards by tag right inside the card list.</p>
                <p>The card upload form now supports adding multiple images and multiple files at once, and includes a "Select Location" button that lets you pick coordinates by clicking on the map. The same feature is also available when editing a card through Learn More.</p>
                <p>The standalone Layer Panel was removed. Built-in layers (Hydrological Boundaries, City Limits) are now inside the ArcGIS Layers panel's "Built-in Layers" section, and the panel icon was updated.</p>
                <p>Vector hover overlays now match the zoom range of raster tile layers, so they appear and disappear together as you zoom in and out.</p>

                <hr />

                <h3>Update Date: 4/5/2026</h3>
                <p>Added a new Map Style panel in the left sidebar, so you can switch basemaps directly on the map page.</p>
                <p>Expanded the basemap list with more options, and each item now uses the exact style id as its label.</p>
                <p>Hydrological Boundaries and City Limits are now clickable and open a popup with basic attributes.</p>

                <hr />

                <h3>Update Date: 4/4/2026</h3>
                <p>The DB/Local data source toggle was changed from two buttons to a compact switch control in the toolbar.</p>
                <p>The Update button is now an icon-only square button with a spinning animation while updating.</p>
                <p>The upload panel is now wider — side and bottom padding were reduced to give more room to the folder area.</p>
                <p>State folders and folders now highlight on hover for better visual feedback.</p>
                <p>A new "Pin" feature was added: right-click any service, layer, or sublayer and choose "Pin (Auto-load)" to have it automatically selected every time you open the panel. Pinned selections are saved locally in your browser.</p>
                <p>The previous database-based selection persistence was temporarily disabled in favor of the new pin system.</p>

                <hr />

                <h3>Update Date: 4/3/2026</h3>
                <p>Added an opacity slider to the ArcGIS Upload Panel toolbar. You can now drag the slider to adjust how transparent all visible map layers are.</p>
                <p>Fixed a bug where sublayers inside a group layer were incorrectly shown at the same level as their parent. Layers with nested groups now display in the correct hierarchy.</p>

                <hr />

                <h3>Update Date: 3/31/2026</h3>
                <p>Resend email service was integrated with a custom domain (cereo-livingatlas.com) via GoDaddy DNS records.</p>
                <p>Password recovery and signup notification emails now send from the verified domain with a proper "Living Atlas" sender name.</p>
                <p>A new Switch Account page was added. Users can view their current account, switch between previously logged-in accounts, or add a new account.</p>
                <p>The Logout button in the navbar dropdown now properly clears the login session before redirecting to the login page.</p>

                <hr />

                <h3>Update Date: 3/28/2026</h3>
                <p>The ArcGIS Upload Panel now uses a tree-style layout with connector lines and custom square checkboxes, similar to Google Earth's layer panel.</p>
                <p>Right-click context menus were added on folders, services, and layers — supporting Rename, Learn More, and Delete actions. Rename and Delete require admin login.</p>
                <p>The service-level checkbox replaces the old Add/Remove buttons, and the "(MapServer)" suffix is now hidden from display names.</p>
                <p>Top status banners (loading, data source info) were moved to bottom-of-screen notifications that auto-dismiss after a few seconds.</p>
                <p>The search toolbar now stays pinned at the top of the upload panel while scrolling, and the browser's default right-click menu is blocked inside the panel.</p>

                <hr />

                <h3>Update Date: 3/25/2026</h3>
                <p>See all images now supports reorder controls in edit mode. You can move images up/down, and the saved order is shared across card tiles, Learn More, and map pin popup.</p>
                <p>Learn More image management was improved with checkbox-based multi-select delete. Delete actions are staged in edit mode and only applied on Save, while Cancel restores the previous state.</p>
                <p>Card carousel indicators were upgraded for larger image sets: up to 5 dots are shown at once with dynamic sliding, and farther non-neighbor dots use a smaller size for clearer focus.</p>
                <p>Image display behavior was updated to keep full images visible in fixed-size frames across card thumbnails, Learn More image areas, and map pin popup thumbnails.</p>

                <hr />

                <h3>Update Date: 3/24/2026</h3>
                <p>Learn More is now the main place to manage a card. You can edit, delete, and close from the top bar, and edit fields directly in the modal.</p>
                <p>Image handling is better: there is a 5-slot gallery, easier add/delete in edit mode, and cancel now rolls back new uploads.</p>
                <p>Map pin popups are cleaner, show a larger image preview, and can open the matching Learn More card directly.</p>
                <p>The card panel now uses custom Category and Sort menus, and sort is built into the top toolbar.</p>
                <p>Image data is now more consistent between card list, Learn More, and map popup, so the same image is shown in more places.</p>

                <hr />

                <h3>Update Date: 3/23/2026</h3>
                <p>Card behavior was simplified: click a card to open Learn More, and use the small zoom icon to locate it on the map.</p>
                <p>Learn More became larger and easier to read, with more focus on the image area.</p>
                <p>Card size and styling were unified so the panel looks more consistent.</p>
                <p>Cards now support multiple images, with carousel browsing in cards, Learn More, and full-size preview.</p>
                <p>The backend image model was moved to CardImages to support multiple images per card.</p>

            </div>
            <div className="changelog-modal-footer">
                <button className="changelog-modal-dismiss" onClick={onClose}>Got it</button>
            </div>
        </Modal>
    );
}

export default ChangelogModal;
