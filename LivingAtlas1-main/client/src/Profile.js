import React, { useEffect, useState, useRef } from 'react';
import './Content2.css';
import Card from './Card.js';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Profile.css';
import api from './api.js';
import Register from './Register'; // Import the Register component
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStarHalfStroke } from '@fortawesome/free-regular-svg-icons';


function Profile(props) {
    const [cards, setCards] = useState([]);
    const [showRegister, setShowRegister] = useState(false);
    const [lastDeletedCard, setLastDeletedCard] = useState(false);


    // Password Reset & Change Password States
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
    const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
    const [message, setMessage] = useState('');
    const [bookmarkedCardIDs, setBookmarkedCardIDs] = useState(new Set());
    const [bookmarksLoaded, setBookmarksLoaded] = useState(false);

    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);


    // Function to toggle the register form visibility
    function handleOpenRegister() {
        setShowRegister(true);
    }

    function handleCloseRegister() {
        setShowRegister(false);
    }

    const fetchBookmarks = async () => {
        try {
            const res = await api.get('/getBookmarkedCards', {
                params: { username: props.username }
            });
    
            const cardIDs = new Set(
                res.data.bookmarkedCards.map(card =>
                    card.cardID || card.cardid || card.CardID
                )
            );
    
            setBookmarkedCardIDs(cardIDs);
            setBookmarksLoaded(true);
        } catch (error) {
            console.error("Error fetching bookmarks:", error);
        }
    };

    // Handles Forgot Password request
    const handleForgotPasswordSubmit = (e) => {
        e.preventDefault();
        api.post('/forgot-password', { email: forgotPasswordEmail })
            .then(response => {
                setMessage('Password recovery email sent.');
            })
            .catch(error => {
                setMessage('Error sending password recovery email.');
                console.error(error);
            });
    };

    // Handles Change Password request
    const handleChangePasswordSubmit = (e) => {
        e.preventDefault();
        api.post('/reset-password', { email: props.email, new_password: newPassword })
            .then(response => {
                setMessage('Password changed successfully.');
            })
            .catch(error => {
                setMessage('Error changing password.');
                console.error(error);
            });
    };

    const handleBookmarkChange = async () => {
        try {
            const res = await api.get('/getBookmarkedCards', {
                params: { username: props.username }
            });
    
            const cardIDs = new Set(
                res.data.bookmarkedCards.map(card =>
                    card.cardID || card.cardid || card.CardID
                )
            );
    
            setBookmarkedCardIDs(cardIDs);
        } catch (error) {
            console.error("Error updating bookmark status:", error);
        }
    };

    // useEffect(() => {
    //     // Check if the user is an admin
    //     const isAdmin = props.isAdmin; // Assuming isAdmin prop is passed from parent component

    //     if (isAdmin) {
    //         // Fetch all cards
    //         api.get('/allCards')
    //             .then(response => {
    //                 setCards(response.data.data);
    //                 setLastDeletedCard(false);
    //             })
    //             .catch(error => {
    //                 console.error(error);
    //             });
    //     } else {
    //         // Fetch user's profile cards
    //         api.get(`/profileCards?username=${props.username}`)
    //             .then(response => {
    //                 setCards(response.data.data);
    //                 setLastDeletedCard(false);
    //             })
    //             .catch(error => {
    //                 console.error(error);
    //             });
    //     }
    //     // fetchBookmarks();
    // }, [props.isAdmin, props.username, lastDeletedCard]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const isAdmin = props.isAdmin;
                let cardResponse;
    
                if (isAdmin) {
                    cardResponse = await api.get('/allCards');
                } else {
                    cardResponse = await api.get(`/profileCards?username=${props.username}`);
                }
    
                const cardData = cardResponse.data.data;
    
                // Fetch bookmarks
                const bookmarkRes = await api.get('/getBookmarkedCards', {
                    params: { username: props.username }
                });
    
                const bookmarkedIDs = new Set(
                    bookmarkRes.data.bookmarkedCards.map(card =>
                        card.cardID || card.cardid || card.CardID
                    )
                );
    
                // Optionally log for debugging
                console.log("[Profile] Final bookmarked set:", bookmarkedIDs);
    
                // Set state
                setBookmarkedCardIDs(bookmarkedIDs);
                setCards(cardData);
                setBookmarksLoaded(true);
                setLastDeletedCard(false);
    
            } catch (error) {
                console.error("Profile fetch error:", error);
            }
        };
    
        fetchData();
    }, [props.isAdmin, props.username, lastDeletedCard]);

    
    return (
        <div>
            <div className="about">
                <h1>Profile page</h1>
                <h2>User Name: {props.username}</h2>
                <h2>Email: {props.email}</h2>
                <p>On the profile page, you're granted a comprehensive view of every piece of data you've shared with our community. If you ever notice any inaccuracies or wish to make updates, the edit feature is at your service. And for those moments when you decide some information is best kept private or removed, the delete option is there to ensure your content remains exactly how you want it.</p>
                
                <button onClick={handleOpenRegister}>Invite New User</button>
                {showRegister && <Register closeRegister={handleCloseRegister} />}

                
                {/* Change Password Toggle Button */}
                <button onClick={() => setShowChangePasswordForm(!showChangePasswordForm)}>
                    Change Password
                </button>

                {/* Forgot Password Form */}
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

                {/* Change Password Form */}
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
                        <button type="submit">Change Password</button>
                    </form>
                )}

            </div>
            <div className='profile-card-container'>
                <section id="content-2-profile">
                    <div className="card-container">
                        {/* {cards.map(card => (
                            <Card key={card.title} formData={card} isFavorited={bookmarkedCardIDs.has(card.cardID)} email={props.userEmail} username={props.username} onCardDelete={setLastDeletedCard} />
                            ))} */}
                        {cards
                            .filter(card => !showFavoritesOnly || bookmarkedCardIDs.has(card.cardID))
                            .map((card, index) => (
                                <Card
                                key={`${card.cardID}-${index}`}
                                formData={{
                                    ...card,
                                    cardID: card.cardID,
                                    cardOwner: card.username,
                                    viewerUsername: props.username
                                }}
                                isFavorited={bookmarkedCardIDs.has(card.cardID)}
                                username={props.username}
                                onCardDelete={setLastDeletedCard}
                                onBookmarkChange={handleBookmarkChange}
                                />
                        ))}
                    </div>

                    <div className="favorites-toggle-wrapper-profile">
                        <div
                            className={`favorites-toggle-icon ${showFavoritesOnly ? 'active' : ''}`}
                            onClick={() => setShowFavoritesOnly(prev => !prev)}
                            title="Favorites"
                        >
                            <FontAwesomeIcon icon={faStarHalfStroke} style={{ marginRight: '8px' }} />
                            Favorites
                        </div>
                    </div>

                </section>

            </div>

            
        </div>
    );
}

export default Profile;
