import React, { useState, useRef } from 'react';
import Modal from 'react-modal';
import mapboxgl from 'mapbox-gl';
import './FormModal.css';
import api from './api.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const FormModal = (props) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isSelectingLocation, setIsSelectingLocation] = useState(false);
    const isModalOpen = modalIsOpen || props.isOpen;
    const selectLocationMarker = useRef(null);

    const handleCloseModal = () => {
        setModalIsOpen(false);
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
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

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
                return;
            }
            validFiles.push(file);
        }
        setSelectedFiles(validFiles);
    };

    const handleThumbnailInput = (e) => {
        const file = e.target.files[0];
        if (file && ["image/png", "image/jpeg", "image/gif"].includes(file.type)) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        } else {
            alert("Invalid thumbnail format. Use PNG, JPG, or GIF.");
        }
    };

    const validateForm = () => {
        const errors = [];
        if (!formData.username.trim()) errors.push("Username is required.");
        if (!formData.name.trim()) errors.push("Name is required.");
        if (!formData.title.trim() || formData.title.length > 255) errors.push("Title is required and must be <256 chars.");
        if (!/^(-?\d+(\.\d{1,8})?)$/.test(formData.latitude)) errors.push("Latitude format is invalid.");
        if (!/^(-?\d+(\.\d{1,8})?)$/.test(formData.longitude)) errors.push("Longitude format is invalid.");
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

        // append multiple files
        if (selectedFiles.length > 0) {
            selectedFiles.forEach((file) => {
                formData2.append('files', file);
            });
        }
        
        if (thumbnailFile) formData2.append('thumbnail', thumbnailFile);

        console.log("Uploading FormData:", [...formData2.entries()]);

        api.post('/uploadForm', formData2, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(response => {
            setModalIsOpen(false);
            alert("Upload Successful");
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

        setIsSelectingLocation(true);

        map.once("click", (e) => {
            const { lat, lng } = e.lngLat;

            setFormData((prevData) => ({
                ...prevData,
                latitude: lat.toFixed(6),
                longitude: lng.toFixed(6),
            }));

            if (selectLocationMarker.current) {
                selectLocationMarker.current.remove();
            }
            selectLocationMarker.current = new mapboxgl.Marker({ color: "red" }).setLngLat([lng, lat]).addTo(map);
            setIsSelectingLocation(false);
        });
    };

    return (
        <div>
            <button className="open-form-button" onClick={() => setModalIsOpen(true)}>Upload</button>
            <Modal
                isOpen={isModalOpen}
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

                    <label>Category (required):</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} required>
                        <option value="">Select a Category</option>
                        <option value="River">River</option>
                        <option value="Watershed">Watershed</option>
                        <option value="Places">Places</option>
                    </select>

                    <label>Description:</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} />

                    <label>Funding:</label>
                    <input type="text" name="funding" value={formData.funding} onChange={handleInputChange} />

                    <label>Organization:</label>
                    <input type="text" name="org" value={formData.org} onChange={handleInputChange} />

                    <label>Link:</label>
                    <input type="text" name="link" value={formData.link} onChange={handleInputChange} />

                    <button type="button" className="location_button" onClick={handleSelectLocation}>
                        Select Location
                    </button>

                    {isSelectingLocation && (
                        <span className="select-location-message">
                            Click on the map to select location.
                        </span>
                    )}

                    <label>Latitude (required):</label>
                    <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} required />

                    <label>Longitude (required):</label>
                    <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} required />

                    <label>Tags (comma-separated):</label>
                    <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} />

                    <label>Thumbnail Image:</label>
                    <input type="file" accept="image/*" onChange={handleThumbnailInput} />
                    {thumbnailPreview && <img src={thumbnailPreview} alt="Preview" style={{ width: "100px", marginBottom: "10px" }} />}

                    <label>Upload Files:</label>
                    <input type="file" multiple onChange={handleFileInput} />

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
