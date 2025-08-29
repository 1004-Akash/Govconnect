import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
function Navbar() {
    return(
        <nav>
            <Link to="/">Home</Link>
            <Link to="/chatbot">Chatbot</Link>
            <Link to="/map">Map</Link>
            <Link to="/sentiment">Sentiment</Link>
        </nav>
    )
}
export default Navbar;