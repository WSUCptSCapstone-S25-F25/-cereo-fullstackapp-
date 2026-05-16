import React, { useState } from 'react';
import Modal from 'react-modal';

function ChangelogModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('latest');

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
            
            <div className="changelog-modal-tabs">
                <button 
                    className={`changelog-tab ${activeTab === 'latest' ? 'active' : ''}`}
                    onClick={() => setActiveTab('latest')}
                >
                    Latest Update
                </button>
                <button 
                    className={`changelog-tab ${activeTab === 'future' ? 'active' : ''}`}
                    onClick={() => setActiveTab('future')}
                >
                    Future Works
                </button>
            </div>

            <div className="changelog-modal-body">
                {activeTab === 'latest' && (
                    <>
                        <h3>Update Date: 5/16/2026</h3>
                        <p>Enhanced Service/Layer Info Modal with improved display of child layers, legends, positioning, and active state indicators.</p>
                        <p>Added field-based filtering for ArcGIS layers within the Layer Info Modal.</p>
                        <p>Aligned rendering z-index for clickable vectors with raster image overlays.</p>
                        <p>Improved map zoom control with draggable pointer for real-time z-value adjustment.</p>
                        <p>Refined UI appearance of Upload Panel, Custom Layers Panel, and Learn More Modal.</p>
                        <p>Implemented responsive sizing for Top Navigation Bar and Left Sidebar based on screen dimensions.</p>
                        <p>Updated User Manual, onboarding workflows, and organized User Manual tabs.</p>
                        <p>Enhanced Basemap Panel with additional options, functionality improvements, and visual refinements.</p>
                        <p>Extended image overlay support from PNG-only to include JPEG format in Add Card from Map workflow.</p>
                        <p>Updated User Manual, onboarding tutorials, and chatbot knowledge base for all new features and changes.</p>
                    </>
                )}

                {activeTab === 'future' && (
                    <>
                        <h3>Future Works</h3>
                        <h4>Chatbot (Production Release)</h4>
                        <ul className="changelog-list">
                          <li>Integrate ArcGIS knowledge base: Query ArcGIS services database to retrieve REST endpoint information and provide answers to ArcGIS-related questions.</li>
                          <li>Integrate card knowledge base: Access card data in the database to extract and share relevant information in chatbot responses.</li>
                          <li>Conversation history: Enable users to view, manage, and delete past conversations. Each session maintains independent context.</li>
                          <li>Agent capabilities: Enhance chatbot to assist users with specific tasks, such as locating and adding layers to the map.</li>
                          <li>Performance improvements: Reduce response latency and improve answer accuracy.</li>
                        </ul>

                        <h4>ArcGIS Upload Panel</h4>
                        <ul className="changelog-list">
                          <li>Support for additional ArcGIS database content and services.</li>
                        </ul>

                        <h4>Custom Layer Panel</h4>
                        <ul className="changelog-list">
                          <li>Add more user-customization options for modifying panel content and behavior.</li>
                        </ul>

                        <h4>Left Sidebar</h4>
                        <ul className="changelog-list">
                          <li>Expand app settings with global configuration options (e.g., theme style preferences).</li>
                        </ul>
                    </>
                )}
            </div>

            <div className="changelog-modal-footer">
                <button className="changelog-modal-dismiss" onClick={onClose}>Got it</button>
            </div>
        </Modal>
    );
}

export default ChangelogModal;
