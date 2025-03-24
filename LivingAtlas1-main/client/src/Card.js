import React, { useState } from 'react';
import Modal from 'react-modal';
import api from './api.js';
import './Card.css'; // Importing the CSS for card

function Card(props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState(props.formData);
    const [loading, setLoading] = useState(false); // Added state for loading
    const [isFavorited, setIsFavorited] = useState(false); // Track favorite state


    const handleLearnMore = () => {
        setIsModalOpen(true);
    };

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleFavoriteClick = async () => {
        setIsFavorited(prev => !prev);
        try {
            const endpoint = !isFavorited ? '/bookmarkCard' : '/unbookmarkCard';
            const formData = new FormData();
            formData.append('username', props.formData.username);
            formData.append('title', props.formData.title);
    
            await api.post(endpoint, formData);
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    const validateForm = () => {
        const requiredFields = ['username', 'email', 'title', 'category', 'latitude', 'longitude'];

        for (const field of requiredFields) {
            if (formData[field] === undefined || formData[field] === null || formData[field] === '') {
                alert(`Please fill out the ${field} field.`);
                return false;
            }

            if (typeof formData[field] === 'string' && formData[field].trim() === '') {
                alert(`The ${field} field cannot be just whitespace.`);
                return false;
            }
        }

        // Additional specific checks for certain fields
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
        const isValid = validateForm();
        if (!isValid) {
            alert("Please fill in all required fields correctly.");
            return;
        }
    
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.username);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('title', formData.title);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('funding', formData.funding);
        formDataToSend.append('org', formData.org);
        formDataToSend.append('link', formData.link);
        formDataToSend.append('tags', formData.tags);
        formDataToSend.append('latitude', formData.latitude);
        formDataToSend.append('longitude', formData.longitude);
    
        if (formData.file) {
            formDataToSend.append('file', formData.file);
        }
    
        setLoading(true);
    
        try {
            await api.post('/uploadForm', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
    
            await api.delete(`/deleteCard`, {
                params: {
                    username: props.formData.username,
                    title: props.formData.title,
                }
            });
    
            alert("Card Information Saved Please Reload The Page");
            setIsEditModalOpen(false);
    
            if (typeof props.onCardUpdate === 'function') {
                props.onCardUpdate();
            } else {
                console.error("onCardUpdate is not a function");
                // Optionally, add a page reload as a fallback if `onCardUpdate` isn’t available
                window.location.reload();
            }
    
        } catch (error) {
            console.error("Failed to save the card:", error);
            alert("Failed to save the card. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const downloadFile = async () => {
        const fileID = props.formData.fileID; // Adjust as necessary
        if (!fileID) {
            alert("No file available to download.");
            return;
        }

        try {
            const response = await api.get('/downloadFile', {
                params: { fileID },
                responseType: 'blob', // Important for file download
            });

            const contentDisposition = response.headers["content-disposition"];
            let fileName = 'file' + (props.formData.fileEXT || '.txt'); // Default file extension

            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch.length > 1) {
                    fileName = fileNameMatch[1];
                }
            }

            const fileURL = window.URL.createObjectURL(new Blob([response.data]));
            const fileLink = document.createElement('a');
            fileLink.href = fileURL;
            fileLink.setAttribute('download', fileName);
            document.body.appendChild(fileLink);
            fileLink.click();
            fileLink.parentNode.removeChild(fileLink);
            window.URL.revokeObjectURL(fileURL);
        } catch (error) {
            if (error.response && error.response.status === 422) {
                alert('File is not in the database');
            } else {
                alert('An error occurred while downloading the file');
            }
        }
    };

    const handleDelete = () => {
        api.delete(`/deleteCard`, {
            params: {
                username: props.formData.username,
                title: props.formData.title,
            }
        })
            .then(response => {
                alert("Card deleted successfully");
                props.onCardDelete(true);
            })
            .catch(error => {
                alert("Failed to delete the card");
            });
    };

    const determineBackgroundColor = () => {
        const category = props.formData.category;
        if (category) {
            if (category === 'River') {
                return '#99ccff';
            } else if (category === 'Watershed') {
                return '#ccff99';
            } else if (category === 'Places') {
                return '#ffff99';
            }
        }
        return '#fff';
    };

    const truncateDescription = (description, charLimit) => {
        if (!description) return '';
        return description.length > charLimit ? description.substring(0, charLimit) + '...' : description;
    };

    return (
        <div className="card" style={{ backgroundColor: determineBackgroundColor() }}>
            {/* Favorite Star Icon */}
            <span 
                className="favorite-icon"
                onClick={handleFavoriteClick}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
                {isFavorited ? '⭐' : '☆'}
            </span>

            <img src="/CEREO-logo.png" alt="Description of image" />
            <h2 className="card-title">{props.formData.title}</h2>
            <p className="card-text">{truncateDescription(props.formData.description, 100)}</p>

            <button className="card-button" onClick={handleLearnMore}>Learn More</button>

            {props.username && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
                    <button className="card-button" style={{ marginBottom: '10px', backgroundColor: 'red' }} onClick={handleDelete}>Delete</button>
                    <button className="card-button" style={{ backgroundColor: 'blue' }} onClick={handleEdit}>Edit</button>
                </div>
            )}

            {/* Learn More Modal */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                className="Modal"
            >
                <h2>{props.formData.title}</h2>
                <div>
                    <p className="card-text"><strong>Name:</strong> {props.formData.username}</p>
                    <p className="card-text"><strong>Email:</strong> {props.formData.email}</p>
                    <p className="card-text"><strong>Funding:</strong> {props.formData.funding}</p>
                    <p className="card-text"><strong>Organization:</strong> {props.formData.org}</p>
                    <p className="card-text"><strong>Title:</strong> {props.formData.title}</p>
                    <p className="card-text"><strong>Link:</strong> {props.formData.link}</p>
                    <p className="card-text"><strong>Description:</strong> {props.formData.description}</p>
                    <p className="card-text"><strong>Category:</strong> {props.formData.category}</p>
                    <p className="card-text"><strong>Tags:</strong> {props.formData.tags}</p>
                    <p className="card-text"><strong>Latitude:</strong> {props.formData.latitude}</p>
                    <p className="card-text"><strong>Longitude:</strong> {props.formData.longitude}</p>
                </div>

                {props.formData.fileID && (
                    <div>
                        <button className="card-button" onClick={downloadFile}>Download {props.formData.fileEXT}</button>
                    </div>
                )}

                <button className="close-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onRequestClose={() => setIsEditModalOpen(false)}
                className="Modal"
            >
                <h2>Edit Card</h2>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    saveEdits();
                }}>
                    <label>Username:
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                    <label>Email:
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                    <label>Title:
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                    <label>Category:
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select a category</option>
                            <option value="River">River</option>
                            <option value="Watershed">Watershed</option>
                            <option value="Places">Places</option>
                        </select>
                    </label>
                    <label>Description:
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>Funding:
                        <input
                            type="text"
                            name="funding"
                            value={formData.funding}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>Organization:
                        <input
                            type="text"
                            name="org"
                            value={formData.org}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>Link:
                        <input
                            type="url"
                            name="link"
                            value={formData.link}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>Tags:
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>Latitude:
                        <input
                            type="number"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                    <label>Longitude:
                        <input
                            type="number"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                    <label>File:
                        <input
                            type="file"
                            name="file"
                            onChange={(e) => setFormData(prevState => ({
                                ...prevState,
                                file: e.target.files[0]
                            }))}
                        />
                    </label>
                    <button type="submit" className="card-button" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button className="close-button" onClick={() => setIsEditModalOpen(false)}>Close</button>
                </form>
            </Modal>
        </div>
    );
}

export default Card;
