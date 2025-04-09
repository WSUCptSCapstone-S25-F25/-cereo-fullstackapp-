import React, { useState } from 'react';
import Modal from 'react-modal';
import api from './api.js';
import './Card.css'; // Importing the CSS for card

function Card(props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState(props.formData);
    const [loading, setLoading] = useState(false);
    const [thumbnail, setThumbnail] = useState(null);
    const [preview, setPreview] = useState(
        formData.thumbnail_link && formData.thumbnail_link.trim() !== ""
            ? formData.thumbnail_link
            : "/CEREO-logo.png"
    );
    console.log("Resolved preview image:", preview);
    console.log("Form data thumbnail_link:", formData.thumbnail_link);

    const handleLearnMore = () => setIsModalOpen(true);
    const handleEdit = () => setIsEditModalOpen(true);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file && ["image/png", "image/jpeg", "image/gif"].includes(file.type)) {
            setThumbnail(file);
            setPreview(URL.createObjectURL(file));
        } else {
            alert("Invalid file type. Please upload a PNG, JPG, or GIF.");
        }
    };

    const validateForm = () => {
        const requiredFields = ['username', 'email', 'title', 'category', 'latitude', 'longitude'];
        for (const field of requiredFields) {
            if (!formData[field] || formData[field].trim() === '') {
                alert(`Please fill out the ${field} field.`);
                return false;
            }
        }
        if (formData.latitude < -90 || formData.latitude > 90) {
            alert('Latitude must be between -90 and 90.');
            return false;
        }
        if (formData.longitude < -180 || formData.longitude > 180) {
            alert('Longitude must be between -180 and 180.');
            return false;
        }
        return true;
    };

    const saveEdits = async () => {
        if (!validateForm()) return;

        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => formDataToSend.append(key, formData[key]));
        if (thumbnail) formDataToSend.append('thumbnail', thumbnail);

        setLoading(true);
        try {
            await api.post('/uploadForm', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
            await api.delete(`/deleteCard`, {
                params: { username: props.formData.username, title: props.formData.title }
            });

            alert("Card Information Saved. Please reload the page.");
            setIsEditModalOpen(false);
            if (typeof props.onCardUpdate === 'function') {
                props.onCardUpdate();
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to save the card:", error);
            alert("Failed to save the card. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <img src={preview} alt="Card Thumbnail" />
            <h2 className="card-title">{props.formData.title}</h2>
            <p className="card-text">{props.formData.description}</p>
            <button className="card-button" onClick={handleLearnMore}>Learn More</button>
            {props.username && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
                    <button className="card-button" style={{ marginBottom: '10px', backgroundColor: 'red' }} onClick={props.onDelete}>Delete</button>
                    <button className="card-button" style={{ backgroundColor: 'blue' }} onClick={handleEdit}>Edit</button>
                </div>
            )}

            {/* Learn More Modal */}
            <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} className="Modal">
                <h2>{props.formData.title}</h2>
                <p><strong>Name:</strong> {props.formData.username}</p>
                <p><strong>Email:</strong> {props.formData.email}</p>
                <p><strong>Funding:</strong> {props.formData.funding}</p>
                <p><strong>Organization:</strong> {props.formData.org}</p>
                <p><strong>Title:</strong> {props.formData.title}</p>
                <p><strong>Link:</strong> {props.formData.link}</p>
                <p><strong>Description:</strong> {props.formData.description}</p>
                <p><strong>Category:</strong> {props.formData.category}</p>
                <p><strong>Tags:</strong> {props.formData.tags}</p>
                <p><strong>Latitude:</strong> {props.formData.latitude}</p>
                <p><strong>Longitude:</strong> {props.formData.longitude}</p>

                {props.formData.fileID && (
                    <button className="card-button" onClick={() => props.downloadFile(props.formData.fileID)}>Download {props.formData.fileEXT}</button>
                )}

                <button className="close-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)} className="Modal">
                <h2>Edit Card</h2>
                <form onSubmit={(e) => { e.preventDefault(); saveEdits(); }}>
                    <label>Title: <input type="text" name="title" value={formData.title} onChange={handleInputChange} required /></label>
                    <label>Description: <textarea name="description" value={formData.description} onChange={handleInputChange} /></label>
                    <label>Thumbnail: <input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} /></label>
                    {preview && <img src={preview} alt="Thumbnail Preview" width="100" />}
                    <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setIsEditModalOpen(false)}>Close</button>
                </form>
            </Modal>
        </div>
    );
}

export default Card;