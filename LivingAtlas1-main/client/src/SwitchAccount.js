import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faCheckCircle, faPlus, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import api from './api';
import './SwitchAccount.css';

function SwitchAccount({ email, setEmail, setPassword, setMessage, setIsLoggedIn, setUsername, setIsAdmin }) {
  const history = useHistory();
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [currentEmail, setCurrentEmail] = useState(email);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    // Load saved accounts from localStorage
    const accounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
    setCurrentEmail(localStorage.getItem('email') || '');
    setSavedAccounts(accounts);
  }, []);

  const handleSwitchTo = (account) => {
    if (account.email === currentEmail || switching) return;
    setSwitching(true);

    api.get('/profileAccount', {
      params: { email: account.email, password: account.password }
    })
      .then(async (response) => {
        const accountData = response.data['Account Information'];
        if (accountData && accountData.length > 0) {
          const [name, acctEmail, rawIsAdmin] = accountData[0];
          let resolvedIsAdmin = false;
          if (typeof rawIsAdmin === 'boolean') resolvedIsAdmin = rawIsAdmin;
          else if (rawIsAdmin === 't' || rawIsAdmin === 'true' || rawIsAdmin === true) resolvedIsAdmin = true;

          setIsLoggedIn(true);
          setUsername(name);
          setEmail(acctEmail);
          setIsAdmin(resolvedIsAdmin);
          setMessage('Switched account successfully!');

          localStorage.setItem('isLoggedIn', JSON.stringify(true));
          localStorage.setItem('email', acctEmail);
          localStorage.setItem('username', name);
          localStorage.setItem('isAdmin', JSON.stringify(resolvedIsAdmin));

          history.push('/');
        } else {
          // Credentials no longer valid — remove from saved accounts
          const updated = savedAccounts.filter(a => a.email !== account.email);
          localStorage.setItem('savedAccounts', JSON.stringify(updated));
          setSavedAccounts(updated);
          setMessage('Session expired. Please log in again.');
        }
      })
      .catch(() => {
        const updated = savedAccounts.filter(a => a.email !== account.email);
        localStorage.setItem('savedAccounts', JSON.stringify(updated));
        setSavedAccounts(updated);
        setMessage('Failed to switch account. Credentials may have changed.');
      })
      .finally(() => setSwitching(false));
  };

  const handleAddAccount = () => {
    history.push('/login');
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setUsername("You're logged out.");
    setIsAdmin(false);
    setMessage('Successfully logged out.');

    localStorage.setItem('isLoggedIn', JSON.stringify(false));
    localStorage.setItem('email', '');
    localStorage.setItem('username', '');
    localStorage.setItem('isAdmin', JSON.stringify(false));

    history.push('/login');
  };

  const currentAccount = savedAccounts.find(a => a.email === currentEmail);
  const otherAccounts = savedAccounts.filter(a => a.email !== currentEmail);

  return (
    <div className="switch-account-container">
      <div className="switch-account-card">
        <div className="switch-account-header">
          <h1>Switch Accounts</h1>
          <button className="sign-out-link" onClick={handleSignOut}>
            <FontAwesomeIcon icon={faSignOutAlt} /> Sign out
          </button>
        </div>

        {currentAccount && (
          <div className="account-item current-account">
            <div className="account-check">
              <FontAwesomeIcon icon={faCheckCircle} className="check-icon" />
            </div>
            <div className="account-avatar">
              <FontAwesomeIcon icon={faUserCircle} className="avatar-icon" />
            </div>
            <div className="account-info">
              <span className="account-name">{currentAccount.username}</span>
              <span className="account-label">Current Account</span>
              <span className="account-email">{currentAccount.email}</span>
            </div>
          </div>
        )}

        {otherAccounts.map((account) => (
          <div
            key={account.email}
            className={`account-item other-account ${switching ? 'disabled' : ''}`}
            onClick={() => handleSwitchTo(account)}
          >
            <div className="account-check" />
            <div className="account-avatar">
              <FontAwesomeIcon icon={faUserCircle} className="avatar-icon" />
            </div>
            <div className="account-info">
              <span className="account-name">{account.username}</span>
              <span className="account-email">{account.email}</span>
            </div>
          </div>
        ))}

        <div className="account-item add-account" onClick={handleAddAccount}>
          <div className="account-check" />
          <div className="account-avatar">
            <div className="add-icon-circle">
              <FontAwesomeIcon icon={faPlus} className="add-icon" />
            </div>
          </div>
          <div className="account-info">
            <span className="add-account-text">Add account</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SwitchAccount;
