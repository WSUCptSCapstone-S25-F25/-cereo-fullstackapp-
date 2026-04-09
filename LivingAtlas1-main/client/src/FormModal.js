import React, { useState, useRef, useEffect } from 'react';
import Modal from 'react-modal';
import mapboxgl from 'mapbox-gl';
import './FormModal.css';
import api from './api.js';
import PolygonDrawingModal from './PolygonDrawingModal';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const FormModal = (props) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isSelectingLocation, setIsSelectingLocation] = useState(false);
    const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
    const [locationType, setLocationType] = useState('point'); // 'point' or 'polygon'
    const [polygonVertices, setPolygonVertices] = useState([]);
    const [polygonFillColor, setPolygonFillColor] = useState('#0077c0');
    const [polygonLineStyle, setPolygonLineStyle] = useState('solid');
    const isModalOpen = modalIsOpen || props.isOpen;
    const selectLocationMarker = useRef(null);

    // Apply initial polygon data from Polygon Tool flow
    useEffect(() => {
        if (props.initialPolygonData) {
            const { vertices, centroid, fillColor, lineStyle } = props.initialPolygonData;
            setLocationType('polygon');
            setPolygonVertices(vertices);
            if (fillColor) setPolygonFillColor(fillColor);
            if (lineStyle) setPolygonLineStyle(lineStyle);
            setFormData(prev => ({
                ...prev,
                latitude: centroid.lat.toFixed(6),
                longitude: centroid.lng.toFixed(6),
            }));
        }
    }, [props.initialPolygonData]);

    const handleCloseModal = () => {
        setModalIsOpen(false);
        setIsDrawingPolygon(false);
        if (selectLocationMarker.current) {
            selectLocationMarker.current.remove();
            selectLocationMarker.current = null;
        }
        if (props.onRequestClose) {
            props.onRequestClose();
        }
    };

    const [formData, setFormData] = useState({
        username: props.username || '',   // required account login
        name: '',                         // display name
        email: props.email || '',
        title: '',
        category: '',
        description: '',
        funding: '',
        org: '',
        link: '',
        tags: '',
        latitude: '',
        longitude: '',
    });

    const [selectedFiles, setSelectedFiles] = useState([]);   // <-- multiple files
    const [imageFiles, setImageFiles] = useState([]);         // multi-image upload
    const [imagePreviews, setImagePreviews] = useState([]);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];

        for (let file of files) {
            if (file.size > MAX_FILE_SIZE) {
                alert(`File "${file.name}" exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB`);
                continue;
            }
            validFiles.push(file);
        }
        setSelectedFiles(prev => [...prev, ...validFiles]);
        e.target.value = '';
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleImageInput = (e) => {
        const files = Array.from(e.target.files);
        const validImages = [];
        const validTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];

        for (let file of files) {
            if (!validTypes.includes(file.type)) {
                alert(`"${file.name}" is not a supported image format. Use PNG, JPG, GIF, or WebP.`);
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                alert(`Image "${file.name}" exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB`);
                continue;
            }
            validImages.push(file);
        }

        const newPreviews = validImages.map(f => URL.createObjectURL(f));
        setImageFiles(prev => [...prev, ...validImages]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
        e.target.value = '';
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const validateForm = () => {
        const errors = [];
        if (!formData.username.trim()) errors.push("Username is required.");
        if (!formData.name.trim()) errors.push("Name is required.");
        if (!formData.title.trim() || formData.title.length > 255) errors.push("Title is required and must be <256 chars.");
        if (locationType === 'polygon') {
            if (polygonVertices.length < 3) errors.push("Polygon must have at least 3 points.");
        } else {
            if (!/^(-?\d+(\.\d{1,8})?)$/.test(formData.latitude)) errors.push("Latitude format is invalid.");
            if (!/^(-?\d+(\.\d{1,8})?)$/.test(formData.longitude)) errors.push("Longitude format is invalid.");
        }
        if (formData.description && formData.description.length > 2000) errors.push("Description must be <2001 chars.");
        if (formData.org && formData.org.length > 255) errors.push("Org must be <256 chars.");
        if (formData.funding && formData.funding.length > 255) errors.push("Funding must be <256 chars.");
        if (formData.link && formData.link.length > 255) errors.push("Link must be <256 chars.");
        return errors;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const formErrors = validateForm();
        if (formErrors.length > 0) {
            alert(formErrors.join("\n"));
            return;
        }

        // Always use current props.username to avoid stale state
        const payload = {
            ...formData,
            username: props.username || formData.username
        };

        const formData2 = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                formData2.append(key, value);
            }
        });

        // Add location type and polygon data
        formData2.append('location_type', locationType);
        if (locationType === 'polygon' && polygonVertices.length >= 3) {
            formData2.append('polygon_coordinates', JSON.stringify(polygonVertices));
            formData2.append('polygon_fill_color', polygonFillColor);
            formData2.append('polygon_line_style', polygonLineStyle);
        }

        // append multiple files
        if (selectedFiles.length > 0) {
            selectedFiles.forEach((file) => {
                formData2.append('files', file);
            });
        }
        
        // append multiple images
        if (imageFiles.length > 0) {
            formData2.append('thumbnail', imageFiles[0]); // first image as thumbnail
            imageFiles.forEach((file) => {
                formData2.append('images', file);
            });
        }

        console.log("Uploading FormData:", [...formData2.entries()]);

        api.post('/uploadForm', formData2, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(response => {
            setModalIsOpen(false);
            alert("Upload Successful");
            // Tell the map to refresh markers & polygons immediately
            window.dispatchEvent(new CustomEvent('atlas:card-uploaded'));
        })
        .catch(error => {
            console.error("Upload error:", error.response?.data || error.message);
            alert("Upload failed.");
        });
        handleCloseModal(); 
    };

    const handleSelectLocation = () => {
        const map = window.atlasMapInstance;

        if (!map) {
            console.error("Map not found");
            return;
        }

        // Hide the modal while selecting location
        setIsSelectingLocation(true);

        const onMapClick = (e) => {
            const { lat, lng } = e.lngLat;

            // Remove previous temp marker if any
            if (selectLocationMarker.current) {
                selectLocationMarker.current.remove();
            }

            // Create popup with confirm/cancel buttons
            const popupContainer = document.createElement('div');
            popupContainer.className = 'location-select-popup';
            popupContainer.innerHTML = `
                <div style="font-size:12px;margin-bottom:6px;color:#333;">
                    ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </div>
                <div style="display:flex;gap:6px;">
                    <button class="location-select-confirm">OK</button>
                    <button class="location-select-cancel">Cancel</button>
                </div>
            `;

            const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 25,
                className: 'location-select-mapbox-popup',
            }).setDOMContent(popupContainer);

            const marker = new mapboxgl.Marker({ color: "red" })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(map);

            marker.togglePopup(); // open immediately
            selectLocationMarker.current = marker;

            // Confirm: fill form, close popup, show modal
            popupContainer.querySelector('.location-select-confirm').addEventListener('click', () => {
                setFormData((prevData) => ({
                    ...prevData,
                    latitude: lat.toFixed(6),
                    longitude: lng.toFixed(6),
                }));
                marker.remove();
                selectLocationMarker.current = null;
                setIsSelectingLocation(false);
                map.off('click', onMapClick);
            });

            // Cancel: just remove marker, let user click again
            popupContainer.querySelector('.location-select-cancel').addEventListener('click', () => {
                marker.remove();
                selectLocationMarker.current = null;
            });
        };

        map.on('click', onMapClick);

        // Store ref so we can clean up
        selectLocationMarker.current = { _onMapClick: onMapClick, remove: () => {} };
    };

    const cancelSelectLocation = () => {
        const map = window.atlasMapInstance;
        if (map && selectLocationMarker.current) {
            if (selectLocationMarker.current._onMapClick) {
                map.off('click', selectLocationMarker.current._onMapClick);
            }
            selectLocationMarker.current.remove();
            selectLocationMarker.current = null;
        }
        setIsSelectingLocation(false);
    };

    const handleStartPolygonDraw = () => {
        setIsDrawingPolygon(true);
    };

    const handlePolygonSave = (vertices, centroid, style) => {
        setPolygonVertices(vertices);
        if (style) {
            if (style.fillColor) setPolygonFillColor(style.fillColor);
            if (style.lineStyle) setPolygonLineStyle(style.lineStyle);
        }
        setFormData(prev => ({
            ...prev,
            latitude: centroid.lat.toFixed(6),
            longitude: centroid.lng.toFixed(6),
        }));
        setIsDrawingPolygon(false);
    };

    const handlePolygonCancel = () => {
        setIsDrawingPolygon(false);
    };

    const handleLocationTypeChange = (type) => {
        setLocationType(type);
        if (type === 'point') {
            setPolygonVertices([]);
        }
    };

    return (
        <div>
            {/* Floating hint when selecting location */}
            {isSelectingLocation && (
                <div className="location-select-hint">
                    <span>Click on the map to select a location</span>
                    <button type="button" onClick={cancelSelectLocation}>Cancel</button>
                </div>
            )}

            {/* Polygon drawing flow */}
            {isDrawingPolygon && (
                <PolygonDrawingModal
                    onSave={handlePolygonSave}
                    onCancel={handlePolygonCancel}
                />
            )}

            <Modal
                isOpen={isModalOpen && !isSelectingLocation && !isDrawingPolygon}
                onRequestClose={handleCloseModal}
                className="form-modal"
                overlayClassName="form-modal-overlay"
                ariaHideApp={false}
            >
                <button className="close-modal-button" onClick={handleCloseModal}>
                    &times;
                </button>
                <h2>Upload Document</h2>
                <form onSubmit={handleSubmit}>
                    <label>Author Name (required):</label>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        required 
                    />

                    <label>Email (required):</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />

                    <label>Title (required):</label>
                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />

                    <label>Category:</label>
                    <select name="category" value={formData.category} onChange={handleInputChange}>
                        <option value="">Select a Category</option>
                        <option value="River">River</option>
                        <option value="Watershed">Watershed</option>
                        <option value="Places">Places</option>
                        <option value="None">None</option>
                        <option value="Other">Other</option>
                    </select>

                    <label>Description:</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} />

                    <label>Funding:</label>
                    <input type="text" name="funding" value={formData.funding} onChange={handleInputChange} />

                    <label>Organization:</label>
                    <input type="text" name="org" value={formData.org} onChange={handleInputChange} />

                    <label>Link:</label>
                    <input type="text" name="link" value={formData.link} onChange={handleInputChange} />

                    <label>Location Type:</label>
                    <div className="form-modal-location-tabs">
                        <button
                            type="button"
                            className={`form-modal-location-tab ${locationType === 'point' ? 'active' : ''}`}
                            onClick={() => handleLocationTypeChange('point')}
                        >
                            Single Point
                        </button>
                        <button
                            type="button"
                            className={`form-modal-location-tab ${locationType === 'polygon' ? 'active' : ''}`}
                            onClick={() => handleLocationTypeChange('polygon')}
                        >
                            Polygon Area
                        </button>
                    </div>

                    {locationType === 'point' && (
                        <>
                            <button type="button" className="location_button" onClick={handleSelectLocation}>
                                Select a Location
                            </button>

                            <label>Latitude (required):</label>
                            <input
                                type="text"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleInputChange}
                                required
                            />

                            <label>Longitude (required):</label>
                            <input
                                type="text"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleInputChange}
                                required
                            />
                        </>
                    )}

                    {locationType === 'polygon' && (
                        <div className="form-modal-polygon-section">
                            <button type="button" className="location_button" onClick={handleStartPolygonDraw}>
                                {polygonVertices.length >= 3 ? 'Redraw Polygon' : 'Draw Polygon on Map'}
                            </button>
                            {polygonVertices.length >= 3 && (
                                <div className="form-modal-polygon-summary">
                                    <span className="form-modal-polygon-check">&#10003;</span>
                                    Polygon saved: {polygonVertices.length} points
                                </div>
                            )}
                        </div>
                    )}

                    <label>Tags (comma-separated):</label>
                    <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} />

                    <label>Images:</label>
                    <div
                        className="form-modal-image-upload-area"
                        onClick={() => imageInputRef.current?.click()}
                    >
                        <p>Click or drag to add images (PNG, JPG, GIF, WebP)</p>
                        <span className="form-modal-image-upload-btn">Choose Images</span>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/gif,image/webp"
                            multiple
                            onChange={handleImageInput}
                        />
                    </div>
                    {imagePreviews.length > 0 && (
                        <div className="form-modal-image-previews">
                            {imagePreviews.map((src, i) => (
                                <div key={i} className="form-modal-image-preview-item">
                                    <img src={src} alt={`preview ${i + 1}`} />
                                    <button
                                        type="button"
                                        className="form-modal-image-preview-remove"
                                        onClick={() => removeImage(i)}
                                    >&times;</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <label>Upload Files:</label>
                    <div
                        className="form-modal-file-upload-area"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <p>Click to add files (max 5 MB each)</p>
                        <span className="form-modal-image-upload-btn">Choose Files</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileInput}
                        />
                    </div>
                    {selectedFiles.length > 0 && (
                        <div className="form-modal-file-list">
                            {selectedFiles.map((file, i) => (
                                <div key={i} className="form-modal-file-item">
                                    <span>{file.name}</span>
                                    <button type="button" onClick={() => removeFile(i)}>&times;</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
                        <button type="submit">Submit</button>
                        <button type="button" className="cancel_button" onClick={handleCloseModal}>Cancel</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FormModal;
