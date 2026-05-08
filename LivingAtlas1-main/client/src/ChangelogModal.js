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

                <h3>Update Date: 5/7/2026</h3>
                <p>Expanded the User Manual to cover all app features, including all panels and workflows.</p>
                <p>Added help (?) buttons to the main panels on the home page; clicking one opens the corresponding section in the User Manual.</p>
                <p>Fixed a bug where navigating to a layer via a linked item in the ArcGIS Upload Panel would jump to the wrong location, caused by a loading order issue.</p>
                <p>Fixed a bug where the Custom Layers Panel displayed incorrect content after being opened, caused by a loading order issue.</p>
                <p>This app's new URL: <a href="https://rwc-living-atlas.netlify.app/" target="_blank" rel="noopener noreferrer">https://rwc-living-atlas.netlify.app/</a></p>

            </div>
            <div className="changelog-modal-footer">
                <button className="changelog-modal-dismiss" onClick={onClose}>Got it</button>
            </div>
        </Modal>
    );
}

export default ChangelogModal;
