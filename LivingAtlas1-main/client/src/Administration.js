import React, { useState, useEffect } from 'react';
import api from './api.js';
import './Administration.css';

function Administration() {
    const [users, setUsers] = useState([]);
    const [signUpRequests, setSignUpRequests] = useState([]);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [isManagingUsers, setIsManagingUsers] = useState(true); // Default view

    useEffect(() => {
        if (isManagingUsers) {
            fetchUsers();
        } else {
            fetchSignUpRequests();
        }
    }, [isManagingUsers]);

    const fetchUsers = async () => {
        try {
            const response = await api.post('/list_database');
            setUsers(response.data.users);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchSignUpRequests = async () => {
        try {
            const response = await api.post('/fetch_signup_requests');
            setSignUpRequests(response.data.signUpRequests);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDeleteUser = async (user) => {
        try {
            await api.post(`/delete_user/${user.email}`);
            const response = await api.post('/list_database');
            setUsers(response.data.users);
        } catch (error) {
            setError(error.message);
        }
    };
    
    const handleDenyRequest = async (request) => {
        // Placeholder function for denying a sign-up request
        console.log("Denying sign-up request:", request);
        try {
            await api.post(`/deny_request/${request.email}`);
            const response = await api.post('/fetch_signup_requests');
            setSignUpRequests(response.data.signUpRequests);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleEditUserRole = async (user) => {
        try {
            const newRole = !user.is_admin;
            await api.post('/edit_user_role', { email: user.email, is_admin: newRole });
            const response = await api.post('/list_database');
            setUsers(response.data.users);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleApproveRequest = async (request) => {
        try {
            const formData = new FormData();
            formData.append('name', request.name);
            formData.append('email', request.email);
            formData.append('password', request.password);
    
            // Call the uploadAccount endpoint to add the user
            const response = await api.post('/uploadAccount', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
            });
            console.log(response.data); // Log the response from the server

            if (!response.data?.success) {
                setError(response.data?.message || 'Failed to approve sign-up request.');
                return;
            }

            // Respect requested access level chosen in register page.
            if (request.desired_access_level) {
                await api.post('/edit_user_role', { email: request.email, is_admin: true });
            }
    
            // Remove the approved request from the sign-up requests list
            const updatedRequests = signUpRequests.filter(req => req.email !== request.email);
            setSignUpRequests(updatedRequests);
    
            // After successfully adding the user, send a request to delete the request from the database
            await api.post(`/deny_request/${request.email}`);
            

        } catch (error) {
            setError(error.message);
        }
    };
    
    

    

    const toggleView = () => {
        setIsManagingUsers(prevState => !prevState);
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h2 className="admin-title">Administration</h2>
                <button className="admin-toggle-btn" onClick={toggleView}>
                    {isManagingUsers ? 'View Sign Up Requests' : 'Manage Users'}
                </button>
            </div>

            {isManagingUsers ? (
                <section className="admin-card">
                    <h3 className="admin-section-title">User Management</h3>
                    {error && <p className="admin-error">Error: {error}</p>}
                    <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Edit</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.email}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`admin-badge ${user.is_admin ? 'admin-badge-admin' : 'admin-badge-user'}`}>
                                            {user.is_admin ? 'Admin' : 'Regular User'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="admin-action-btn" onClick={() => handleEditUserRole(user)}>
                                            Change Role
                                        </button>
                                    </td>
                                    {!user.is_admin ? (
                                        <td>
                                            <button className="admin-action-btn admin-action-btn-danger" onClick={() => handleDeleteUser(user)}>
                                                Delete
                                            </button>
                                        </td>
                                    ) : (
                                        <td className="admin-muted">-</td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                    {showEditForm && selectedUser && (
                        <div>
                            <h3>Edit User</h3>
                            <p>User: {selectedUser.name}</p>
                            <p>Email: {selectedUser.email}</p>
                            {/* Edit form goes here */}
                        </div>
                    )}
                </section>
            ) : (
                <section className="admin-card">
                    <h3 className="admin-section-title">Sign Up Requests</h3>
                    {error && <p className="admin-error">Error: {error}</p>}
                    <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Message</th>
                                <th>Desired Level of Access</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {signUpRequests.map(request => (
                                <tr key={request.email}>
                                    <td>{request.name}</td>
                                    <td>{request.email}</td>
                                    <td>{request.sponsor_message}</td>
                                    <td>
                                        <span className={`admin-badge ${request.desired_access_level ? 'admin-badge-admin' : 'admin-badge-user'}`}>
                                            {request.desired_access_level ? 'Admin' : 'Regular User'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-actions-inline">
                                            <button className="admin-action-btn admin-action-btn-approve" onClick={() => handleApproveRequest(request)}>
                                                Approve
                                            </button>
                                            <button className="admin-action-btn admin-action-btn-danger" onClick={() => handleDenyRequest(request)}>
                                                Deny
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </section>
            )}
        </div>
    );
}

export default Administration;
