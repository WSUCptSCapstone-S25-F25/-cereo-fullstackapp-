import React, { useState } from 'react';
import './Content2.css';
import './Profile.css';
import api from './api.js';
import Register from './Register';

function Profile(props) {
    const [showRegister, setShowRegister] = useState(false);

    // Password Reset & Change Password States
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
    const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
    const [message, setMessage] = useState('');

    // Toggle register visibility
    function handleOpenRegister() {
        setShowRegister(true);
    }

    function handleCloseRegister() {
        setShowRegister(false);
    }

    const handleForgotPasswordSubmit = (e) => {
        e.preventDefault();
        api.post('/forgot-password', { email: forgotPasswordEmail })
            .then(response => setMessage('Password recovery email sent.'))
            .catch(error => {
                setMessage('Error sending password recovery email.');
                console.error(error);
            });
    };

    const handleChangePasswordSubmit = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }
        api.post('/reset-password', { email: props.email, new_password: newPassword })
            .then(response => {
                setMessage('Password changed successfully.');
                setNewPassword('');
                setConfirmPassword('');
            })
            .catch(error => {
                setMessage('Error changing password.');
                console.error(error);
            });
    };

    return (
        <div className="profile-container">
            {/* LEFT SIDE */}
            <div className="profile-left expanded">
            <div className="about">
                <h1>Profile page</h1>
                <h2>User Name: {props.username}</h2>
                <h2>Email: {props.email}</h2>
                <p>
                On the profile page, you're granted a comprehensive view of every
                piece of data you've shared with our community. If you ever notice
                any inaccuracies or wish to make updates, the edit feature is at your
                service. And for those moments when you decide some information is
                best kept private or removed, the delete option is there to ensure
                your content remains exactly how you want it.
                </p>

                <button onClick={handleOpenRegister}>Invite New User</button>
                {showRegister && <Register closeRegister={handleCloseRegister} />}

                <button
                onClick={() => setShowChangePasswordForm(!showChangePasswordForm)}
                >
                Change Password
                </button>

                {showForgotPasswordForm && (
                <form onSubmit={handleForgotPasswordSubmit}>
                    <div>
                    <label>Enter your email to reset password:</label>
                    <input
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        required
                    />
                    </div>
                    <button type="submit">Submit</button>
                </form>
                )}

                {showChangePasswordForm && (
                <form onSubmit={handleChangePasswordSubmit}>
                    <div>
                    <label>Enter New Password:</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    </div>
                    <div>
                    <label>Confirm New Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    </div>
                    <button type="submit">Change Password</button>
                </form>
                )}

                {message && <p>{message}</p>}
            </div>
            </div>
        </div>
        );
}

export default Profile;