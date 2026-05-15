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
                <h3>Update Date: 5/15/2026</h3>
                <p>Improved chatbot response formatting and style, making answers cleaner, more structured, and easier to read.</p>
                <p>Refactored the left sidebar Search Panel to support searching across homepage features and jumping directly to trigger matching functions.</p>
                <p>Fixed an issue where user preferences could reset after backend restart; preferences are now persisted in the database reliably.</p>

            </div>
            <div className="changelog-modal-footer">
                <button className="changelog-modal-dismiss" onClick={onClose}>Got it</button>
            </div>
        </Modal>
    );
}

export default ChangelogModal;
