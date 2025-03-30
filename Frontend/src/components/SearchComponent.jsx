//components/SearchComponent.js
import React from 'react';
import { Link } from 'react-router-dom';

function SearchComponent({ searchCourse, courseSearchUserFunction }) {
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
        </header>
    );
}

export default SearchComponent;
