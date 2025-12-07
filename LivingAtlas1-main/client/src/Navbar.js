import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';

function Navbar({ isLoggedIn, isAdmin, username, onLogout }) {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    console.log("Toggling modal. Current state:", isModalOpen);
    setIsModalOpen(!isModalOpen);
  };

  const handleLogout = () => {
    onLogout(); // Call the logout function
    setIsModalOpen(false); // Close the modal
  };

  console.log("Navbar.js: isAdmin:", isAdmin, "isLoggedIn:", isLoggedIn, "username:", username);

  return (
    <nav className="navbar">
      <a href="/">
        <h1>RWC Living Atlas</h1>
      </a>
      <a href="https://cereo.wsu.edu/">
        <img src="/CEREO-logo.png" alt="CEREO Logo" style={{ width: '140px', height: '50px', float: 'left' }}></img>
      </a>
      <ul>
        <li>
          <a href="/" className={location.pathname === '/' ? 'active' : ''}>Home</a>
        </li>
        <li>
          <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link>
        </li>
        <li>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Contact</Link>
        </li>
        {!isLoggedIn && (
          <li>
            <Link to="/signup" className={location.pathname === '/signup' ? 'active' : ''}>Register</Link>
          </li>
        )}
        {isLoggedIn && isAdmin && (
          <li>
            <Link to="/administration" className={location.pathname === '/administration' ? 'active' : ''}>Administration</Link>
          </li>
        )}
        <li>
          <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
            {isLoggedIn ? 'Logout' : 'Login'}
          </Link>
        </li>
        {isLoggedIn && (
          <li
              className={`profile-button ${isModalOpen ? 'active' : ''}`}
              onClick={toggleModal}
          >
            <FontAwesomeIcon icon={faUserCircle} className="profile-icon" />
            <span className="username">{username}</span>
            
          </li>
        )}
      </ul>
      {isModalOpen && (
        // console.log("Profile modal is opened."),
        <div className="profile-modal">
          <ul>
            {/* New: Profile Page Button */}
            <li>
              <Link to="/profile" onClick={() => setIsModalOpen(false)}>Profile</Link>
            </li>
            {isAdmin && (
              <li>
                <Link to="/administration" onClick={() => setIsModalOpen(false)}>Administration</Link>
              </li>
            )}
            <li>
              <Link to="/login" onClick={() => setIsModalOpen(false)}>Switch Account</Link>
            </li>
            {/* <li>
              <button onClick={handleLogout}>Logout</button>
            </li> */}
            <li>
              <Link to="/login" onClick={() => setIsModalOpen(false)} className="logout-button">
                Logout
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
