import React, { useState } from 'react';
import './RemovedServicesPanel.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faUndo, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';

function RemovedServicesPanel({ isOpen, onClose }) {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchType, setSearchType] = useState('any'); // 'any', 'folder', 'service', 'layer'
    
    const mockRemovedServices = [
        {
            key: 'removed-wa-aq-1',
            label: 'Air Quality Monitoring',
            state: 'WA',
            folder: 'Environmental',
            removedDate: '2024-10-12T10:30:00Z',
            layersRemoved: ['PM2.5 Monitoring Stations', 'Ozone Levels']
        }
    ];

    const filteredServices = mockRemovedServices.filter(service =>
        service.label.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        service.folder.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        service.state.toLowerCase().includes(searchKeyword.toLowerCase())
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleRestore = (service) => {
        console.log('Restore service:', service);
        alert(`Restore functionality for "${service.label}" will be implemented in the future`);
    };

    const handlePermanentDelete = (service) => {
        console.log('Permanently delete service:', service);
        if (window.confirm(`Are you sure you want to permanently delete "${service.label}"? This action cannot be undone.`)) {
            alert(`Permanent delete functionality for "${service.label}" will be implemented in the future`);
        }
    };

    const clearAllRemoved = () => {
        if (window.confirm('Are you sure you want to clear all removed services? This action cannot be undone.')) {
            alert('Clear all functionality will be implemented in the future');
        }
    };

    const renderSearchBar = () => (
        <div>
            <div className="removed-services-searchbar">
                <input
                    type="text"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    placeholder="Search removed services..."
                />
                <select
                    value={searchType}
                    onChange={e => setSearchType(e.target.value)}
                    className="removed-services-searchbar-dropdown"
                >
                    <option value="any">Any</option>
                    <option value="folder">Folder</option>
                    <option value="service">Service</option>
                    <option value="layer">Layer</option>
                </select>
                <button
                    className="removed-services-search-btn"
                    title="Search"
                    onClick={() => {
                        if (!searchKeyword) {
                            return;
                        }
                        console.log('Search:', searchKeyword, 'Type:', searchType);
                    }}
                >
                    <FontAwesomeIcon icon={faSearch} />
                </button>
                <button
                    className="removed-services-clear-btn"
                    title="Clear Search"
                    onClick={() => {
                        setSearchKeyword('');
                        setSearchType('any');
                    }}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="removed-services-panel">
            <div className="removed-services-header">
                <div className="removed-services-title">
                    <FontAwesomeIcon icon={faTrash} style={{ marginRight: '8px' }} />
                    Removed Services
                </div>
                <button className="removed-services-close" onClick={onClose} title="Close">
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            <div className="removed-services-search">
                {renderSearchBar()}
            </div>

            <div className="removed-services-actions">
                <button 
                    className="removed-services-clear-all-btn"
                    onClick={clearAllRemoved}
                    disabled={filteredServices.length === 0}
                >
                    Clear All ({filteredServices.length})
                </button>
            </div>

            <div className="removed-services-content">
                {filteredServices.length === 0 ? (
                    <div className="removed-services-empty">
                        {searchKeyword ? (
                            <div>
                                <p>No removed services match your search.</p>
                                <button 
                                    className="removed-services-clear-search"
                                    onClick={() => setSearchKeyword('')}
                                >
                                    Clear Search
                                </button>
                            </div>
                        ) : (
                            <div>
                                <FontAwesomeIcon icon={faTrash} size="2x" style={{ color: '#ccc', marginBottom: '12px' }} />
                                <p>No services have been removed yet.</p>
                                <p style={{ fontSize: '14px', color: '#666' }}>
                                    Services you remove from the map will appear here.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="removed-services-list">
                        {filteredServices.map(service => (
                            <div key={service.key} className="removed-service-item">
                                <div className="removed-service-header">
                                    <div className="removed-service-info">
                                        <div className="removed-service-name">
                                            {service.label}
                                        </div>
                                        <div className="removed-service-meta">
                                            <span className="removed-service-state">{service.state}</span>
                                            <span className="removed-service-separator">•</span>
                                            <span className="removed-service-folder">{service.folder}</span>
                                            <span className="removed-service-separator">•</span>
                                            <span className="removed-service-date">
                                                {formatDate(service.removedDate)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="removed-service-actions">
                                        <button
                                            className="removed-service-restore-btn"
                                            onClick={() => handleRestore(service)}
                                            title="Restore service"
                                        >
                                            <FontAwesomeIcon icon={faUndo} />
                                        </button>
                                        <button
                                            className="removed-service-delete-btn"
                                            onClick={() => handlePermanentDelete(service)}
                                            title="Delete permanently"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                </div>
                                
                                {service.layersRemoved && service.layersRemoved.length > 0 && (
                                    <div className="removed-service-layers">
                                        <div className="removed-service-layers-list">
                                            {service.layersRemoved.map((layer, index) => (
                                                <span key={index} className="removed-service-layer-tag">
                                                    {layer}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="removed-services-footer">
                <div className="removed-services-info">
                    Removed services are kept for 30 days before permanent deletion.
                </div>
            </div>
        </div>
    );
}

export default RemovedServicesPanel;