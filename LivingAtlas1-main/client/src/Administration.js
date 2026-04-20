import React, { useState, useEffect } from 'react';
import api from './api.js';
import './Administration.css';

function Administration() {
    const [users, setUsers] = useState([]);
    const [signUpRequests, setSignUpRequests] = useState([]);
    const [error, setError] = useState(null);
    const [isManagingUsers, setIsManagingUsers] = useState(true); // Default view
    const [roleModalUser, setRoleModalUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('regular');
    const [roleConfirmText, setRoleConfirmText] = useState('');
    const [roleModalError, setRoleModalError] = useState('');
    const [isRoleUpdating, setIsRoleUpdating] = useState(false);

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

    const handleOpenRoleModal = (user) => {
        setRoleModalUser(user);
        setSelectedRole(user.is_admin ? 'admin' : 'regular');
        setRoleConfirmText('');
        setRoleModalError('');
    };

    const handleCloseRoleModal = () => {
        setRoleModalUser(null);
        setRoleConfirmText('');
        setRoleModalError('');
        setIsRoleUpdating(false);
    };

    const handleEditUserRole = async () => {
        if (!roleModalUser) {
            return;
        }

        if (roleConfirmText !== 'Confirm') {
            setRoleModalError('Please type Confirm exactly to proceed.');
            return;
        }

        try {
            setIsRoleUpdating(true);
            setRoleModalError('');
            await api.post('/edit_user_role', {
                email: roleModalUser.email,
                is_admin: selectedRole === 'admin'
            });
            const response = await api.post('/list_database');
            setUsers(response.data.users);
            handleCloseRoleModal();
        } catch (error) {
            setError(error.message);
            setRoleModalError(error.message);
        } finally {
            setIsRoleUpdating(false);
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
                                        <button className="admin-action-btn" onClick={() => handleOpenRoleModal(user)}>
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

            {roleModalUser && (
                <div className="admin-modal-overlay" onClick={handleCloseRoleModal}>
                    <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
                        <h4 className="admin-modal-title">Change User Role</h4>
                        <p className="admin-modal-subtitle">
                            {roleModalUser.name} ({roleModalUser.email})
                        </p>

                        <div className="admin-role-options">
                            <label className="admin-role-option">
                                <input
                                    type="radio"
                                    name="role"
                                    value="regular"
                                    checked={selectedRole === 'regular'}
                                    onChange={(event) => setSelectedRole(event.target.value)}
                                />
                                Regular User
                            </label>
                            <label className="admin-role-option">
                                <input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={selectedRole === 'admin'}
                                    onChange={(event) => setSelectedRole(event.target.value)}
                                />
                                Admin
                            </label>
                        </div>

                        <label className="admin-confirm-label" htmlFor="admin-role-confirm-input">
                            Type <strong>Confirm</strong> to apply this role change
                        </label>
                        <input
                            id="admin-role-confirm-input"
                            className="admin-confirm-input"
                            type="text"
                            value={roleConfirmText}
                            onChange={(event) => setRoleConfirmText(event.target.value)}
                            placeholder="Confirm"
                        />

                        {roleModalError && <p className="admin-error admin-modal-error">{roleModalError}</p>}

                        <div className="admin-modal-actions">
                            <button className="admin-action-btn" onClick={handleCloseRoleModal}>
                                Cancel
                            </button>
                            <button
                                className="admin-action-btn admin-action-btn-approve"
                                onClick={handleEditUserRole}
                                disabled={isRoleUpdating}
                            >
                                {isRoleUpdating ? 'Updating...' : 'Confirm Change'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Administration;
