
import React from 'react';
import './About.css';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';



function About(props) {


    return (
        
        <div data-testid="test-about">

            <div className="about">


                <h1>About Us</h1>
                <p>Living Atlas is a web application aimed at solving the problem of scattered and
                    inaccessible environmental data. Our goal is to provide a central location for collecting, sharing,
                    and accessing environmental data, making it available to a wide range of stakeholders including
                    tribal communities, academic institutions, and government agencies.</p>
            </div>

        </div>





    );
}

export default About;
