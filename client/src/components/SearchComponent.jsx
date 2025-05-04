// components/SearchComponent.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function SearchComponent({ searchCourse, courseSearchUserFunction, toggleCart, cartItemCount = 0 }) {
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Close mobile menu when window is resized to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768 && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Clean up
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isMobileMenuOpen]);
    
    // Handle mobile menu toggle
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Calculate actual cart item count from cart items
    const calculateCartCount = () => {
        if (!cartItemCount) return 0;
        
        if (Array.isArray(cartItemCount)) {
            return cartItemCount.reduce((total, item) => total + item.quantity, 0);
        }
        
        return cartItemCount;
    };
    
    return (
        <header className="app-header">
            <div className="header-gradient"></div>
            <div className="header-container">
                <div className="brand-section">
                    <div className="logo-container">
                        <svg className="logo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
                                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="brand-name">Kidaf</h1>
                    <span className="brand-tagline">Premium Shopping</span>
                    
                    {/* Mobile Menu Toggle Button */}
                    <button 
                        className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
                        onClick={toggleMobileMenu}
                        aria-label="Toggle mobile menu"
                    >
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </button>
                </div>
                
                <nav className={`main-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    <div className="mobile-nav-header">
                        <div className="mobile-brand">
                            <div className="logo-container">
                                <svg className="logo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
                                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h2 className="brand-name">Kidaf</h2>
                        </div>
                        <button 
                            className="mobile-close-btn"
                            onClick={toggleMobileMenu}
                            aria-label="Close menu"
                        >
                        </button>
                    </div>
                    <ul className="nav-links">
                        <li><a href="#" className="nav-link active">Home</a></li>
                        <li><a href="#" className="nav-link">Collections</a></li>
                        <li><a href="#" className="nav-link">New Arrivals</a></li>
                        <li><a href="#" className="nav-link">Sale</a></li>
                        <li className="mobile-only"><a href="#" className="nav-link">My Account</a></li>
                        <li className="mobile-only"><a href="#" className="nav-link">Wishlist</a></li>
                        <li className="mobile-only"><a href="#" className="nav-link">Cart</a></li>
                    </ul>
                </nav>
                
                <div className={`search-container ${isInputFocused ? 'focused' : ''}`}>
                    <div className="search-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search for products..."
                        value={searchCourse}
                        onChange={courseSearchUserFunction}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        className="search-input"
                    />
                    {searchCourse && (
                        <button className="clear-search" onClick={() => courseSearchUserFunction({ target: { value: '' } })}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </div>
                
                <div className="nav-actions">
                    <Link to="/wishlist" className="wishlist-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span className="tooltip">Wishlist</span>
                    </Link>
                    
                    <Link to="/login" className="login-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>Account</span>
                        <span className="tooltip">Account</span>
                    </Link>
                    
                    <button className="cart-button" onClick={toggleCart}>
                        <div className="cart-icon-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            {calculateCartCount() > 0 && (
                                <span className="cart-item-count">{calculateCartCount()}</span>
                            )}
                        </div>
                        <span className="tooltip">Cart</span>
                    </button>
                </div>
            </div>
            
            {/* Mobile menu overlay */}
            {isMobileMenuOpen && <div className="mobile-menu-overlay" onClick={toggleMobileMenu}></div>}
        </header>
    );
}

export default SearchComponent;