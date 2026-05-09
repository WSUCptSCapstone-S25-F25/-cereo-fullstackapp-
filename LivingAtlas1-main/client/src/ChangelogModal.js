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

                <h3>Update Date: 5/8/2026</h3>
                <p>Added onboarding tours for the Card Container Panel and the Learn More modal, triggered by the Play button at the top-right.</p>
                <p>Enhanced the Admin page User Management table with new columns for online status, account creation time, and last online time, plus sorting by Name and Date Joined.</p>
                <p>Added a Learn More button to services in both the ArcGIS Upload Panel and Custom Layers Panel; clicking it opens that service's Learn More modal.</p>

            </div>
            <div className="changelog-modal-footer">
                <button className="changelog-modal-dismiss" onClick={onClose}>Got it</button>
            </div>
        </Modal>
    );
}

export default ChangelogModal;
