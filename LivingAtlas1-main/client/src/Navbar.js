import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';

function Navbar({ isLoggedIn, isAdmin, username }) {
  const location = useLocation();

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
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
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
          <li className="profile-button">
            <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
              <FontAwesomeIcon icon={faUserCircle} className="profile-icon" />
              <span className="username">{username}</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
