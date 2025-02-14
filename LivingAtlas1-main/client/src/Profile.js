import React, { useEffect, useState, useRef } from 'react';
import './Content2.css';
import Card from './Card.js';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Profile.css';
import api from './api.js';
import Register from './Register'; // Import the Register component

function Profile(props) {
    const [cards, setCards] = useState([]);
    const [showRegister, setShowRegister] = useState(false);
    const [lastDeletedCard, setLastDeletedCard] = useState(false);

    // Function to toggle the register form visibility
    function handleOpenRegister() {
        setShowRegister(true);
    }

    function handleCloseRegister() {
        setShowRegister(false);
    }

    useEffect(() => {
        // Check if the user is an admin
        const isAdmin = props.isAdmin; // Assuming isAdmin prop is passed from parent component

        if (isAdmin) {
            // Fetch all cards
            api.get('/allCards')
                .then(response => {
                    setCards(response.data.data);
                    setLastDeletedCard(false);
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            // Fetch user's profile cards
            api.get(`/profileCards?username=${props.username}`)
                .then(response => {
                    setCards(response.data.data);
                    setLastDeletedCard(false);
                })
                .catch(error => {
                    console.error(error);
                });
        }
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
            </div>
            <section id="content-2">
                <div className="card-container">
                    {cards.map(card => (
                        <Card key={card.title} formData={card} email={props.userEmail} username={props.username} onCardDelete={setLastDeletedCard} />
                    ))}
                </div>
            </section>
        </div>
    );
}

export default Profile;
