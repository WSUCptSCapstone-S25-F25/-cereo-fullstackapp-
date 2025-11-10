import React, { useState, useEffect } from 'react';
import './RemovedServicesPanel.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faUndo, faTimes, faSearch, faSpinner, faSync } from '@fortawesome/free-solid-svg-icons';
import { fetchRemovedArcgisServices } from './arcgisServicesDb';

function RemovedServicesPanel({ isOpen, onClose }) {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchType, setSearchType] = useState('any'); // 'any', 'folder', 'service', 'layer'
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [expandedServices, setExpandedServices] = useState(new Set());
    const [removedServices, setRemovedServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Fetch removed services from database
    const fetchData = async () => {
        if (!isOpen) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const data = await fetchRemovedArcgisServices(null, { type: 'all' });
            console.log('Fetched removed services:', data);
            setRemovedServices(data || []);
        } catch (err) {
            console.error('Error fetching removed services:', err);
            setError('Failed to load removed services. Please try again.');
            setRemovedServices([]);
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch data when panel opens
    useEffect(() => {
        fetchData();
    }, [isOpen]);
    
    const mockRemovedServices = [
        {
            key: 'removed-wa-aq-1',
            label: 'Air Quality Monitoring',
            state: 'WA',
            folder: 'Environmental',
            removedDate: '2024-10-12T10:30:00Z',
            layersRemoved: [
                {
                    name: 'PM2.5 Monitoring Stations',
                    sublayers: ['Current Readings', 'Historical Data', 'Alert Zones']
                },
                {
                    name: 'Ozone Levels',
                    sublayers: ['Daily Averages', 'Peak Readings']
                }
            ]
        },
        {
            key: 'removed-id-water-1',
            label: 'Water Resources',
            state: 'ID',
            folder: 'Environmental',
            removedDate: '2024-10-11T14:15:00Z',
            layersRemoved: [
                {
                    name: 'Stream Flow',
                    sublayers: ['Current Flow', 'Seasonal Trends']
                },
                {
                    name: 'Water Quality Points',
                    sublayers: ['pH Levels', 'Temperature', 'Dissolved Oxygen']
                }
            ]
        },
        {
            key: 'removed-or-fire-1',
            label: 'Fire Management',
            state: 'OR',
            folder: 'Safety',
            removedDate: '2024-10-10T09:45:00Z',
            layersRemoved: [
                {
                    name: 'Fire Hazard Zones',
                    sublayers: ['High Risk Areas', 'Moderate Risk Areas']
                },
                {
                    name: 'Emergency Resources',
                    sublayers: ['Fire Stations', 'Evacuation Routes', 'Emergency Shelters']
                }
            ]
        }
    ];

    // Filter services based on search criteria
    const filteredServices = removedServices.filter(service => {
        const keyword = searchKeyword.toLowerCase();
        const matchesKeyword = !keyword || 
            service.label?.toLowerCase().includes(keyword) ||
            service.folder?.toLowerCase().includes(keyword) ||
            service.state?.toLowerCase().includes(keyword);

        if (!matchesKeyword) return false;

        // Filter by search type if keyword is provided
        if (keyword && searchType !== 'any') {
            switch (searchType) {
                case 'folder':
                    return service.folder?.toLowerCase().includes(keyword);
                case 'service':
                    return service.label?.toLowerCase().includes(keyword);
                case 'layer':
                    // Check if any layer names match
                    return service.layers_removed?.some(layer => 
                        layer.name?.toLowerCase().includes(keyword)
                    );
                default:
                    return true;
            }
        }

        return true;
    });

    // Group services by folder
    const servicesByFolder = {};
    filteredServices.forEach(service => {
        const folder = service.folder || 'Root';
        if (!servicesByFolder[folder]) servicesByFolder[folder] = [];
        servicesByFolder[folder].push(service);
    });
    const folderNames = Object.keys(servicesByFolder).sort();

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (err) {
            return 'Invalid date';
        }
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

    // Folder click handler
    const handleFolderClick = (folder) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folder)) newSet.delete(folder);
            else newSet.add(folder);
            return newSet;
        });
    };

    // Service click handler
    const handleServiceClick = (serviceKey) => {
        setExpandedServices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(serviceKey)) newSet.delete(serviceKey);
            else newSet.add(serviceKey);
            return newSet;
        });
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
                <div className="removed-services-header-actions">
                    <button 
                        className="removed-services-refresh" 
                        onClick={fetchData} 
                        title="Refresh"
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faSync} spin={loading} />
                    </button>
                    <button className="removed-services-close" onClick={onClose} title="Close">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
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
                {loading ? (
                    <div className="removed-services-loading">
                        <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#1976d2', marginBottom: '12px' }} />
                        <p>Loading removed services...</p>
                    </div>
                ) : error ? (
                    <div className="removed-services-error">
                        <p style={{ color: '#d32f2f', marginBottom: '12px' }}>{error}</p>
                        <button 
                            className="removed-services-retry-btn"
                            onClick={fetchData}
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredServices.length === 0 ? (
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
                        {folderNames.map(folder => (
                            <div key={folder}>
                                <div
                                    className="removed-services-folder"
                                    onClick={() => handleFolderClick(folder)}
                                >
                                    <span>
                                        {expandedFolders.has(folder) ? "▼" : "►"} {folder}
                                    </span>
                                    <span className="removed-services-folder-count">
                                        ({servicesByFolder[folder].length})
                                    </span>
                                </div>
                                {expandedFolders.has(folder) && (
                                    <div style={{ marginLeft: 18 }}>
                                        {servicesByFolder[folder].map(service => (
                                            <div key={service.key} className="removed-service-item">
                                                <div
                                                    className="removed-service-header"
                                                    onClick={() => handleServiceClick(service.key)}
                                                >
                                                    <div className="removed-service-info">
                                                        <div className="removed-service-name">
                                                            <span style={{ marginRight: '8px' }}>
                                                                {expandedServices.has(service.key) ? "▼" : "►"}
                                                            </span>
                                                            {service.label}
                                                        </div>
                                                        <div className="removed-service-meta">
                                                            <span className="removed-service-state">{service.state?.toUpperCase()}</span>
                                                            <span className="removed-service-separator">•</span>
                                                            <span className="removed-service-date">
                                                                {formatDate(service.removed_date)}
                                                            </span>
                                                            {service.removed_by && (
                                                                <>
                                                                    <span className="removed-service-separator">•</span>
                                                                    <span className="removed-service-by">by {service.removed_by}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="removed-service-actions">
                                                        <button
                                                            className="removed-service-restore-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRestore(service);
                                                            }}
                                                            title="Restore service"
                                                        >
                                                            <FontAwesomeIcon icon={faUndo} />
                                                        </button>
                                                        <button
                                                            className="removed-service-delete-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePermanentDelete(service);
                                                            }}
                                                            title="Delete permanently"
                                                        >
                                                            <FontAwesomeIcon icon={faTimes} />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {expandedServices.has(service.key) && (
                                                    <div className="removed-service-details">
                                                        {service.url && (
                                                            <div className="removed-service-url">
                                                                <strong>Service URL:</strong> {service.url}
                                                            </div>
                                                        )}
                                                        {service.layers_removed && service.layers_removed.length > 0 && (
                                                            <div className="removed-service-layers">
                                                                <div className="removed-service-layers-title">
                                                                    Removed layers ({service.layers_removed.length}):
                                                                </div>
                                                                <div style={{ marginLeft: 12 }}>
                                                                    {service.layers_removed.map((layer, layerIndex) => (
                                                                        <div key={layerIndex} className="removed-service-layer">
                                                                            <div className="removed-service-layer-name">
                                                                                {typeof layer === 'string' ? layer : layer.name}
                                                                            </div>
                                                                            {layer.sublayers && layer.sublayers.length > 0 && (
                                                                                <div className="removed-service-sublayers">
                                                                                    {layer.sublayers.map((sublayer, sublayerIndex) => (
                                                                                        <div key={sublayerIndex} className="removed-service-sublayer">
                                                                                            • {sublayer}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
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