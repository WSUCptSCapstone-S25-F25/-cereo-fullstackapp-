import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import api from './api.js';
import './Card.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as solidHeart, faMagnifyingGlass, faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart } from '@fortawesome/free-regular-svg-icons';

const CARD_CATEGORIES = ['River', 'Watershed', 'Places'];

function Card(props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [isLearnMoreEditMode, setIsLearnMoreEditMode] = useState(false);
    const [isAllImagesView, setIsAllImagesView] = useState(false);
    const [selectedAllImageIDs, setSelectedAllImageIDs] = useState([]);
    const [pendingDeletedImageIDs, setPendingDeletedImageIDs] = useState([]);
    const [learnMoreBackup, setLearnMoreBackup] = useState(null);
    const [isImageMutationLoading, setIsImageMutationLoading] = useState(false);
    const [pendingImageSlotIndex, setPendingImageSlotIndex] = useState(null);
    const [sessionUploadedImageIDs, setSessionUploadedImageIDs] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const isEditingRef = useRef(false); // Track editing state across renders
    const learnMoreImageInputRef = useRef(null);
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
        // Completely ignore prop updates while editing
        if (!isEditingRef.current) {
            setFormData((prev) => {
                const incomingCardID = props.formData?.cardID;
                const isSameCard = prev?.cardID === incomingCardID;
                const incomingHasImages = Array.isArray(props.formData?.images) && props.formData.images.length > 0;
                const prevHasImages = Array.isArray(prev?.images) && prev.images.length > 0;

                const mergedImages = (isSameCard && !incomingHasImages && prevHasImages)
                    ? prev.images
                    : (props.formData?.images || []);

                return {
                    ...props.formData,
                    images: mergedImages,
                    files: props.formData?.files || [],
                    filesToUpload: []
                };
            });
            setPreview(
                props.formData?.thumbnail_link && props.formData.thumbnail_link.trim() !== ""
                    ? props.formData.thumbnail_link
                    : "/CEREO-logo.png"
            );
        }
    }, [props.formData]);

    useEffect(() => {
        setIsFavorited(props.isFavorited);
    }, [props.isFavorited]);

    useEffect(() => {
        if (props.forceOpenLearnMoreSignal) {
            setIsModalOpen(true);
        }
    }, [props.forceOpenLearnMoreSignal]);

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

    const handleLearnMore = (e) => {
        e.stopPropagation();
        setIsLearnMoreEditMode(false);
        setIsAllImagesView(false);
        setIsModalOpen(true);
        if (props.onLearnMore) props.onLearnMore();
    };

    const handleZoom = (e) => {
        e.stopPropagation();
        props.onZoom?.();
    };

    const handleOpenImagePreview = (e) => {
        e.stopPropagation();
        setIsImagePreviewOpen(true);
    };
  
    const handleEdit = (e) => {
        e.stopPropagation();
        isEditingRef.current = true; // Lock editing state
        setFormData({ 
            ...props.formData,
            original_username: props.formData.username, 
            original_email: props.formData.email,
            original_title: props.formData.title,
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

    const saveEdits = async (options = {}) => {
     const { skipReload = false, closeEditModal = true } = options;
    if (!validateForm()) return;

    // Extra guard for username and name
    if (!formData.username?.trim() || !formData.name?.trim()) {
        alert("Both Username and name are required.");
        return;
    }

    // Validate username exists if it was changed
    if (formData.original_username && formData.username !== formData.original_username) {
        try {
            await api.get(`/profileAccount?username=${encodeURIComponent(formData.username)}`);
        } catch (error) {
            if (error.response?.status === 404) {
                alert(`Card Creator "${formData.username}" does not exist. Please use a valid username.`);
                return;
            }
        }
    }

    let effectiveThumbnailLink = formData.thumbnail_link || '';
    if (!thumbnail && Array.isArray(formData.images) && formData.images.length > 0) {
        const firstImage = formData.images[0];
        const firstImageUrl = typeof firstImage === 'string'
            ? firstImage
            : (firstImage?.url || firstImage?.imageURL || '');

        if (firstImageUrl) {
            effectiveThumbnailLink = firstImageUrl;
        }
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
        if (
            key !== "files" &&
            key !== "filesToUpload" &&
            key !== "images" &&
            key !== "thumbnail_link" &&
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
    formDataToSend.append(
        "original_title",
        formData.original_title || formData.title
    );

    // NEW: If no new thumbnail selected, keep the existing one
    if (effectiveThumbnailLink && !thumbnail) {
        formDataToSend.append("thumbnail_link", effectiveThumbnailLink);
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
        alert("Card Information Saved.");
        isEditingRef.current = false; // Unlock editing state
        if (closeEditModal) {
            setIsEditModalOpen(false);
        }

        if (typeof props.onCardUpdate === "function") {
            props.onCardUpdate();
        } else if (!skipReload) {
            window.location.reload();
        }
        return true;
    } catch (error) {
        console.error("Failed to save the card:", error);
        
        // Extract detailed error message from backend response
        let errorMessage = "Failed to save the card. Please try again.";
        const detail = error.response?.data?.detail;
        const detailText = typeof detail === "string" ? detail : "";

        if (detailText.includes("Card Creator username does not exist")) {
            errorMessage = "Card Creator does not exist. Please enter an existing username.";
        } else if (detailText.includes("Card not found for update")) {
            errorMessage = "Could not save because the original card was not found. If you changed the Title, close and reopen Edit, then try again.";
        } else if (detailText) {
            errorMessage = `Error: ${detailText}`;
        } else if (error.response?.data?.message) {
            errorMessage = `Error: ${error.response.data.message}`;
        } else if (error.response?.status === 404) {
            errorMessage = "Unable to save: card or card creator was not found.";
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
        return false;
    } finally {
        setLoading(false);
    }
};

    const handleLearnMoreEditStart = (e) => {
        e.stopPropagation();
        setLearnMoreBackup({ ...formData });
        setSessionUploadedImageIDs([]);
        setSelectedAllImageIDs([]);
        setPendingDeletedImageIDs([]);
        setFormData((prev) => ({
            ...prev,
            original_username: prev.original_username || prev.username,
            original_email: prev.original_email || prev.email,
            original_title: prev.original_title || prev.title,
        }));
        isEditingRef.current = true;
        setIsLearnMoreEditMode(true);

        if (formData.cardID || props.cardID) {
            refreshCardImages().catch((error) => {
                console.error('Failed to refresh card images:', error);
            });
        }
    };

    const rollbackSessionUploads = async () => {
        if (sessionUploadedImageIDs.length === 0) return;

        for (const imageID of sessionUploadedImageIDs) {
            try {
                await api.delete(`/deleteCardImage/${imageID}`);
            } catch (error) {
                console.error('Failed to rollback uploaded image:', imageID, error);
            }
        }

        setSessionUploadedImageIDs([]);
    };

    const handleLearnMoreEditCancel = async (e) => {
        if (e?.stopPropagation) e.stopPropagation();
        if (isImageMutationLoading) return;

        setIsImageMutationLoading(true);
        await rollbackSessionUploads();

        if (learnMoreBackup) {
            setFormData(learnMoreBackup);
        }

        isEditingRef.current = false;
        setIsLearnMoreEditMode(false);
        setPendingImageSlotIndex(null);
        setSelectedAllImageIDs([]);
        setPendingDeletedImageIDs([]);
        setIsImageMutationLoading(false);
    };

    const applyPendingImageDeletes = async () => {
        if (!pendingDeletedImageIDs.length) return;

        const uniqueIDs = [...new Set(pendingDeletedImageIDs)].filter((id) => Number.isInteger(id) && id > 0);
        if (!uniqueIDs.length) return;

        for (const imageID of uniqueIDs) {
            await api.delete(`/deleteCardImage/${imageID}`);
        }

        setSessionUploadedImageIDs((prev) => prev.filter((id) => !uniqueIDs.includes(id)));
        setPendingDeletedImageIDs([]);
        setSelectedAllImageIDs([]);
    };

    const applyImageReordering = async () => {
        const cardID = formData.cardID || props.cardID;
        const images = formData.images || [];
        
        if (!images.length || !cardID) return;

        // Extract imageIDs in current order, filtering out temporary records
        const imageOrder = images
            .map((img) => resolveImageServerID(img))
            .filter((id) => id !== null);

        if (!imageOrder.length) return;

        try {
            const response = await api.put(`/reorderCardImages?cardID=${cardID}`, imageOrder);
            console.log('Image reordering successful:', response.data);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
            console.error('Failed to reorder images:', errorMsg);
            alert(`Failed to save image order: ${errorMsg}`);
        }
    };

    const handleLearnMoreEditSave = async (e) => {
        e.stopPropagation();
        const success = await saveEdits({ skipReload: true, closeEditModal: false });
        if (success) {
            try {
                await applyPendingImageDeletes();
            } catch (error) {
                console.error('Failed to apply pending image deletions:', error);
                alert('Some selected images could not be deleted. Please try saving again.');
            }
            try {
                await applyImageReordering();
            } catch (error) {
                console.error('Failed to apply image reordering:', error);
                alert('Warning: Image reordering may not have been saved.');
            }
            await refreshCardRecord();
            await refreshCardImages();
            setIsLearnMoreEditMode(false);
            setLearnMoreBackup(null);
            setSessionUploadedImageIDs([]);
            setSelectedAllImageIDs([]);
            setPendingDeletedImageIDs([]);
        }
    };

    const handleLearnMoreClose = async (e) => {
        if (e?.stopPropagation) e.stopPropagation();

        if (isLearnMoreEditMode) {
            await handleLearnMoreEditCancel(e);
        }

        setIsAllImagesView(false);
        setIsModalOpen(false);
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

    const resolveImageUrl = (url) => {
        if (!url) return "/CEREO-logo.png";
        if (/^https?:\/\//i.test(url)) return url;

        const baseURL = (api.defaults.baseURL || "").replace(/\/$/, "");
        if (!baseURL) return url;

        return url.startsWith('/') ? `${baseURL}${url}` : `${baseURL}/${url}`;
    };

    const normalizeImageRecord = (image, fallbackId = 0) => {
        if (typeof image === 'string') {
            return {
                id: fallbackId,
                imageID: null,
                url: resolveImageUrl(image),
                alt: ''
            };
        }

        if (!image || typeof image !== 'object') {
            return {
                id: fallbackId,
                imageID: null,
                url: '/CEREO-logo.png',
                alt: ''
            };
        }

        return {
            ...image,
            id: image.id ?? image.imageID ?? image.imageId ?? fallbackId,
            imageID: image.imageID ?? image.imageId ?? image.id ?? null,
            url: resolveImageUrl(image.url || image.imageURL || image.thumbnail_link || ''),
            alt: image.alt || image.altText || ''
        };
    };

    const refreshCardImages = async (preferredIndex = null) => {
        const rawCardID = formData.cardID || props.cardID;
        const cardID = Number(rawCardID);
        if (!Number.isInteger(cardID) || cardID <= 0) return;

        const response = await api.get(`/cardImages/${cardID}`);
        const freshImages = (response.data?.images || []).map((img, idx) => normalizeImageRecord(img, idx));

        setFormData((prev) => ({
            ...prev,
            images: freshImages
        }));

        setCurrentImageIndex((prev) => {
            if (freshImages.length === 0) return 0;
            if (typeof preferredIndex === 'number') {
                return Math.max(0, Math.min(preferredIndex, freshImages.length - 1));
            }
            return Math.min(prev, freshImages.length - 1);
        });
    };

    const refreshCardRecord = async () => {
        const rawCardID = formData.cardID || props.cardID;
        const cardID = Number(rawCardID);
        if (!Number.isInteger(cardID) || cardID <= 0) return;

        try {
            const response = await api.get('/allCards');
            const cards = response?.data?.data || [];
            const latestCard = cards.find((card) => Number(card.cardID) === cardID);

            if (!latestCard) return;

            setFormData((prev) => ({
                ...prev,
                ...latestCard,
                files: latestCard.files || [],
                images: latestCard.images || prev.images || [],
                filesToUpload: []
            }));
        } catch (error) {
            console.error('Failed to refresh card data:', error);
        }
    };

    const handleLearnMoreGalleryTileClick = (e, image, slotIndex) => {
        e.stopPropagation();

        if (image) {
            openImagePreviewAtIndex(e, slotIndex);
            return;
        }

        if (!isLearnMoreEditMode || isImageMutationLoading) return;

        setPendingImageSlotIndex(slotIndex);
        if (learnMoreImageInputRef.current) {
            learnMoreImageInputRef.current.click();
        }
    };

    const handleLearnMoreImageUpload = async (e) => {
        e.stopPropagation();
        const file = e.target.files?.[0];
        e.target.value = '';

        if (!file) return;

        const cardID = formData.cardID || props.cardID;
        if (!cardID) {
            alert('Unable to add images because card ID is missing.');
            return;
        }

        setIsImageMutationLoading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('cardID', cardID);
            uploadFormData.append('altText', file.name || `Card image ${(pendingImageSlotIndex ?? 0) + 1}`);
            uploadFormData.append('image', file);
            const uploadResponse = await api.post('/uploadCardImage', uploadFormData);
            const uploadedImageID = uploadResponse?.data?.imageID;

            if (uploadedImageID) {
                setSessionUploadedImageIDs((prev) => [...prev, uploadedImageID]);
            }

            await refreshCardImages(pendingImageSlotIndex);
        } catch (error) {
            console.error('Failed to upload card images:', error);
            alert('Failed to upload image.');
        } finally {
            setIsImageMutationLoading(false);
            setPendingImageSlotIndex(null);
        }
    };

    const handleLearnMoreImageDelete = async (e, image) => {
        e.stopPropagation();

        if (isImageMutationLoading) return;

        if (!image?.imageID) {
            alert('This image cannot be deleted because no image ID was found.');
            return;
        }

        if (!window.confirm('Delete this image?')) return;

        setIsImageMutationLoading(true);
        try {
            await api.delete(`/deleteCardImage/${image.imageID}`);
            setSessionUploadedImageIDs((prev) => prev.filter((id) => id !== image.imageID));
            await refreshCardImages();
        } catch (error) {
            console.error('Failed to delete card image:', error);
            alert('Failed to delete image.');
        } finally {
            setIsImageMutationLoading(false);
        }
    };

    const displayCardData = isLearnMoreEditMode && learnMoreBackup ? learnMoreBackup : formData;

    const cardThumbnailSrc =
        displayCardData.thumbnail_link && displayCardData.thumbnail_link.trim() !== ""
            ? resolveImageUrl(displayCardData.thumbnail_link)
            : "/CEREO-logo.png";

    const cardImageList = displayCardData.images && Array.isArray(displayCardData.images) && displayCardData.images.length > 0
        ? displayCardData.images.map((img, idx) => normalizeImageRecord(img, idx))
        : [{ url: cardThumbnailSrc, id: 0 }];

    // Multi-image support: use images array if available, otherwise fall back to single thumbnail
    const imageList = formData.images && Array.isArray(formData.images) && formData.images.length > 0
        ? formData.images.map((img, idx) => normalizeImageRecord(img, idx))
        : [{ url: cardThumbnailSrc, id: 0 }];

    const allImagesList = imageList;

    const resolveImageServerID = (image) => {
        const imageID = Number(image?.imageID ?? image?.imageId ?? null);
        return Number.isInteger(imageID) && imageID > 0 ? imageID : null;
    };

    const toggleAllImageSelection = (e, image) => {
        e.stopPropagation();
        const imageID = resolveImageServerID(image);
        if (!imageID) return;

        setSelectedAllImageIDs((prev) =>
            prev.includes(imageID) ? prev.filter((id) => id !== imageID) : [...prev, imageID]
        );
    };

    const handleMoveImageUp = (e, index) => {
        e.stopPropagation();
        if (index <= 0) return;

        setFormData((prev) => {
            const newImages = [...(prev.images || [])];
            [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
            return {
                ...prev,
                images: newImages
            };
        });
    };

    const handleMoveImageDown = (e, index) => {
        e.stopPropagation();
        const images = formData.images || [];
        if (index >= images.length - 1) return;

        setFormData((prev) => {
            const newImages = [...(prev.images || [])];
            [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
            return {
                ...prev,
                images: newImages
            };
        });
    };

    const handleDeleteSelectedAllImages = (e) => {
        e.stopPropagation();

        if (!selectedAllImageIDs.length) {
            alert('Please select image(s) first.');
            return;
        }

        if (!window.confirm(`Delete ${selectedAllImageIDs.length} selected image(s)?`)) return;

        const selectedSet = new Set(selectedAllImageIDs);
        const isSelectedImage = (img) => {
            const imageID = resolveImageServerID(img);
            return imageID ? selectedSet.has(imageID) : false;
        };

        setPendingDeletedImageIDs((prev) => [...new Set([...prev, ...selectedAllImageIDs])]);

        setFormData((prev) => ({
            ...prev,
            images: (prev.images || []).filter((img) => !isSelectedImage(normalizeImageRecord(img)))
        }));

        setSelectedAllImageIDs([]);
    };

    const currentImage = imageList[currentImageIndex] || imageList[0];
    const cardCurrentImage = cardImageList[currentImageIndex] || cardImageList[0];
    const hasMultipleImages = cardImageList.length > 1;
    const totalIndicatorCount = cardImageList.length;
    const visibleIndicatorCount = Math.min(5, totalIndicatorCount);
    const indicatorWindowStart = Math.max(
        0,
        Math.min(currentImageIndex - 2, totalIndicatorCount - visibleIndicatorCount)
    );
    const visibleIndicatorIndexes = Array.from(
        { length: visibleIndicatorCount },
        (_, idx) => indicatorWindowStart + idx
    );
    const nonActiveVisibleIndexes = visibleIndicatorIndexes.filter((idx) => idx !== currentImageIndex);
    const normalNeighborIndexes = new Set(
        nonActiveVisibleIndexes
            .slice()
            .sort((a, b) => {
                const distanceDiff = Math.abs(a - currentImageIndex) - Math.abs(b - currentImageIndex);
                if (distanceDiff !== 0) return distanceDiff;
                return a - b;
            })
            .slice(0, 2)
    );
    const learnMoreGalleryImages = imageList.slice(0, 5);
    const learnMoreGallerySlots = Array.from({ length: 5 }, (_, index) => learnMoreGalleryImages[index] || null);

    const goToPrevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === 0 ? cardImageList.length - 1 : prev - 1));
    };

    const goToNextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === cardImageList.length - 1 ? 0 : prev + 1));
    };

    const goToImageByIndex = (e, index) => {
        e.stopPropagation();
        setCurrentImageIndex(index);
    };

    const openImagePreviewAtIndex = (e, index) => {
        e.stopPropagation();
        setCurrentImageIndex(index);
        setIsImagePreviewOpen(true);
    };

    return (
        <div
            className={`card ${props.isSelectedFromMap ? 'card--map-selected' : ''}`}
            onClick={handleLearnMore}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLearnMore(e); }}
        >
            {/* Favorite Heart Icon */}
            <span
                className={`favorite-icon ${isFavorited ? 'filled' : ''}`}
                onClick={handleFavoriteClick}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
                <FontAwesomeIcon icon={isFavorited ? solidHeart : regularHeart} />
            </span>

            <div className="card-thumbnail-container">
                <img
                    src={cardCurrentImage.url}
                    alt={cardCurrentImage.alt || "Card Thumbnail"}
                    className="card-thumbnail"
                    onClick={handleOpenImagePreview}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenImagePreview(e); }}
                    role="button"
                    tabIndex={0}
                />
                
                {/* Navigation arrows (only show if multiple images) */}
                {hasMultipleImages && (
                    <>
                        <button
                            className="card-image-nav card-image-nav-prev"
                            onClick={goToPrevImage}
                            title="Previous image"
                            aria-label="Previous image"
                        >
                            ❮
                        </button>
                        <button
                            className="card-image-nav card-image-nav-next"
                            onClick={goToNextImage}
                            title="Next image"
                            aria-label="Next image"
                        >
                            ❯
                        </button>
                    </>
                )}
                
                {/* Image indicator dots (only show if multiple images) */}
                {hasMultipleImages && (
                    <div className="card-image-indicators">
                        {visibleIndicatorIndexes.map((imageIndex) => (
                            <span
                                key={`dot-${imageIndex}`}
                                className={`card-image-dot ${imageIndex === currentImageIndex ? 'active' : ''} ${imageIndex !== currentImageIndex && !normalNeighborIndexes.has(imageIndex) ? 'small' : ''}`}
                                aria-hidden="true"
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="card-title-row">
                <h2 className="card-title">{displayCardData.title}</h2>
            </div>
            <div className="card-meta-row">
                <p className="card-meta">{displayCardData.category || "Uncategorized"}</p>
                <button
                    className="card-meta-zoom-btn"
                    onClick={handleZoom}
                    title="Locate on map"
                    aria-label="Locate on map"
                >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
            </div>

            {/* Learn More Modal */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={handleLearnMoreClose}
                className="Modal Modal--learn-more"
                overlayClassName="ModalOverlay ModalOverlay--learn-more"
            >
                <div
                    className="learn-more-modal-shell"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                >
                <div className="learn-more-modal-toolbar">
                    {isLearnMoreEditMode ? (
                        <div className="learn-more-modal-toolbar-actions">
                            <button
                                className="learn-more-modal-toolbar-btn save"
                                onClick={handleLearnMoreEditSave}
                                disabled={loading || isImageMutationLoading}
                            >
                                {loading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                className="learn-more-modal-toolbar-btn cancel"
                                onClick={handleLearnMoreEditCancel}
                                disabled={loading || isImageMutationLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            className="learn-more-modal-edit-btn"
                            onClick={handleLearnMoreEditStart}
                            aria-label="Edit card in Learn More modal"
                            title="Edit"
                        >
                            <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                    )}

                    <div className="learn-more-modal-toolbar-right">
                        <button
                            className="learn-more-modal-delete-btn"
                            onClick={handleDelete}
                            aria-label="Delete card"
                            title="Delete card"
                        >
                            <FontAwesomeIcon icon={faTrashCan} />
                        </button>

                        <button
                            className="learn-more-modal-close"
                            onClick={handleLearnMoreClose}
                            aria-label="Close learn more modal"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="learn-more-modal-body">
                    <input
                        ref={learnMoreImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLearnMoreImageUpload}
                        style={{ display: 'none' }}
                    />

                    {isAllImagesView ? (
                        <div className="learn-more-all-images-view">
                            <div className="learn-more-all-images-header">
                                <button
                                    type="button"
                                    className="learn-more-all-images-back-link"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsAllImagesView(false);
                                    }}
                                >
                                    ← Back to Learn More
                                </button>
                                <p className="learn-more-all-images-count">
                                    {`Showing ${allImagesList.length} image${allImagesList.length === 1 ? '' : 's'}`}
                                </p>
                            </div>

                            <div className="learn-more-all-images-list">
                                {allImagesList.map((image, index) => (
                                    <div className="learn-more-all-image-item" key={`all-image-${image.imageID || image.id || index}`}>
                                        {isLearnMoreEditMode && (
                                            <div className="learn-more-all-image-sort-controls">
                                                <button
                                                    type="button"
                                                    className="learn-more-all-image-sort-btn learn-more-all-image-sort-up"
                                                    onClick={(e) => handleMoveImageUp(e, index)}
                                                    disabled={index === 0}
                                                    title="Move image up"
                                                    aria-label="Move image up"
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    type="button"
                                                    className="learn-more-all-image-sort-btn learn-more-all-image-sort-down"
                                                    onClick={(e) => handleMoveImageDown(e, index)}
                                                    disabled={index === allImagesList.length - 1}
                                                    title="Move image down"
                                                    aria-label="Move image down"
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className="learn-more-all-image-btn"
                                            onClick={(e) => openImagePreviewAtIndex(e, index)}
                                            title={`Open image ${index + 1}`}
                                        >
                                            <img
                                                className="learn-more-all-image"
                                                src={image.url}
                                                alt={image.alt || `Card image ${index + 1}`}
                                            />
                                        </button>

                                        {isLearnMoreEditMode && resolveImageServerID(image) && (
                                            <button
                                                type="button"
                                                className={`learn-more-all-image-select ${selectedAllImageIDs.includes(resolveImageServerID(image)) ? 'is-selected' : ''}`}
                                                onClick={(e) => toggleAllImageSelection(e, image)}
                                                title={selectedAllImageIDs.includes(resolveImageServerID(image)) ? 'Unselect image' : 'Select image'}
                                                aria-label={selectedAllImageIDs.includes(resolveImageServerID(image)) ? 'Unselect image' : 'Select image'}
                                                aria-pressed={selectedAllImageIDs.includes(resolveImageServerID(image)) ? 'true' : 'false'}
                                            >
                                                <span className="learn-more-all-image-select-mark" aria-hidden="true" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {isLearnMoreEditMode && (
                                <div className="learn-more-all-images-actions">
                                    <button
                                        type="button"
                                        className="learn-more-all-images-delete-selected-btn"
                                        onClick={handleDeleteSelectedAllImages}
                                        disabled={isImageMutationLoading || selectedAllImageIDs.length === 0}
                                    >
                                        {`Delete Selected (${selectedAllImageIDs.length})`}
                                    </button>
                                    <button
                                        type="button"
                                        className="learn-more-modal-toolbar-btn save"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPendingImageSlotIndex(null);
                                            learnMoreImageInputRef.current?.click();
                                        }}
                                        disabled={isImageMutationLoading}
                                    >
                                        {isImageMutationLoading ? 'Uploading...' : 'Add New Image'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>

                    <div className="learn-more-gallery">
                        <button
                            type="button"
                            className="learn-more-gallery-tile learn-more-gallery-tile--primary"
                            onClick={(e) => handleLearnMoreGalleryTileClick(e, learnMoreGallerySlots[0], 0)}
                            title={learnMoreGallerySlots[0] ? 'Open image preview' : (isLearnMoreEditMode ? 'Click to add image' : 'No image available')}
                        >
                            {learnMoreGallerySlots[0] ? (
                                <img
                                    className="learn-more-gallery-image"
                                    src={learnMoreGallerySlots[0].url}
                                    alt={learnMoreGallerySlots[0].alt || 'Card image 1'}
                                />
                            ) : (
                                <span className="learn-more-gallery-placeholder">No Image</span>
                            )}
                            {isLearnMoreEditMode && learnMoreGallerySlots[0]?.imageID && (
                                <span
                                    className="learn-more-gallery-delete-btn"
                                    onClick={(e) => handleLearnMoreImageDelete(e, learnMoreGallerySlots[0])}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            handleLearnMoreImageDelete(e, learnMoreGallerySlots[0]);
                                        }
                                    }}
                                    title="Delete image"
                                    aria-label="Delete image"
                                    role="button"
                                    tabIndex={0}
                                >
                                    ×
                                </span>
                            )}
                        </button>

                        <div className="learn-more-gallery-side-grid">
                            {learnMoreGallerySlots.slice(1).map((image, index) => (
                                <button
                                    key={`learn-more-gallery-slot-${index + 1}`}
                                    type="button"
                                    className={`learn-more-gallery-tile ${image ? '' : `learn-more-gallery-tile--placeholder${isLearnMoreEditMode ? ' learn-more-gallery-tile--placeholder-editable' : ''}`}`}
                                    onClick={(e) => handleLearnMoreGalleryTileClick(e, image, index + 1)}
                                    title={image ? `Open image ${index + 2}` : (isLearnMoreEditMode ? `Click to add image ${index + 2}` : 'No image available')}
                                >
                                    {image ? (
                                        <img
                                            className="learn-more-gallery-image"
                                            src={image.url}
                                            alt={image.alt || `Card image ${index + 2}`}
                                        />
                                    ) : (
                                        <span className="learn-more-gallery-placeholder">No Image</span>
                                    )}
                                    {isLearnMoreEditMode && image?.imageID && (
                                        <span
                                            className="learn-more-gallery-delete-btn"
                                            onClick={(e) => handleLearnMoreImageDelete(e, image)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    handleLearnMoreImageDelete(e, image);
                                                }
                                            }}
                                            title="Delete image"
                                            aria-label="Delete image"
                                            role="button"
                                            tabIndex={0}
                                        >
                                            ×
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="learn-more-see-all-images-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAllImagesView(true);
                        }}
                    >
                        {`See all ${allImagesList.length} image${allImagesList.length === 1 ? '' : 's'}`}
                    </button>

                    <div className="learn-more-modal-title-section">
                        {isLearnMoreEditMode ? (
                            <>
                                <input
                                    className="learn-more-inline-input learn-more-inline-title"
                                    type="text"
                                    name="title"
                                    value={formData.title || ''}
                                    onChange={handleInputChange}
                                />
                                <select
                                    className="learn-more-inline-input"
                                    name="category"
                                    value={formData.category || ''}
                                    onChange={handleInputChange}
                                >
                                    {CARD_CATEGORIES.map((categoryOption) => (
                                        <option key={categoryOption} value={categoryOption}>
                                            {categoryOption}
                                        </option>
                                    ))}
                                </select>
                            </>
                        ) : (
                            <>
                                <h2>{formData.title}</h2>
                                <p className="learn-more-modal-subtitle">{formData.category || "Uncategorized"}</p>
                            </>
                        )}
                    </div>

                    {isLearnMoreEditMode ? (
                        <>
                            <p><strong>Author:</strong></p>
                            <input className="learn-more-inline-input" type="text" name="name" value={formData.name || ''} onChange={handleInputChange} />

                            <p><strong>Card Creator:</strong></p>
                            <input className="learn-more-inline-input learn-more-inline-readonly" type="text" name="username" value={formData.username || ''} readOnly disabled title="Card Creator cannot be edited" />

                            <p><strong>Email:</strong></p>
                            <input className="learn-more-inline-input" type="email" name="email" value={formData.email || ''} onChange={handleInputChange} />

                            <p><strong>Funding:</strong></p>
                            <input className="learn-more-inline-input" type="text" name="funding" value={formData.funding || ''} onChange={handleInputChange} />

                            <p><strong>Organization:</strong></p>
                            <input className="learn-more-inline-input" type="text" name="org" value={formData.org || ''} onChange={handleInputChange} />

                            <p><strong>Link:</strong></p>
                            <input className="learn-more-inline-input" type="text" name="link" value={formData.link || ''} onChange={handleInputChange} />

                            <p><strong>Description:</strong></p>
                            <textarea className="learn-more-inline-textarea" name="description" value={formData.description || ''} onChange={handleInputChange} />

                            <p><strong>Tags:</strong></p>
                            <input className="learn-more-inline-input" type="text" name="tags" value={formData.tags || ''} onChange={handleInputChange} />

                            <p><strong>Latitude:</strong></p>
                            <input className="learn-more-inline-input" type="number" step="any" name="latitude" value={formData.latitude || ''} onChange={handleInputChange} />

                            <p><strong>Longitude:</strong></p>
                            <input className="learn-more-inline-input" type="number" step="any" name="longitude" value={formData.longitude || ''} onChange={handleInputChange} />
                        </>
                    ) : (
                        <>
                            <p><strong>Author:</strong> {formData.name}</p>
                            <p><strong>Card Creator:</strong> {formData.username}</p>
                            <p><strong>Email:</strong> {formData.email}</p>
                            <p><strong>Funding:</strong> {formData.funding}</p>
                            <p><strong>Organization:</strong> {formData.org}</p>
                            <p>
                                <strong>Link:</strong>{' '}
                                {formData.link ? (
                                    <a href={formData.link} target="_blank" rel="noopener noreferrer">
                                        {formData.link}
                                    </a>
                                ) : (
                                    <span>N/A</span>
                                )}
                            </p>
                            <p className="learn-more-modal-description"><strong>Description:</strong> {formData.description}</p>
                            <p><strong>Tags:</strong> {formData.tags}</p>
                            <p><strong>Latitude:</strong> {formData.latitude}</p>
                            <p><strong>Longitude:</strong> {formData.longitude}</p>
                        </>
                    )}

                    {/* Files Section */}
                    {isLearnMoreEditMode ? (
                        <div className="learn-more-files-edit-section">
                            <p><strong>Attached Files:</strong></p>
                            {formData.files && formData.files.length > 0 ? (
                                <ul className="learn-more-files-edit-list">
                                    {formData.files.map((file, idx) => (
                                        <li key={file.fileid || idx} className="learn-more-file-edit-item">
                                            <span className="learn-more-file-edit-name">
                                                {file.filename || `File ${idx + 1}`}
                                            </span>
                                            <button
                                                type="button"
                                                className="learn-more-file-edit-delete-btn"
                                                onClick={async () => {
                                                    if (!window.confirm(`Delete file "${file.filename}"?`)) return;
                                                    try {
                                                        await api.delete(`/deleteFile?fileID=${file.fileid}`);
                                                        const filterOut = (f) => f.fileid !== file.fileid;
                                                        setFormData((prev) => ({ ...prev, files: prev.files.filter(filterOut) }));
                                                        setLearnMoreBackup((prev) => prev ? { ...prev, files: (prev.files || []).filter(filterOut) } : prev);
                                                    } catch (err) {
                                                        console.error('Error deleting file:', err);
                                                        alert('Failed to delete file.');
                                                    }
                                                }}
                                            >
                                                ×
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="learn-more-no-files">No files attached.</p>
                            )}
                            <label className="learn-more-add-files-label">
                                Add Files:
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => {
                                        const selectedFiles = Array.from(e.target.files);
                                        setFormData((prev) => ({ ...prev, filesToUpload: selectedFiles }));
                                    }}
                                />
                            </label>
                            {formData.filesToUpload && formData.filesToUpload.length > 0 && (
                                <p className="learn-more-staged-files">
                                    {formData.filesToUpload.length} file(s) staged for upload
                                </p>
                            )}
                        </div>
                    ) : (
                        formData.files && formData.files.length > 0 && (
                            <div className="file-list learn-more-file-list">
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
                        )
                    )}
                        </>
                    )}
                </div>

                </div>
            </Modal>

            <Modal
                isOpen={isImagePreviewOpen}
                onRequestClose={() => setIsImagePreviewOpen(false)}
                className="Modal Modal--image-preview"
                overlayClassName="ModalOverlay ModalOverlay--image-preview"
            >
                <button
                    className="image-preview-close"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsImagePreviewOpen(false);
                    }}
                    aria-label="Close image preview"
                >
                    ×
                </button>
                {hasMultipleImages && (
                    <button className="image-preview-nav image-preview-nav-prev" onClick={goToPrevImage} aria-label="Previous image">&#8249;</button>
                )}
                <img src={currentImage.url} alt="Card enlarged preview" className="image-preview-content" />
                {hasMultipleImages && (
                    <button className="image-preview-nav image-preview-nav-next" onClick={goToNextImage} aria-label="Next image">&#8250;</button>
                )}
                {hasMultipleImages && (
                    <div className="image-preview-indicators">
                        {cardImageList.map((img, idx) => (
                            <button
                                key={img.id ?? idx}
                                className={`image-preview-bar${idx === currentImageIndex ? ' active' : ''}`}
                                onClick={(e) => goToImageByIndex(e, idx)}
                                aria-label={`Go to image ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </Modal>

            {/* Edit/Create Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onRequestClose={() => {}}
                shouldCloseOnOverlayClick={false}
                shouldCloseOnEsc={false}
                className="Modal"
            >
                <h2>{formData.cardID ? "Edit Card" : "Create Card"}</h2>
                <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    saveEdits(); 
                }}>
                    <label>Card Creator:
                        <input type="text" name="username" value={formData.username || ''} readOnly required title="Card Creator cannot be edited" />
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
                        <select
                            name="category"
                            value={formData.category || ""}
                            onChange={handleInputChange}
                        >
                            {CARD_CATEGORIES.map((categoryOption) => (
                                <option key={categoryOption} value={categoryOption}>
                                    {categoryOption}
                                </option>
                            ))}
                        </select>
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
                            isEditingRef.current = false; // Unlock editing state
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
