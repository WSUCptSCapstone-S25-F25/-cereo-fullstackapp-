import React, { useState } from 'react';
import Modal from 'react-modal';
import './FormModal.css';
import axios from 'axios';
import api from './api.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // Example: 5MB

const FormModal = (props) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: props.username,
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
    // Custom styles for the modal
    const customStyles = {
        content: {
            overflow: 'auto', // This enables the scroll
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxHeight: '70%', // This can be set as per your requirement


        }
    };




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
        setSelectedFile(e.target.files[0]);
    };

    //file: UploadFile = File(None)
    //async def submit_form(name: str = Form(None), email: str = Form(None), funding: str= Form(None), organization: str= Form(None), title: str= Form(None), link: str= Form(None), description: str= Form(None), tags: UploadFile = File(None),latitude: str= Form(None),longtitude: str= Form(None),):



    const validateForm = () => {
        const errors = [];

        // Title validation
        if (!formData.title.trim() || formData.title.length > 255) {
            errors.push("Title is required and must be less than 256 characters.");
        }

        // Latitude validation
        if (!/^(-?\d+(\.\d{1,8})?)$/.test(formData.latitude)) {
            errors.push("Latitude must be a number with up to 8 decimal places.");
        }

        // Longitude validation
        if (!/^(-?\d+(\.\d{1,8})?)$/.test(formData.longitude)) {
            errors.push("Longitude must be a number with up to 8 decimal places.");
        }



        // Description validation
        if (formData.description && formData.description.length > 2000) {
            errors.push("Description must be less than 2001 characters.");
        }

        // Organization validation
        if (formData.org && formData.org.length > 255) {
            errors.push("Organization must be less than 256 characters.");
        }

        // Funding validation
        // Funding validation
        if (formData.funding && formData.funding.length > 255) {
            errors.push("Funding must be less than 256 characters.");
        }

        // Link validation
        if (formData.link && formData.link.length > 255) {
            errors.push("Link must be less than 256 characters.");
        }

        return errors;
    };


    const handleSubmit = (event) => {
        event.preventDefault(); // Add this line to prevent default form submission behavior
        //validate form
        const formErrors = validateForm();
        if (formErrors.length > 0) {
            alert(formErrors.join("\n"));
            return; // Stop form submission
        }



        // Define a mapping of formData keys to their state values
        const formFields = {
            name: formData.name,
            email: formData.email,
            title: formData.title,
            category: formData.category,
            description: formData.description,
            funding: formData.funding,
            org: formData.org,
            link: formData.link,
            tags: formData.tags,
            latitude: formData.latitude,
            longitude: formData.longitude
        };

        // Create a new FormData object
        const formData2 = new FormData();

        // Loop over the formFields object and append each field to formData2
        Object.entries(formFields).forEach(([key, value]) => {
            if (value) {
                formData2.append(key, value);
            }
        });

        // Check if there's a selected file and append it to formData2
        if (selectedFile) {
            formData2.append('file', selectedFile);
        }



        api.post('/uploadForm', formData2, {

            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                setModalIsOpen(false);
                console.log(response.data);
                alert("Upload Successful");

            })
            .catch(error => {
                console.error(error);
                alert("Underconstruction");

            });




    };


    const handleButtonClick = () => {
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    return (
        <div>
            <button className="open-form-button" onClick={handleButtonClick}>Upload</button>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                className="form-modal"
                overlayClassName="form-modal-overlay"
                ariaHideApp={false}
                style={customStyles}

            >
                <h2>Upload Document</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="name">Name(required):</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., John Doe" // Example format placeholder for name
                        required
                    />
                    <label htmlFor="email">Email(required):</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="e.g., john.doe@example.com" // Example format placeholder for email

                        required
                    />
                    <label htmlFor="title">Title(required):</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., River Conservation Project" // Example format placeholder for title
                        required
                    />
                    <label htmlFor="category">Category(required):</label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Select a Category</option>
                        <option value="River">River</option>
                        <option value="Watershed">Watershed</option>
                        <option value="Places">Places</option>
                    </select>

                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="e.g., A brief overview of the project objectives and scope" // Example format placeholder for description

                    ></textarea>
                    <label htmlFor="funding">Funding:</label>
                    <input
                        type="text"
                        id="funding"
                        name="funding"
                        value={formData.funding}
                        onChange={handleInputChange}
                        placeholder="e.g., $50K, Grant from XYZ, N/A" // Updated placeholder
                    />
                    <label htmlFor="org">Organization:</label>
                    <input
                        type="text"
                        id="org"
                        name="org"
                        value={formData.org}
                        onChange={handleInputChange}
                        placeholder="e.g., Green Earth Foundation" // Example format placeholder for organization

                    />
                    <label htmlFor="link">Link:</label>
                    <input
                        type="text"
                        id="link"
                        name="link"
                        value={formData.link}
                        onChange={handleInputChange}
                        placeholder="e.g., https://www.greenearth.org" // Example format placeholder for link

                    />
                    <label htmlFor="latitude">Latitude(required):</label>
                    <input
                        type="text"
                        id="latitude"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        placeholder="e.g., 42.3601 (Decimal Degrees)" // Added placeholder
                        required
                    />
                    <label htmlFor="lon">Longitude(required):</label>
                    <input
                        type="text"
                        id="longitude"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        placeholder="e.g., -71.0589 (Decimal Degrees)" // Added placeholder
                        required
                    />
                    <input type="file" onChange={handleFileInput} />
                    <label htmlFor="tags">Tags:</label>
                    <label htmlFor="tags">For Multiple Use Comma: Ex. Tag1,Tag2,Tag3</label>
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="e.g., Conservation, Eastern WA, Ecology" // Example format placeholder for tags

                    />



                    <button type="submit"  >Submit</button>
                    <button type="cancel" onClick={closeModal} >Cancel</button>
                </form>
            </Modal>
        </div>
    );
};

export default FormModal;