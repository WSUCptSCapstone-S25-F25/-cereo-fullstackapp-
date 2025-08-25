import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import api from './api.js';
import './Card.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as solidStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as regularStar } from '@fortawesome/free-regular-svg-icons';

function Card(props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState(props.formData || {});
    const [loading, setLoading] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [thumbnail, setThumbnail] = useState(null);
    const [preview, setPreview] = useState(
        formData.thumbnail_link && formData.thumbnail_link.trim() !== ""
            ? formData.thumbnail_link
            : "/CEREO-logo.png"
    );

    useEffect(() => {
        setIsFavorited(props.isFavorited);
    }, [props.isFavorited]);

    useEffect(() => {
        if (props.formData) {
            setFormData(props.formData);
        }
    }, [props.formData]);

    useEffect(() => {
        if ((!formData.thumbnail_link || formData.thumbnail_link === "") && formData.cardID) {
            api.get(`/card/${formData.cardID}`)
                .then((res) => {
                    if (res.data.thumbnail_link) {
                        setFormData((prev) => ({ ...prev, thumbnail_link: res.data.thumbnail_link }));
                        setPreview(res.data.thumbnail_link);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching thumbnail from card ID:", err);
                });
        }
    }, [formData.thumbnail_link, formData.cardID]);

    const handleLearnMore = (e) => {
        e.stopPropagation();
        setIsModalOpen(true);
        if (props.onLearnMore) props.onLearnMore();
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        setIsEditModalOpen(true);
    };

    const handleDelete = (e) => {
        e.stopPropagation();

        if (!formData.username || !formData.title) {
            alert("Missing username or title — cannot delete card.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this card?")) return;

        api.delete(`/deleteCard`, {
            params: {
                username: formData.username,
                title: formData.title,
            }
        })
        .then(() => {
            alert("Card deleted successfully.");
            if (typeof props.onCardDelete === "function") {
                props.onCardDelete(true);
            } else {
                window.location.reload();
            }
        })
        .catch((error) => {
            console.error("Delete failed:", error);
            alert("Failed to delete the card.");
        });
    };

    const handleFavoriteClick = async (e) => {
        e.stopPropagation();

        const cardID = formData.cardID || props.cardID;
        const username = formData.viewerUsername || formData.username || props.username;

        console.log("cardID being sent:", cardID);
        console.log("username being sent:", username);

        if (!cardID) {
            console.error("Missing cardID");
            alert("Error: Cannot favorite this card — missing card ID.");
            return;
        }

        if (!username) {
            console.error("Missing username");
            alert("Error: Cannot favorite this card — missing username.");
            return;
        }

        setIsFavorited(prev => !prev);

        try {
            const endpoint = !isFavorited ? '/bookmarkCard' : '/unbookmarkCard';
            const formData = new FormData();
            formData.append('username', username);
            formData.append('cardID', cardID);

            await api.post(endpoint, formData);

            if (props.fetchBookmarks) props.fetchBookmarks();
            if (props.onBookmarkChange) props.onBookmarkChange();

        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    const validateForm = () => {
        const requiredFields = ['username', 'email', 'title', 'category', 'latitude', 'longitude'];
        for (const field of requiredFields) {
            const value = formData[field];
            if (value === undefined || value === null || value.toString().trim() === '') {
                alert(`Please fill out the ${field} field.`);
                return false;
            }
            if (field === 'latitude' && (Number(value) < -90 || Number(value) > 90)) {
                alert('Latitude must be between -90 and 90.');
                return false;
            }
            if (field === 'longitude' && (Number(value) < -180 || Number(value) > 180)) {
                alert('Longitude must be between -180 and 180.');
                return false;
            }
        }
        return true;
    };

    const saveEdits = async () => {
        if (!validateForm()) return;

        const formDataToSend = new FormData();
        Object.keys(formData).forEach((key) => {
            if (formData[key] !== undefined && formData[key] !== null) {
                formDataToSend.append(key, formData[key]);
            }
        });

        if (thumbnail) {
            formDataToSend.append('thumbnail', thumbnail);
        }

        setLoading(true);
        try {
            await api.post('/uploadForm', formDataToSend);
            await api.delete('/deleteCard', {
                params: {
                    username: props.formData.username,
                    title: props.formData.title,
                },
            });

            alert('Card Information Saved. Please reload the page.');
            setIsEditModalOpen(false);

            if (typeof props.onCardUpdate === 'function') {
                props.onCardUpdate();
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to save the card:', error);
            alert('Failed to save the card. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Add these handlers to fix the ESLint errors
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnail(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className="card">
            {/* Favorite Star Icon */}
            <span
                className={`favorite-icon ${isFavorited ? 'filled' : ''}`}
                onClick={handleFavoriteClick}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
                <FontAwesomeIcon icon={isFavorited ? solidStar : regularStar} />
            </span>

            <img
                src={
                    formData.thumbnail_link && formData.thumbnail_link.trim() !== ""
                        ? formData.thumbnail_link
                        : "/CEREO-logo.png"
                }
                alt="Card Thumbnail"
                className="card-thumbnail"
            />
            <h2 className="card-title" style={{ marginBottom: '18px' }}>{props.formData.title}</h2>
            {/* <p className="card-text">{props.formData.description}</p> */}

            <div className="card-button-row">
                <button className="card-button card-learn-more" onClick={handleLearnMore}>
                    <span className="learn-more-text">Learn More</span>
                </button>
                <button className="card-button card-edit" onClick={handleEdit}>Edit</button>
                <button className="card-button card-delete" onClick={handleDelete}>Delete</button>
            </div>

            {/* Learn More Modal */}
            <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} className="Modal">
                <h2>{props.formData.title}</h2>
                <p><strong>Name:</strong> {props.formData.username}</p>
                <p><strong>Email:</strong> {props.formData.email}</p>
                <p><strong>Funding:</strong> {props.formData.funding}</p>
                <p><strong>Organization:</strong> {props.formData.org}</p>
                <p><strong>Title:</strong> {props.formData.title}</p>
                <p>
                    <strong>Link:</strong>{' '}
                    <a href={props.formData.link} target="_blank" rel="noopener noreferrer">
                        {props.formData.link}
                    </a>
                </p>
                <p><strong>Description:</strong> {props.formData.description}</p>
                <p><strong>Category:</strong> {props.formData.category}</p>
                <p><strong>Tags:</strong> {props.formData.tags}</p>
                <p><strong>Latitude:</strong> {props.formData.latitude}</p>
                <p><strong>Longitude:</strong> {props.formData.longitude}</p>

                {props.formData.fileID && (
                    <button className="card-button" onClick={() => props.downloadFile(props.formData.fileID)}>Download {props.formData.fileEXT}</button>
                )}

                <button
                    className="close-button"
                    onClick={e => {
                        e.stopPropagation();
                        setIsModalOpen(false);
                    }}
                >
                    Close
                </button>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)} className="Modal">
                <h2>Edit Card</h2>
                <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); // Prevent bubbling to card container
                    saveEdits(); 
                }}>
                    <label>Title:<input type="text" name="title" value={formData.title || ''} onChange={handleInputChange} required /></label>
                    <label>Description:<textarea name="description" value={formData.description || ''} onChange={handleInputChange} /></label>
                    <label>Email:<input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} /></label>
                    <label>Organization:<input type="text" name="org" value={formData.org || ''} onChange={handleInputChange} /></label>
                    <label>Funding:<input type="text" name="funding" value={formData.funding || ''} onChange={handleInputChange} /></label>
                    <label>Link:<input type="text" name="link" value={formData.link || ''} onChange={handleInputChange} /></label>
                    <label>Category:<input type="text" name="category" value={formData.category || ''} onChange={handleInputChange} /></label>
                    <label>Tags:<input type="text" name="tags" value={formData.tags || ''} onChange={handleInputChange} /></label>
                    <label>Latitude:<input type="number" step="any" name="latitude" value={formData.latitude || ''} onChange={handleInputChange} /></label>
                    <label>Longitude:<input type="number" step="any" name="longitude" value={formData.longitude || ''} onChange={handleInputChange} /></label>
                    <label>Thumbnail:<input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} /></label>
                    {preview && <img src={preview} alt="Thumbnail Preview" width="100" style={{ margin: '10px 0' }} />}
                    <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            setIsEditModalOpen(false);
                        }}
                    >
                        Close
                    </button>
                </form>
            </Modal>
        </div>
    );
}

export default Card;