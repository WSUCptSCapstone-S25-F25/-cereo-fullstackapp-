import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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

        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        try {
            // Make POST request to reset the password
            const response = await fetch('https://livingatlasbackend-36wl.onrender.com/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    new_password: newPassword
                }),
            });

            const data = await response.json();
            if (data.success) {
                setMessage("Password reset successful!");
            } else {
                setMessage(data.message || "Failed to reset password.");
            }
        } catch (error) {
            setMessage("An error occurred. Please try again.");
        }
    };

    return (
        <div>
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="newPassword">New Password:</label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Reset Password</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default Reset;
