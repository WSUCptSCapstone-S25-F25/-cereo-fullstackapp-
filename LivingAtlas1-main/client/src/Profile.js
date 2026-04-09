import React, { useEffect, useState } from 'react';
import './Content2.css';
import './Profile.css';
import api from './api.js';
import Register from './Register';

function Profile(props) {
    const [showRegister, setShowRegister] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedUsername, setEditedUsername] = useState(props.username || '');
    const [bio, setBio] = useState('');
    const [editedBio, setEditedBio] = useState('');

    const BIO_MAX_LENGTH = 300;

    useEffect(() => {
        const fetchBio = async () => {
            try {
                const res = await api.get('/getBio', { params: { email: props.email } });
                if (res.data.success) {
                    setBio(res.data.bio);
                }
            } catch (err) {
                console.error('Error fetching bio:', err);
            }
        };
        if (props.email) fetchBio();
    }, [props.email]);

    const handleEditClick = () => {
        setEditedUsername(props.username);
        setEditedBio(bio);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setEditedUsername(props.username);
        setEditedBio(bio);
        setIsEditing(false);
    };

    const handleSaveAll = async () => {
        if (!editedUsername.trim()) {
            setMessage('Username cannot be empty.');
            return;
        }
        if (editedBio.length > BIO_MAX_LENGTH) {
            setMessage(`Bio must be ${BIO_MAX_LENGTH} characters or less.`);
            return;
        }
        try {
            const usernameChanged = editedUsername.trim() !== props.username;
            const bioChanged = editedBio !== bio;

            if (usernameChanged) {
                const res = await api.post('/updateUsername', {
                    email: props.email,
                    new_username: editedUsername.trim()
                });
                if (res.data.success) {
                    props.setUsername(res.data.username);
                }
            }
            if (bioChanged) {
                const res = await api.post('/updateBio', {
                    email: props.email,
                    bio: editedBio
                });
                if (res.data.success) {
                    setBio(res.data.bio);
                }
            }
            setMessage('Profile updated successfully.');
            setIsEditing(false);
        } catch (err) {
            setMessage('Error updating profile.');
            console.error(err);
        }
    };

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
                <h2>
                  User Name:{' '}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUsername}
                      onChange={(e) => setEditedUsername(e.target.value)}
                    />
                  ) : (
                    props.username
                  )}
                </h2>
                <h2>Email: {props.email}</h2>

                <div className="bio-section">
                  <h3>Bio</h3>
                  {isEditing ? (
                    <>
                      <textarea
                        value={editedBio}
                        onChange={(e) => {
                          if (e.target.value.length <= BIO_MAX_LENGTH) {
                            setEditedBio(e.target.value);
                          }
                        }}
                        maxLength={BIO_MAX_LENGTH}
                        rows={4}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                      <p style={{ fontSize: '0.85em', color: '#888' }}>
                        {editedBio.length}/{BIO_MAX_LENGTH}
                      </p>
                    </>
                  ) : (
                    <p>{bio || 'No bio yet.'}</p>
                  )}
                </div>

                {isEditing ? (
                  <>
                    <button onClick={handleSaveAll}>Save</button>
                    <button onClick={handleCancelEdit}>Cancel</button>
                  </>
                ) : (
                  <button onClick={handleEditClick}>Edit Profile</button>
                )}
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