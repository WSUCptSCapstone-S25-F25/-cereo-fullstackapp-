// App.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from '../App';

// Mocking child components to simplify testing of App component.
jest.mock('../Home', () => () => <div>Mock Home</div>);
jest.mock('../About', () => () => <div>Mock About</div>);
jest.mock('../Contact', () => () => <div>Mock Contact</div>);
jest.mock('../Login', () => () => <div>Mock Login</div>);
jest.mock('../Profile', () => () => <div>Mock Profile</div>);



describe('App Component', () => {
    test('renders App component and checks routes', () => {
        render(
            <Router>
                <App />
            </Router>
        );

        // Example: Test if Home component renders on default route.
        expect(screen.getByText('Mock Home')).toBeInTheDocument();

        // You can add more assertions based on your expectations for this component's behavior.
    });
});
