import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';
import api from './api.js';
function Register({ closeRegister }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        try {


            const formData = new FormData();
            formData.append('username', name);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('role', false)


            // Post the form data
            const response = await api.post('/uploadAccount', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data' // Optional: Axios sets this automatically for FormData
                }
            });


            if (response.data.success) {
                setMessage('Account created successfully.');
                // You might want to close the form or redirect the user
            } else {
                setMessage(response.data.message);

            }
        } catch (error) {
            setMessage('An error occurred. Please try again later.');
            console.error('There was an error!', error);
            alert(error);
        }
    };
    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    return (
        <div className="register-backdrop" onClick={closeRegister}>
            <div className="register-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Register</h2>
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label htmlFor="username">Name:</label>
                        <input type="text" id="username" name="username" value={name} onChange={handleNameChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="action-button">Register</button>
                        <button type="button" onClick={closeRegister} className="action-button" style={{ backgroundColor: 'red' }}>Cancel</button>
                    </div>

                    {message && <p className="message">{message}</p>}
                </form>
            </div >
        </div >
    );
}

export default Register;
