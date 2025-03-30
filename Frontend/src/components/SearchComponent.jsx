//components/SearchComponent.js
import React from 'react';
import { Link } from 'react-router-dom';

function SearchComponent({ searchCourse, courseSearchUserFunction, toggleCart }) {
    return (
        <header className="App-header">
            <Link to="/login" className="login-link">Login</Link>
            <h1>Kidaf Shopping Cart</h1>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search for Products..."
                    value={searchCourse}
                    onChange={courseSearchUserFunction}
                />
            </div>
            <div className="cart-icon" onClick={toggleCart}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
            </div>
        </header>
    );
}

export default SearchComponent;