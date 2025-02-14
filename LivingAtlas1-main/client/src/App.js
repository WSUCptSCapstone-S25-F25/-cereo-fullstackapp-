import './App.css';
import Header from './Header';
import Main from './Main';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Login from './Login';
import Profile from './Profile';
import Navbar from './Navbar';
import Signup from './Signup';
import Administration from './Administration';
import Reset from './Reset';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { useEffect, useState } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Load login state from localStorage on component mount
  useEffect(() => {
    const savedIsLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn'));
    const savedEmail = localStorage.getItem('email');
    const savedUsername = localStorage.getItem('username');
    const savedIsAdmin = JSON.parse(localStorage.getItem('isAdmin'));

    if (savedIsLoggedIn) {
      setIsLoggedIn(savedIsLoggedIn);
      setEmail(savedEmail || '');
      setUsername(savedUsername || '');
      setIsAdmin(savedIsAdmin || false);
    }
  }, []);

  // Update localStorage when login state changes
  useEffect(() => {
    localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
    localStorage.setItem('email', email);
    localStorage.setItem('username', username);
    localStorage.setItem('isAdmin', JSON.stringify(isAdmin));
  }, [isLoggedIn, email, username, isAdmin]);

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
      <Switch>
        <Route exact path="/">
          <Home isLoggedIn={isLoggedIn} username={username} email={email} isAdmin={isAdmin} />
        </Route>
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/login">
          <Login
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            message={message}
            setMessage={setMessage}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
            username={username}
            setUsername={setUsername}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
          />
        </Route>
        <Route path="/profile">
          {isLoggedIn ? (
            <Profile
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              message={message}
              setMessage={setMessage}
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
              username={username}
              setUsername={setUsername}
              isAdmin={isAdmin}
            />
          ) : (
            <Redirect to="/login" />
          )}
        </Route>
        <Route path="/signup" component={Signup} />
        <Route path="/administration">
          {isLoggedIn && isAdmin ? <Administration /> : <Redirect to="/login" />}
        </Route>
        <Route path="/reset-password" component={Reset} />
        <Route path="*">
          <h1>404 - Page Not Found</h1>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
