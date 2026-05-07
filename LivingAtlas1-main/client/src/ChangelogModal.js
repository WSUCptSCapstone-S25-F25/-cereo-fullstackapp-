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

                <h3>Update Date: 5/6/2026</h3>
                <p>Added a User Manual page (accessible from the top navbar) covering card container features, the Card Detail View modal, and the ArcGIS Upload Panel.</p>
                <p>The card container and cards now adapt to different screen sizes automatically, switching to a two-column layout as needed while keeping card dimensions fixed.</p>
                <p>Added a login prompt modal that appears when a non-logged-in user attempts to use Add Card, Pin, Favorite, Show Favorites, or any action button inside the Card Detail View.</p>
                <p>Fixed a bug where search results in the ArcGIS Upload Panel were not displaying correctly.</p>
                <p>Removed the local/DB data source toggle from the Upload Panel — it now always loads services from the database.</p>

            </div>
            <div className="changelog-modal-footer">
                <button className="changelog-modal-dismiss" onClick={onClose}>Got it</button>
            </div>
        </Modal>
    );
}

export default ChangelogModal;
