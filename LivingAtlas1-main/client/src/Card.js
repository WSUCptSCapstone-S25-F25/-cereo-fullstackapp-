// import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import api from './api.js';
import './Card.css'; // Importing the CSS for card
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as solidStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as regularStar } from '@fortawesome/free-regular-svg-icons';

function Card(props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [formData, setFormData] = useState(props.formData || {});
    const [loading, setLoading] = useState(false); // Added state for loading
    const [isFavorited, setIsFavorited] = useState(false);

    useEffect(() => {
        setIsFavorited(props.isFavorited);      // Sync isFavorited prop with local state when prop changes (especially after refresh)

    }, [props.isFavorited]);

    useEffect(() => {
        if (props.formData) {
            setFormData(props.formData);
        }
    }, [props.formData]);

    useEffect(() => {
        if ((!formData.thumbnail_link || formData.thumbnail_link === "") && formData.cardID) {
            api.get(`/card/${formData.cardID}`).then((res) => {
                if (res.data.thumbnail_link) {
                    setFormData((prev) => ({ ...prev, thumbnail_link: res.data.thumbnail_link }));
                    setPreview(res.data.thumbnail_link);
                }
            }).catch((err) => {
                console.error("Error fetching thumbnail from card ID:", err);
            });
        }
    }, [formData.thumbnail_link, formData.cardID]);
    
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

    const handleFavoriteClick = async () => {
        const cardID = formData.cardID;
        const username = formData.viewerUsername;
    
        console.log("cardID being sent:", cardID);
        console.log("username being sent:", username);
    
        if (!cardID) {
            console.error("Missing cardID");
            return;
        }

        if (!username) {
            console.error("Missing username");
            return;
        }
    
        setIsFavorited(prev => !prev);
    
        try {
            const endpoint = !isFavorited ? '/bookmarkCard' : '/unbookmarkCard';
            const formData = new FormData();
            formData.append('username', username);
            formData.append('cardID', cardID);

            console.log("[Bookmarking] Sending cardID:", cardID, "username:", username);

    
            await api.post(endpoint, formData);

            // Refresh bookmark data to keep UI in sync
            if (props.fetchBookmarks) {
                props.fetchBookmarks();
            }
            
            if (props.onBookmarkChange) {
                props.onBookmarkChange();
            }

        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };
    
    
    

    const validateForm = () => {
        const requiredFields = ['username', 'email', 'title', 'category', 'latitude', 'longitude'];
        for (const field of requiredFields) {
            const value = formData[field];
    
            // Safely convert everything to string before trimming
            if (value === undefined || value === null || value.toString().trim() === '') {
                alert(`Please fill out the ${field} field.`);
                return false;
            }
    
            // Additional numeric checks
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
    
        // Append all form fields
        Object.keys(formData).forEach((key) => {
            if (formData[key] !== undefined && formData[key] !== null) {
                formDataToSend.append(key, formData[key]);
            }
        });
    
        // Append thumbnail if selected
        if (thumbnail) {
            formDataToSend.append('thumbnail', thumbnail);
        }
    
        setLoading(true);
        try {
            // DO NOT set Content-Type manually — let Axios handle it
            await api.post('/uploadForm', formDataToSend);
    
            // Optionally delete the old version
            await api.delete('/deleteCard', {
                params: {
                    username: props.formData.username,
                    title: props.formData.title,
                },
            });
    
            alert('Card Information Saved. Please reload the page.');
            setIsEditModalOpen(false);
    
            // Call card update handler if provided
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

  /*
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
*/
    const handleDelete = () => {
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
/*
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

    */
  
    console.log("formData in Card:", formData);


    return (
//         <div className="card" style={{ backgroundColor: determineBackgroundColor() }}>
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
            <h2 className="card-title">{props.formData.title}</h2>
            <p className="card-text">{props.formData.description}</p>
            <button className="card-button" onClick={handleLearnMore}>Learn More</button>
            {props.username && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
                    <button 
                        className="card-button" 
                        style={{ marginBottom: '10px', 
                        backgroundColor: 'red' }} 
                        onClick={handleDelete}>
                            Delete
                        </button>
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

                    <label>Title:
                    <input type="text" name="title" value={formData.title || ''} onChange={handleInputChange} required />
                    </label>

                    <label>Description:
                    <textarea name="description" value={formData.description || ''} onChange={handleInputChange} />
                    </label>

                    <label>Email:
                    <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} />
                    </label>

                    <label>Organization:
                    <input type="text" name="org" value={formData.org || ''} onChange={handleInputChange} />
                    </label>

                    <label>Funding:
                    <input type="text" name="funding" value={formData.funding || ''} onChange={handleInputChange} />
                    </label>

                    <label>Link:
                    <input type="text" name="link" value={formData.link || ''} onChange={handleInputChange} />
                    </label>

                    <label>Category:
                    <input type="text" name="category" value={formData.category || ''} onChange={handleInputChange} />
                    </label>

                    <label>Tags:
                    <input type="text" name="tags" value={formData.tags || ''} onChange={handleInputChange} />
                    </label>

                    <label>Latitude:
                    <input type="number" step="any" name="latitude" value={formData.latitude || ''} onChange={handleInputChange} />
                    </label>

                    <label>Longitude:
                    <input type="number" step="any" name="longitude" value={formData.longitude || ''} onChange={handleInputChange} />
                    </label>

                    <label>Thumbnail:
                    <input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} />
                    </label>

                    {preview && <img src={preview} alt="Thumbnail Preview" width="100" style={{ margin: '10px 0' }} />}

                    <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setIsEditModalOpen(false)}>Close</button>
                </form>
                </Modal>
        </div>
    );
}

export default Card;