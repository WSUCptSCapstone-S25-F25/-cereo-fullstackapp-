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

                <h3>Update Date: 5/11/2026</h3>
                <p>Added the AI chatbot hidden floating UI window and backend wiring. Full features (RAG and conversation memory) are still under development and currently unavailable.</p>
                <p>Added a new onboarding button under the left sidebar changelog button for general app onboarding, with a brief walkthrough of each panel and guidance that each panel has its own onboarding.</p>
                <p>Expanded the User Manual with detailed Service/Layer Info modal documentation.</p>
                <p>Added a new Mapbox toolbar feature to place PNG images on the map. PNG overlays can now serve as card representations and support move, rotate, and resize transformations.</p>
                <p>Integrated the Add Single Point trigger into the Mapbox toolbar, and consolidated Add Single Point, Polygon Tools, and Add PNG into the Add Cards from Map (+) modal.</p>
                <p>Added top-right Help and Onboarding buttons to the Create Card modal, matching the Card Container style, with Help redirecting to the relevant User Manual section.</p>

            </div>
            <div className="changelog-modal-footer">
                <button className="changelog-modal-dismiss" onClick={onClose}>Got it</button>
            </div>
        </Modal>
    );
}

export default ChangelogModal;
