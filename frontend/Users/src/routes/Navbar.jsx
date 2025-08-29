import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
function Navbar() {
    return(
        <nav>
            <Link to="/">Home</Link>
            <Link to="/civicpulse">CivicPulse</Link>
            <Link to="/about">About</Link>
            <Link to="/chatbot">Chatbot</Link>
            <Link to="/news">News</Link>
            <Link to="/form">Form</Link>
        </nav>
    )
}
export default Navbar;