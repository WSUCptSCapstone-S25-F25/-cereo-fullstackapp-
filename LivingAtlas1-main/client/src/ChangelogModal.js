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

                <h3>Update Date: 5/10/2026</h3>
                <p>Added onboarding tours for the ArcGIS Upload Panel, Custom Layers Panel, and Basemap Panel.</p>
                <p>Cards and card titles now adapt to different screen sizes automatically.</p>
                <p>Updated the Custom Layers Panel search and navigate-to-result functionality to match the behavior of the Upload Panel.</p>
                <p>Improved service row appearance; the service Learn More modal now includes an opacity control, links to open its layers directly, and a historical layer timeline view.</p>

            </div>
            <div className="changelog-modal-footer">
                <button className="changelog-modal-dismiss" onClick={onClose}>Got it</button>
            </div>
        </Modal>
    );
}

export default ChangelogModal;
