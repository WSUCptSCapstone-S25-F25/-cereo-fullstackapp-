import React, { useState } from 'react';
import Modal from 'react-modal';
import './FormModal.css';
import api from './api.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const FormModal = (props) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        username: props.username,
        email: props.email,
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

    const [selectedFile, setSelectedFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file && file.size > MAX_FILE_SIZE) {
            alert(`File size should not exceed ${MAX_FILE_SIZE / 1024 / 1024} MB`);
            return;
        }
        setSelectedFile(file);
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

        // Re-enforce username (name) from props before submitting
        formData.name = props.username;

        const formData2 = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value) {
                formData2.append(key, value);
            }
        });

        if (selectedFile) formData2.append('file', selectedFile);
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
    };

    return (
        <div>
            <button className="open-form-button" onClick={() => setModalIsOpen(true)}>Upload</button>
            <Modal
                isOpen={props.isOpen} // Use the isOpen prop from the parent
                onRequestClose={props.onRequestClose} // Use the onRequestClose prop from the parent
                // isOpen={modalIsOpen}
                // onRequestClose={() => setModalIsOpen(false)}
                className="form-modal"
                overlayClassName="form-modal-overlay"
                ariaHideApp={false}

            >

                <button className="close-modal-button" onClick={props.onRequestClose}>
                    &times;
                </button>
                <h2>Upload Document</h2>
                <form onSubmit={handleSubmit}>
                    <label>Name (required):</label>
                    <input type="text" name="name" value={formData.name} readOnly />

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

                    <label>Latitude (required):</label>
                    <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} required />

                    <label>Longitude (required):</label>
                    <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} required />

                    <label>Tags (comma-separated):</label>
                    <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} />

                    <label>Thumbnail Image:</label>
                    <input type="file" accept="image/*" onChange={handleThumbnailInput} />
                    {thumbnailPreview && <img src={thumbnailPreview} alt="Preview" style={{ width: "100px", marginBottom: "10px" }} />}

                    <label>Upload File:</label>
                    <input type="file" onChange={handleFileInput} />

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
                        <button type="submit">Submit</button>
                        <button type="button" onClick={() => setModalIsOpen(false)}>Cancel</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FormModal;