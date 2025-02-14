import React, { useState } from 'react';
import axios from 'axios';
import './UploadButton.css';
import api from './api.js'

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
