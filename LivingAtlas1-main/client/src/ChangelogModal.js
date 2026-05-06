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

                <h3>Update Date: 5/5/2026</h3>
                <p>Added a PDF download button next to the Edit button in the Learn More modal toolbar, allowing users to export the full card content as a PDF directly from the detail view.</p>
                <p>Added a screenshot button to the Mapbox map toolbar. Clicking it captures the current map view and downloads it as a PNG image.</p>
                <p>Added an Update History page (accessible from the top navbar) that shows all past release notes. The "What's New" popup now shows only the most recent update instead of the full history.</p>
                <p>Improved the display and behavior of the embedded map info modal: better layout, cleaner interactions, and more consistent styling.</p>
                <p>Fixed a bug where searching in the card container using the same keyword more than once would not re-trigger the search.</p>

            </div>
            <div className="changelog-modal-footer">
                <button className="changelog-modal-dismiss" onClick={onClose}>Got it</button>
            </div>
        </Modal>
    );
}

export default ChangelogModal;
