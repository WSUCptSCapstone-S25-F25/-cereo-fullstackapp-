import React from 'react';
import Modal from 'react-modal';

function GeneralOnboardingModal({ isOpen, onClose }) {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="onboarding-modal"
            overlayClassName="onboarding-modal-overlay"
        >
            <div className="onboarding-modal-header">
                <h2>Welcome to Living Atlas</h2>
                <button className="onboarding-modal-close" onClick={onClose} aria-label="Close">x</button>
            </div>
            <div className="onboarding-modal-body">
                <h3>How to Start Onboarding in Each Panel</h3>
                <p><strong>Cards Panel</strong>: Click the <strong>Cards</strong> button in the left sidebar, then click <strong>Start onboarding</strong> (play button) in the card panel top bar.</p>
                <p><strong>GIS Services Panel</strong>: Click the <strong>GIS Services</strong> button in the left sidebar, then click <strong>Tutorial</strong> (play button) in the panel header.</p>
                <p><strong>Custom Layers Panel</strong>: Click the <strong>Custom Layers</strong> button in the left sidebar, then click <strong>Tutorial</strong> (play button) in the panel header.</p>
                <p><strong>Basemap Panel</strong>: Click the <strong>Basemap</strong> button in the left sidebar, then click <strong>Tutorial</strong> (play button) in the panel header.</p>

                <h3>Quick Help Tip</h3>
                <p>In these panels, the <strong>question mark</strong> button opens the detailed user manual, and the <strong>play</strong> button starts the guided onboarding tour.</p>
            </div>
            <div className="onboarding-modal-footer">
                <button className="onboarding-modal-dismiss" onClick={onClose}>Got it</button>
            </div>
        </Modal>
    );
}

export default GeneralOnboardingModal;