import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Login.css';
import api from './api.js';

function Login({ email, setEmail, password, setPassword, message, setMessage, isLoggedIn, setIsLoggedIn, username, setUsername, setIsAdmin }) {
    const [submitemail, setsubmitEmail] = useState('');
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);

    useEffect(() => {
        // Check for stored login data on mount
        const storedIsLoggedIn = sessionStorage.getItem('isLoggedIn');
        const storedEmail = sessionStorage.getItem('email');
        const storedUsername = sessionStorage.getItem('username');
        const storedIsAdmin = sessionStorage.getItem('isAdmin');

        if (storedIsLoggedIn) {
            setIsLoggedIn(true);
            setEmail(storedEmail);
            setUsername(storedUsername);
            setIsAdmin(storedIsAdmin === 'true');
        }

        // Add beforeunload listener to log out on tab close
        const handleBeforeUnload = (event) => {
            sessionStorage.clear(); // Clear sessionStorage on tab close
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [setIsLoggedIn, setEmail, setUsername, setIsAdmin]);

    const handleLogin = (e) => {
        e.preventDefault();

        api.get('/profileAccount', {
            params: {
                email: submitemail,
                password: password
            }
        })
        .then(response => {
            const accountData = response.data['Account Information'];
            if (accountData && accountData.length > 0) {
                const [name, email, isAdmin] = accountData[0];
                setIsLoggedIn(true);
                setMessage('Successfully logged in!');
                setUsername(name);
                setEmail(email);
                setIsAdmin(isAdmin);

                // Store login data in sessionStorage
                sessionStorage.setItem('isLoggedIn', true);
                sessionStorage.setItem('email', email);
                sessionStorage.setItem('username', name);
                sessionStorage.setItem('isAdmin', isAdmin);
            } else {
                setMessage('Invalid email or password.');
            }
        })
        .catch(error => {
            console.error("Error during login:", error);
            setMessage('Error during login. Please try again.');
        });
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setEmail('');
        setsubmitEmail('');
        setPassword('');
        setMessage('Successfully logged out.');
        setUsername("You're logged out.");

        // Clear login data from sessionStorage
        sessionStorage.clear();
    };

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

    return (
        <div>
            <div className="login">
                <h1>Login</h1>
                <h2>Welcome {username} {email}</h2>
                <form onSubmit={handleLogin}>
                    <div>
                        <label>Email:</label>
                        <input
                            type="email"
                            value={submitemail}
                            onChange={(e) => setsubmitEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>

                <button onClick={handleLogout}>Logout</button>

                <div>
                    <button onClick={() => setShowForgotPasswordForm(!showForgotPasswordForm)}>
                        {isLoggedIn ? 'Change Password?' : 'Forgot Password?'}
                    </button>
                </div>

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

                {message && <p>{message}</p>}
            </div>
        </div>
    );
}

export default Login;
