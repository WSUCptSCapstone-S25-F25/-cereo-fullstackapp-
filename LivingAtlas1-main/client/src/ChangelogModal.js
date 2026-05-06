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

                <h3>Update Date: 5/2/2026</h3>
                <p>Improved the loading logic of the Upload Panel: layers inside a service are now lazy-loaded on demand. When a user expands a state → folder → service path, only the layers for that service are fetched at that moment, reducing unnecessary network requests on initial load.</p>
                <p>Improved search in the Upload Panel, Custom Layers Panel, and ArcGIS Picker Modal: search now uses a lazy algorithm that searches already-loaded items first and fetches additional data only as needed. Folder-level pagination is also supported so search results within large folders are browsable page by page.</p>
                <p>Changed the folder UI in the Custom Layers Panel and ArcGIS Picker Modal from an expand/collapse tree structure to a navigable folder structure, consistent with the file-explorer style already used for state and service folders.</p>
                <p>The Custom Layers Panel now supports drag-and-drop folder management: drag a folder into another folder to nest it, or drag it out of a folder to move it to the top level.</p>
                <p>The Upload Card Panel now supports the same link features as the Learn More edit mode: add a display label to a link and attach multiple links per card.</p>
                <p>Improved undo/redo compatibility in the Draw Polygon modal: undo and redo now correctly restore line style, fill color, opacity changes, and the positions of the 8 bounding-box resize handles when in resize mode.</p>
                <hr />
                <p>Restricted card editing and deletion so that non-admin users can only modify or delete their own cards.</p>
                <p>Added the ability to link ArcGIS services and layers directly from the Upload Card modal, matching the functionality already available in the Learn More edit mode.</p>
                <p>Added checkboxes to linked ArcGIS service/layer items in the Learn More modal to toggle layer visibility on the map. Also improved the visual layout of linked items and the Upload Panel jump-to behavior.</p>
                <p>Improved the success message display after login and streamlined the redirect flow to the home page.</p>
                <p>Fixed an issue where images in the Learn More modal's image display area failed to render.</p>
                <p>Fixed the appearance of the "Select a Location" UI elements in the Learn More modal's edit mode.</p>

            </div>
            <div className="changelog-modal-footer">
                <button className="changelog-modal-dismiss" onClick={onClose}>Got it</button>
            </div>
        </Modal>
    );
}

export default ChangelogModal;
