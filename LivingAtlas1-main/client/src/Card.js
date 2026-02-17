import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import api from './api.js';
import './Card.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark as solidBookmark } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as regularBookmark } from '@fortawesome/free-regular-svg-icons';

function Card(props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        ...props.formData,
        files: props.formData?.files || [],      // <-- ensure files array always exists
        filesToUpload: []                        // <-- temp storage for new uploads
    });
    const [loading, setLoading] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [thumbnail, setThumbnail] = useState(null);
    const [preview, setPreview] = useState(
        formData.thumbnail_link && formData.thumbnail_link.trim() !== ""
            ? formData.thumbnail_link
            : "/CEREO-logo.png"
    );

    useEffect(() => {
        setFormData({
            ...props.formData,
            files: props.formData?.files || [],
            filesToUpload: []
        });
    }, [props.formData]);

    useEffect(() => {
        setIsFavorited(props.isFavorited);
    }, [props.isFavorited]);

    // Ensure username and name always have safe defaults
    // Now handled by handleEdit
    /* useEffect(() => {
        if (props.formData) {
            setFormData({
                ...props.formData,
                username: props.formData.username || '',
                name: props.formData.name || '',
                files: props.formData.files || [],
                filesToUpload: []
            });
        }
    }, [props.formData]); */

    useEffect(() => {
        if ((!formData.thumbnail_link || formData.thumbnail_link === "") && formData.cardID) {
            api.get(`/card/${formData.cardID}`)
                .then((res) => {
                    if (res.data.thumbnail_link) {
                        setFormData((prev) => ({ ...prev, thumbnail_link: res.data.thumbnail_link }));
                        const previewThumbnail = formData.thumbnail_link || "/CEREO-logo.png";
                        setPreview(previewThumbnail);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching thumbnail from card ID:", err);
                });
        }
    }, [formData.thumbnail_link, formData.cardID]);

    const handleLearnMore = (e) => {
        e.stopPropagation();
        props.onZoom?.();
        setIsModalOpen(true);
        if (props.onLearnMore) props.onLearnMore();
    };
  
    const handleEdit = (e) => {
        e.stopPropagation();
        setFormData({ 
            ...props.formData,
            original_username: props.formData.username, 
            original_email: props.formData.email,
        });
        /*
        setFormData(prev => ({ 
            ...prev, 
            original_username: prev.username, 
            original_email: prev.email,
            filesToUpload: [] // reset upload buffer when editing
        }));
        */
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

        try {
            const endpoint = !isFavorited ? '/bookmarkCard' : '/unbookmarkCard';
            const formData = new FormData();
            formData.append('username', username);
            formData.append('cardID', cardID);

            await api.post(endpoint, formData);

            setIsFavorited(prev => !prev);

            if (props.fetchBookmarks) props.fetchBookmarks();
            if (props.onBookmarkChange) props.onBookmarkChange();

        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    const validateForm = () => {
        const requiredFields = ['username', 'name', 'email', 'title', 'category', 'latitude', 'longitude'];
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

    // Extra guard for username and name
    if (!formData.username?.trim() || !formData.name?.trim()) {
        alert("Both Username and name are required.");
        return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
        if (
            key !== "files" && key !== "filesToUpload" && // don’t accidentally append arrays
            formData[key] !== undefined && formData[key] !== null
        ) {
            formDataToSend.append(key, formData[key]);
        }
    });

    //Only true if editing an existing card
    formDataToSend.append("update", !!formData.cardID);

    // Always include originals, fallback to current for new cards
    formDataToSend.append(
        "original_username",
        formData.original_username || formData.username
    );
    formDataToSend.append(
        "original_email",
        formData.original_email || formData.email
    );

    // NEW: If no new thumbnail selected, keep the existing one
    if (formData.thumbnail_link && !thumbnail) {
        formDataToSend.append("thumbnail_link", formData.thumbnail_link);
    }

    // If user uploaded a new thumbnail, append it as usual
    if (thumbnail) {
        formDataToSend.append("thumbnail", thumbnail);
    }

    // Append multiple files safely
    if (formData.filesToUpload && formData.filesToUpload.length > 0) {
        formData.filesToUpload.forEach((file) => {
            formDataToSend.append("files", file);
        });
    }

    setLoading(true);
    try {
        await api.post("/uploadForm", formDataToSend);
        alert("Card Information Saved. Please reload the page.");
        setIsEditModalOpen(false);

        if (typeof props.onCardUpdate === "function") {
            props.onCardUpdate();
        } else {
            window.location.reload();
        }
    } catch (error) {
        console.error("Failed to save the card:", error);
        
        // Extract detailed error message from backend response
        let errorMessage = "Failed to save the card. Please try again.";
        if (error.response?.data?.detail) {
            errorMessage = `Error: ${error.response.data.detail}`;
        } else if (error.response?.data?.message) {
            errorMessage = `Error: ${error.response.data.message}`;
        } else if (error.message) {
            errorMessage = `Error: ${error.message}`;
        }
        
        console.error("Error details:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        
        alert(errorMessage);
    } finally {
        setLoading(false);
    }
};


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
            {/* Favorite Bookmark Icon */}
            <span
                className={`favorite-icon ${isFavorited ? 'filled' : ''}`}
                onClick={handleFavoriteClick}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
                <FontAwesomeIcon icon={isFavorited ? solidBookmark : regularBookmark} />
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
            <h2 className="card-title" style={{ marginBottom: '18px' }}>{formData.title}</h2>

            <div className="card-button-row">
                <button className="card-button card-learn-more" onClick={handleLearnMore}>
                    <span className="learn-more-text">Learn More</span>
                </button>
                <button className="card-button card-edit" onClick={handleEdit}>Edit</button>
                <button className="card-button card-delete" onClick={handleDelete}>Delete</button>
            </div>

            {/* Learn More Modal */}
            <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} className="Modal">
                <h2>{formData.title}</h2>
                <p><strong>Author:</strong> {formData.name}</p>
                <p><strong>Card Creator:</strong> {formData.username}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Funding:</strong> {formData.funding}</p>
                <p><strong>Organization:</strong> {formData.org}</p>
                <p><strong>Title:</strong> {formData.title}</p>
                <p>
                    <strong>Link:</strong>{' '}
                    <a href={formData.link} target="_blank" rel="noopener noreferrer">
                        {formData.link}
                    </a>
                </p>
                <p><strong>Description:</strong> {formData.description}</p>
                <p><strong>Category:</strong> {formData.category}</p>
                <p><strong>Tags:</strong> {formData.tags}</p>
                <p><strong>Latitude:</strong> {formData.latitude}</p>
                <p><strong>Longitude:</strong> {formData.longitude}</p>

                {/* Downloadable Files */}
                {formData.files && formData.files.length > 0 && (
                    <div className="file-list">
                        <h3>Downloadable Files:</h3>
                        <ul>
                            {formData.files.map((file, idx) => (
                                <li key={file.fileid || idx}>
                                    <a
                                        href={file.file_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {file.filename || `Download ${file.fileextension}`}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
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

            {/* Edit/Create Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onRequestClose={() => setIsEditModalOpen(false)}
                shouldCloseOnOverlayClick={false}
                className="Modal"
            >
                <h2>{formData.cardID ? "Edit Card" : "Create Card"}</h2>
                <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    saveEdits(); 
                }}>
                    <label>Card Creator:
                        <input type="text" name="username" value={formData.username || ''} onChange={handleInputChange} required />
                    </label>
                    <label>Author:
                        <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} required />
                    </label>
                    <label>
                        Full Name:
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ""}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                    <label>
                        Email:
                        <input
                            type="email"
                            name="email"
                            value={formData.email || ""}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                    <label>
                        Title:
                        <input
                            type="text"
                            name="title"
                            value={formData.title || ""}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                    <label>
                        Description:
                        <textarea
                            name="description"
                            value={formData.description || ""}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>
                        Organization:
                        <input
                            type="text"
                            name="org"
                            value={formData.org || ""}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>
                        Funding:
                        <input
                            type="text"
                            name="funding"
                            value={formData.funding || ""}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>
                        Link:
                        <input
                            type="text"
                            name="link"
                            value={formData.link || ""}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>
                        Category:
                        <input
                            type="text"
                            name="category"
                            value={formData.category || ""}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>
                        Tags:
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags || ""}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>
                        Latitude:
                        <input
                            type="number"
                            step="any"
                            name="latitude"
                            value={formData.latitude || ""}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>
                        Longitude:
                        <input
                            type="number"
                            step="any"
                            name="longitude"
                            value={formData.longitude || ""}
                            onChange={handleInputChange}
                        />
                    </label>

                    {/* Thumbnail Management */}
                    <div className="thumbnail-section">
                        <label>Thumbnail:</label>
                        {preview && (
                            <div className="thumbnail-preview">
                                <img
                                    src={preview}
                                    alt="Thumbnail Preview"
                                    width="120"
                                    style={{
                                        marginBottom: "10px",
                                        borderRadius: "6px",
                                    }}
                                />
                                <div className="thumbnail-buttons">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            document
                                                .getElementById(
                                                    `thumbnailInput-${formData.cardID || "new"}`
                                                )
                                                .click()
                                        }
                                    >
                                        Change
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setThumbnail(null);
                                            setPreview("/CEREO-logo.png");
                                            setFormData((prev) => ({
                                                ...prev,
                                                thumbnail_link: "",
                                            }));
                                        }}
                                    >
                                        Delete / Reset to Default
                                    </button>
                                </div>
                            </div>
                        )}
                        <input
                            id={`thumbnailInput-${formData.cardID || "new"}`}
                            type="file"
                            accept="image/png, image/jpeg, image/gif"
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                        />
                    </div>

                    {/* Existing Attached Files */}
                    {formData.files && formData.files.length > 0 && (
                        <div className="attached-files">
                            <h4>Attached Files:</h4>
                            <ul>
                                {formData.files.map((file, idx) => (
                                    <li key={file.fileid || idx}>
                                        <a
                                            href={file.file_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {file.filename}
                                        </a>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (
                                                    window.confirm(
                                                        `Delete file "${file.filename}"?`
                                                    )
                                                ) {
                                                    try {
                                                        await api.delete(
                                                            `/deleteFile?fileID=${file.fileid}`
                                                        );
                                                        alert(`Deleted ${file.filename}`);
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            files: prev.files.filter(
                                                                (f) =>
                                                                    f.fileid !== file.fileid
                                                            ),
                                                        }));
                                                    } catch (err) {
                                                        console.error(
                                                            "Error deleting file:",
                                                            err
                                                        );
                                                        alert("Failed to delete file.");
                                                    }
                                                }
                                            }}
                                            style={{ marginLeft: "10px" }}
                                        >
                                            Delete
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Upload New Files */}
                    <label>
                        Add New Files:
                        <input
                            type="file"
                            name="files"
                            multiple
                            onChange={(e) => {
                                const selectedFiles = Array.from(e.target.files);
                                setFormData((prev) => ({
                                    ...prev,
                                    filesToUpload: selectedFiles,
                                }));
                            }}
                        />
                    </label>

                    {/* Hidden original fields */}
                    <input
                        type="hidden"
                        name="original_username"
                        value={formData.original_username || ""}
                    />
                    <input
                        type="hidden"
                        name="original_email"
                        value={formData.original_email || ""}
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
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
