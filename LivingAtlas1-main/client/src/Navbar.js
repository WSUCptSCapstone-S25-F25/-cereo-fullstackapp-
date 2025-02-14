import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar({ isLoggedIn, isAdmin }) {
  return (
    <nav className="navbar">
      <a href="/">
        <h1>RWC Living Atlas</h1>
      </a>
      <a href="https://cereo.wsu.edu/">
        <img src="/CEREO-logo.png" alt="CEREO Logo" style={{ width: '140px', height: '50px', float: 'left' }}></img>
      </a>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        {!isLoggedIn && <li><Link to="/signup">Register</Link></li>}
        <li><Link to="/login">{isLoggedIn ? 'Logout' : 'Login'}</Link></li>
        {isLoggedIn && isAdmin && <li><Link to="/administration">Administration</Link></li>}
        {isLoggedIn && <li><Link to="/profile">Profile</Link></li>}
      </ul>
    </nav>
  );
}

export default Navbar;
