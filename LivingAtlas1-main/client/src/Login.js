import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import api from './api.js';

function normalizeAdminFlag(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return ['true', '1', 't', 'yes', 'y', 'admin'].includes(normalized);
    }
    return false;
}

function Login({ email, setEmail, password, setPassword, message, setMessage, isLoggedIn, setIsLoggedIn, username, setUsername, setIsAdmin }) {
    const [submitemail, setsubmitEmail] = useState('');
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();

        api.get('/profileAccount', {
            params: {
                email: submitemail,
                password: password
            }
        })
        .then(async (response) => {
            const accountData = response.data['Account Information'];
            if (accountData && accountData.length > 0) {
                const [name, email, rawIsAdmin] = accountData[0];
                let resolvedIsAdmin = normalizeAdminFlag(rawIsAdmin);

                if (typeof rawIsAdmin === 'undefined' || rawIsAdmin === null) {
                    try {
                        const roleResponse = await api.get('/userRole', { params: { email } });
                        resolvedIsAdmin = normalizeAdminFlag(roleResponse?.data?.is_admin);
                        console.log('[Login][Admin Debug] Fallback /userRole result:', roleResponse?.data?.is_admin, '=>', resolvedIsAdmin);
                    } catch (roleError) {
                        console.warn('[Login][Admin Debug] /userRole fallback failed; using default parsed value:', roleError);
                    }
                }

                setIsLoggedIn(true);
                setMessage('Successfully logged in!');
                setUsername(name);
                setEmail(email);
                setIsAdmin(resolvedIsAdmin);

                // Persist login data in localStorage for immediate consistency.
                localStorage.setItem('isLoggedIn', JSON.stringify(true));
                localStorage.setItem('email', email);
                localStorage.setItem('username', name);
                localStorage.setItem('isAdmin', JSON.stringify(resolvedIsAdmin));
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

        // Clear auth data from localStorage
        localStorage.setItem('isLoggedIn', JSON.stringify(false));
        localStorage.setItem('email', '');
        localStorage.setItem('username', '');
        localStorage.setItem('isAdmin', JSON.stringify(false));
    };

    const handleForgotPasswordSubmit = (e) => {
        e.preventDefault();
        console.log('DEBUG: Forgot password form submitted');
        console.log('DEBUG: Email entered:', forgotPasswordEmail);
        console.log('DEBUG: API base URL:', api.defaults.baseURL);
        
        setMessage('Sending password recovery email...');
        
        api.post('/forgot-password', { email: forgotPasswordEmail })
            .then(response => {
                console.log('DEBUG: Forgot password API response:', response);
                console.log('DEBUG: Response data:', response.data);
                setMessage('Password recovery email sent successfully!');
            })
            .catch(error => {
                console.error('DEBUG: Forgot password API error:', error);
                console.error('DEBUG: Error response:', error.response);
                console.error('DEBUG: Error data:', error.response?.data);
                console.error('DEBUG: Error status:', error.response?.status);
                setMessage(`Error: ${error.response?.data?.message || error.message || 'Failed to send recovery email'}`);
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
