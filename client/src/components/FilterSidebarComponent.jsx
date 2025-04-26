import React, { useState, useEffect } from 'react';

function FilterSidebarComponent({ products, applyFilters }) {
    // State for all filter options
    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sortBy, setSortBy] = useState('featured');
    const [ratings, setRatings] = useState(0);
    const [categories, setCategories] = useState([]);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [categoriesError, setCategoriesError] = useState('');

    // Calculate min and max prices from products on mount
    useEffect(() => {
        if (products.length > 0) {
            const prices = products.map(product => product.price);
            const minPrice = Math.floor(Math.min(...prices));
            const maxPrice = Math.ceil(Math.max(...prices));
            setPriceRange({ min: minPrice, max: maxPrice });
        }
    }, [products]);

    // Fetch categories from backend API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:5000/categories');
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                const responseData = await response.json();
                
                // Access the 'data' property from the response
                const categoriesData = responseData.data || [];
                setCategories(categoriesData);
                setCategoriesError('');
            } catch (err) {
                console.error('Error fetching categories:', err);
                setCategoriesError('Failed to load categories');
            }
        };

        fetchCategories();
    }, []);

    // Handle price range changes
    const handlePriceChange = (e, type) => {
        const value = parseInt(e.target.value);
        setPriceRange(prev => ({ ...prev, [type]: value }));
    };

    // Simplified category change handler
    const handleCategoryChange = (categoryId) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    };

    // Handle sort option change
    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    // Handle ratings filter
    const handleRatingChange = (rating) => {
        setRatings(rating);
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedCategories([]);
        setSortBy('featured');
        setRatings(0);
        
        // Reset price range to original min/max from products
        if (products.length > 0) {
            const prices = products.map(product => product.price);
            const minPrice = Math.floor(Math.min(...prices));
            const maxPrice = Math.ceil(Math.max(...prices));
            setPriceRange({ min: minPrice, max: maxPrice });
        } else {
            setPriceRange({ min: 0, max: 1000 });
        }
    };

    // Apply all filters and close mobile filter on small screens
    const handleApplyFilters = () => {
        applyFilters({
            priceRange,
            categories: selectedCategories,
            sortBy,
            ratings
        });
        
        // Close mobile filter after applying
        if (window.innerWidth <= 768) {
            setIsMobileFilterOpen(false);
        }
    };

    // Toggle mobile filter visibility
    const toggleMobileFilter = () => {
        setIsMobileFilterOpen(!isMobileFilterOpen);
    };

    return (
        <>
            {/* Mobile Filter Toggle Button */}
            <div className="filter-toggle-container">
                <button 
                    className="filter-toggle-btn"
                    onClick={toggleMobileFilter}
                    aria-label="Toggle Filters"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14"></line>
                        <line x1="4" y1="10" x2="4" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12" y2="3"></line>
                        <line x1="20" y1="21" x2="20" y2="16"></line>
                        <line x1="20" y1="12" x2="20" y2="3"></line>
                        <line x1="1" y1="14" x2="7" y2="14"></line>
                        <line x1="9" y1="8" x2="15" y2="8"></line>
                        <line x1="17" y1="16" x2="23" y2="16"></line>
                    </svg>
                    <span>Filters</span>
                </button>
            </div>

            {/* Main Filter Sidebar */}
            <div className={`filter-sidebar ${isMobileFilterOpen ? 'open' : ''}`}>
                <div className="filter-header">
                    <h2>Filters</h2>
                    <div className="filter-header-actions">
                        <button 
                            className="clear-filters-btn"
                            onClick={clearFilters}
                        >
                            Clear All
                        </button>
                        <button 
                            className="close-filter-btn"
                            onClick={() => setIsMobileFilterOpen(false)}
                            aria-label="Close Filters"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                {/* Price Range Filter */}
                <div className="filter-section">
                    <h3>Price Range</h3>
                    <div className="price-inputs">
                        <div className="price-input">
                            <label>Min ($)</label>
                            <input 
                                type="number" 
                                value={priceRange.min} 
                                onChange={(e) => handlePriceChange(e, 'min')}
                                min="0"
                            />
                        </div>
                        <div className="price-input">
                            <label>Max ($)</label>
                            <input 
                                type="number" 
                                value={priceRange.max} 
                                onChange={(e) => handlePriceChange(e, 'max')}
                                min={priceRange.min}
                            />
                        </div>
                    </div>
                    <div className="price-slider">
                        <input
                            type="range"
                            min="0"
                            max="1000"
                            value={priceRange.min}
                            onChange={(e) => handlePriceChange(e, 'min')}
                            className="slider min-slider"
                        />
                        <input
                            type="range"
                            min={priceRange.min}
                            max="1000"
                            value={priceRange.max}
                            onChange={(e) => handlePriceChange(e, 'max')}
                            className="slider max-slider"
                        />
                    </div>
                </div>

                {/* Categories Filter */}
                <div className="filter-section">
                    <h3>Categories</h3>
                    <div className="category-options">
                        {categoriesError ? (
                            <p className="error-message">{categoriesError}</p>
                        ) : categories && categories.length > 0 ? (
                            categories.map((category) => (
                                <div className="category-option" key={`category-${category.id}`}>
                                    <input
                                        type="checkbox"
                                        id={`category-${category.id}`}
                                        checked={selectedCategories.includes(category.id)}
                                        onChange={() => handleCategoryChange(category.id)}
                                    />
                                    <label htmlFor={`category-${category.id}`}>
                                        {category.name}
                                    </label>
                                </div>
                            ))
                        ) : (
                            <p>Loading categories...</p>
                        )}
                    </div>
                </div>

                {/* Sort By Filter */}
                <div className="filter-section">
                    <h3>Sort By</h3>
                    <select 
                        value={sortBy} 
                        onChange={handleSortChange}
                        className="sort-select"
                    >
                        <option value="featured">Featured</option>
                        <option value="price-low-high">Price: Low to High</option>
                        <option value="price-high-low">Price: High to Low</option>
                        <option value="newest">Newest First</option>
                        <option value="rating">Highest Rated</option>
                    </select>
                </div>

                {/* Rating Filter */}
                <div className="filter-section">
                    <h3>Minimum Rating</h3>
                    <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span 
                                key={star} 
                                className={`star ${star <= ratings ? 'active' : ''}`}
                                onClick={() => handleRatingChange(star)}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                </div>

                {/* Apply Filters Button */}
                <button 
                    className="apply-filters-btn" 
                    onClick={handleApplyFilters}
                >
                    Apply Filters
                </button>
            </div>
            
            {/* Mobile Overlay */}
            {isMobileFilterOpen && (
                <div className="filter-overlay" onClick={() => setIsMobileFilterOpen(false)}></div>
            )}
        </>
    );
}

export default FilterSidebarComponent;