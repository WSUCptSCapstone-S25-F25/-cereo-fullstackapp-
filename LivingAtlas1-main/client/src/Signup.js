import React, { useState } from 'react';
import api from './api.js'; // Import your API module

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sponsorMessage, setSponsorMessage] = useState('');
  const [desiredAccessLevel, setDesiredAccessLevel] = useState('regular');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Check if all fields are filled
    if (!username || !email || !password || !sponsorMessage) {
      setMessage('Please fill in all fields.');
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('sponsor_message', sponsorMessage);
      formData.append('desired_access_level', desiredAccessLevel);
  
      const response = await api.post('/uploadSignup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      console.log(response.data); // Log the response from the server
  
      // Send the signup notification email to the admin
      await api.post('/sendSignupNotification', {
        username: username,
        email: email,
        desired_access_level: desiredAccessLevel
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      // Clear form fields after successful submission
      setUsername('');
      setEmail('');
      setPassword('');
      setSponsorMessage('');
      setDesiredAccessLevel('regular');
      setMessage('Your request is awaiting approval from an admin.');
    } catch (error) {
      console.error('Error submitting signup data:', error);
      setMessage('An error occurred while submitting your request.');
    }
  };
  

  return (
    <div style={{ marginLeft: '10px' }}>
      <h2>Request Access to The Living Atlas Below</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '200px' }} />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '200px' }} />
        </div>
        <div>
          <label htmlFor="sponsorMessage">Sponsor/Message:</label>
          <textarea id="sponsorMessage" value={sponsorMessage} onChange={(e) => setSponsorMessage(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="desiredAccessLevel">Desired Access Level:</label>
          <select id="desiredAccessLevel" value={desiredAccessLevel} onChange={(e) => setDesiredAccessLevel(e.target.value)}>
            <option value="regular">Regular User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit">Submit</button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
}

export default Signup;
