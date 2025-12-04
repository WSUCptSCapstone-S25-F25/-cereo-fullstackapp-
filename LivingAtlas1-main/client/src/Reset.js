import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from './api';

const Reset = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');

    const location = useLocation();

    // Extract the email from the URL parameters
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const emailFromURL = queryParams.get('email');
        if (emailFromURL) {
            setEmail(emailFromURL);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('DEBUG: Reset form submitted');
        console.log('DEBUG: Email:', email);
        console.log('DEBUG: New password length:', newPassword.length);
        console.log('DEBUG: Confirm password length:', confirmPassword.length);

        if (newPassword !== confirmPassword) {
            console.log('DEBUG: Passwords do not match');
            setMessage("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            console.log('DEBUG: Password too short');
            setMessage("Password must be at least 6 characters long.");
            return;
        }

        console.log('DEBUG: Sending reset password request...');
        setMessage('Processing password reset...');

        try {
            // Make POST request to reset the password using the api instance
            const response = await api.post('/reset-password', {
                email: email,
                new_password: newPassword
            });

            console.log('DEBUG: Reset password response:', response.data);

            if (response.data.success) {
                console.log('DEBUG: Password reset successful!');
                setMessage("Password reset successful! You can now log in with your new password.");
            } else {
                console.log('DEBUG: Password reset failed:', response.data.message);
                setMessage(response.data.message || "Failed to reset password.");
            }
        } catch (error) {
            console.error('DEBUG: Reset password error:', error);
            console.error('DEBUG: Error response:', error.response?.data);
            console.error('DEBUG: Error status:', error.response?.status);
            setMessage(error.response?.data?.detail || "An error occurred. Please try again.");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>Reset Password</h2>
            <p>Enter your new password for: <strong>{email}</strong></p>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="newPassword">New Password:</label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength="6"
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        placeholder="Enter new password (min 6 characters)"
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength="6"
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        placeholder="Confirm new password"
                    />
                </div>
                <button 
                    type="submit" 
                    style={{ 
                        width: '100%', 
                        padding: '10px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Reset Password
                </button>
            </form>
            {message && (
                <p style={{ 
                    marginTop: '15px', 
                    padding: '10px', 
                    backgroundColor: message.includes('successful') ? '#d4edda' : '#f8d7da',
                    color: message.includes('successful') ? '#155724' : '#721c24',
                    border: `1px solid ${message.includes('successful') ? '#c3e6cb' : '#f5c6cb'}`,
                    borderRadius: '4px'
                }}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default Reset;
