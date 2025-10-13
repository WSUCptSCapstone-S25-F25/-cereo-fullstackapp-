import React, { useState } from 'react';
import axios from 'axios';
import './UploadButton.css';
import FormModal from './FormModal';
//import api from './api.js'



const UploadButton = ({ username, email }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <div className="UploadButton">
            {/* Sidebar Upload Button */}
            <button onClick={openModal} className="upload-card-button">
                Upload Card
            </button>

            {/* Card Upload Form Modal */}
            <FormModal 
                username={username}
                email={email}
                isOpen={isModalOpen}
                onRequestClose={closeModal}
            />
        </div>
    );
};

export default UploadButton;

//Old upload button logic dont want to delete tell make sure new one works
/*
const UploadButton = () => {
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileInput = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await api.post('/save', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('File uploaded successfully!');
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="UploadButton">
            <input type="file" onChange={handleFileInput} />
            <button onClick={handleUpload}>Upload</button>
        </div>

    );
};

export default UploadButton;
*/
