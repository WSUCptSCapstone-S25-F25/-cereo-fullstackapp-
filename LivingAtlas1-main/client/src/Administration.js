import React, { useState, useEffect } from 'react';
import api from './api.js';

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

    const handleApproveRequest = async (request, isAdmin) => {
        try {
            const formData = new FormData();
            formData.append('username', request.name);
            formData.append('email', request.email);
            formData.append('password', request.password);
            formData.append('role', isAdmin);
    
            // Call the uploadAccount endpoint to add the user
            const response = await api.post('/uploadAccount', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
            });
            console.log(response.data); // Log the response from the server
    
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
        <div>
            <h2>Administration</h2>
            <div>
                <button onClick={toggleView}>
                    {isManagingUsers ? 'View Sign Up Requests' : 'Manage Users'}
                </button>
            </div>
            {isManagingUsers ? (
                <>
                    <h2>User Management</h2>
                    {error && <p>Error: {error}</p>}
                    <table>
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
                                    <td>{user.is_admin ? 'Admin' : 'Regular User'}</td>
                                    <td>
                                        <button onClick={() => handleEditUserRole(user)}>Change Role</button>
                                    </td>
                                    {!user.is_admin && (
                                        <td>
                                            <button onClick={() => handleDeleteUser(user)}>Delete</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {showEditForm && selectedUser && (
                        <div>
                            <h3>Edit User</h3>
                            <p>User: {selectedUser.name}</p>
                            <p>Email: {selectedUser.email}</p>
                            {/* Edit form goes here */}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <h2>Sign Up Requests</h2>
                    {error && <p>Error: {error}</p>}
                    <table>
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
                                    <td>{request.desired_access_level ? 'Admin' : 'Regular User'}</td>
                                    <td>
                                        <button onClick={() => handleApproveRequest(request, true)}>Approve as Admin</button>
                                        <button onClick={() => handleApproveRequest(request, false)}>Approve as Regular User</button>
                                        <button onClick={() => handleDenyRequest(request)}>Deny</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}

export default Administration;
