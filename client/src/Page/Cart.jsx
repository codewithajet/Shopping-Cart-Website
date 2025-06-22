import React, { useEffect, useState } from 'react';
import SearchComponent from '../components/SearchComponent';
import ShowCourseComponent from '../components/ShowCourseComponent';
import UserCartComponent from '../components/UserCartComponent';
import FilterSidebarComponent from '../components/FilterSidebarComponent';
import Footer from '../components/Footer'; // Import the Footer component

// Helper function for formatting Naira with commas
function formatNaira(amount) {
    if (isNaN(amount)) return amount;
    return Number(amount).toLocaleString('en-NG');
}

function Cart() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');
    const [cartCourses, setCartCourses] = useState([]);
    const [searchCourse, setSearchCourse] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [displayedProducts, setDisplayedProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const productsPerPage = 20; // Number of products per page
    const [activeFilters, setActiveFilters] = useState({
        priceRange: { min: 0, max: 1000 },
        categories: [],
        sortBy: 'featured',
        ratings: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Function to toggle the cart visibility
    const toggleCart = () => {
        setShowCart(!showCart);
    };

    // Fetch products from the backend
    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('https://shopping-cart-5wj4.onrender.com/products');
            const data = await response.json();
            setProducts(data);
            setFilteredProducts(data); // Initialize filtered products with all products
            setError('');
        } catch (err) {
            setError('Failed to fetch products. Please try again later.');
            console.error('Error fetching products:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Load cart data from localStorage on component mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cartCourses');
        if (savedCart) {
            try {
                setCartCourses(JSON.parse(savedCart));
            } catch (err) {
                console.error('Error parsing saved cart:', err);
                // Reset cart if there's an error
                localStorage.removeItem('cartCourses');
            }
        }
        
        fetchProducts();
        
        // Add event listener for window resize to handle responsive changes
        const handleResize = () => {
            // Close cart if window is resized to wider screen
            if (window.innerWidth > 768 && showCart) {
                setShowCart(false);
            }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Clean up
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Save cart data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cartCourses', JSON.stringify(cartCourses));
    }, [cartCourses]);

    // Update filtered products when search changes
    useEffect(() => {
        if (!searchCourse.trim()) {
            // If search field is empty, just apply existing filters
            applyFilters(activeFilters);
        } else {
            const searchFiltered = products.filter((course) =>
                course.name.toLowerCase().includes(searchCourse.toLowerCase())
            );
            
            // Apply other active filters to the search results
            let result = [...searchFiltered];
            
            // Apply price filter
            result = result.filter(product => 
                product.price >= activeFilters.priceRange.min && 
                product.price <= activeFilters.priceRange.max
            );
            
            // Apply category filter
            if (activeFilters.categories.length > 0) {
                result = result.filter(product => 
                    activeFilters.categories.includes(product.category_id)
                );
            }
            
            // Apply rating filter
            if (activeFilters.ratings > 0) {
                result = result.filter(product => 
                    (product.rating || 0) >= activeFilters.ratings
                );
            }
            
            // Apply sorting
            applySorting(result, activeFilters.sortBy);
            
            setFilteredProducts(result);
            setCurrentPage(1); // Reset to first page when search term changes
        }
    }, [searchCourse]);

    // Helper function for sorting products
    const applySorting = (products, sortBy) => {
        let sortedProducts = [...products]; // Create a new array to avoid mutating the original
        
        switch (sortBy) {
            case 'price-low-high':
                sortedProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high-low':
                sortedProducts.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                sortedProducts.sort((a, b) => b.id - a.id);
                break;
            case 'rating':
                sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            default: // 'featured' or any other value
                // No sorting needed for featured
                break;
        }
        
        return sortedProducts;
    };

    // Update displayed products whenever filtered products or current page changes
    useEffect(() => {
        // Calculate the start and end indices for the current page
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        
        // Get products for current page only
        setDisplayedProducts(filteredProducts.slice(startIndex, endIndex));
        
        // Update hasMore flag
        setHasMore(endIndex < filteredProducts.length);
        setIsLoadingMore(false);
    }, [filteredProducts, currentPage, productsPerPage]);

    // Load more products
    const loadMoreProducts = () => {
        if (isLoadingMore || !hasMore) return;
        
        // Set loading state
        setIsLoadingMore(true);
        
        // Clear current products to show loading indicator
        setDisplayedProducts([]);
        
        // After a short delay, load the next page
        setTimeout(() => {
            setCurrentPage(prevPage => prevPage + 1);
        }, 500);
    };

    // Apply filters to products
    const applyFilters = (filters) => {
        setActiveFilters(filters);
        setCurrentPage(1); // Reset to first page when filters change
        
        let result = [...products];
        
        // Filter by price range
        result = result.filter(product => 
            product.price >= filters.priceRange.min && 
            product.price <= filters.priceRange.max
        );
        
        // Filter by categories if any selected
        if (filters.categories.length > 0) {
            result = result.filter(product => 
                filters.categories.includes(product.category_id)
            );
        }
        
        // Filter by minimum rating
        if (filters.ratings > 0) {
            result = result.filter(product => 
                (product.rating || 0) >= filters.ratings
            );
        }
        
        // Apply search filter if there's an active search term
        if (searchCourse.trim()) {
            result = result.filter((course) =>
                course.name.toLowerCase().includes(searchCourse.toLowerCase())
            );
        }
        
        // Apply sorting
        result = applySorting(result, filters.sortBy);
        
        setFilteredProducts(result);
    };

    // Display active filter tags
    const renderActiveFilterTags = () => {
        const tags = [];
        
        // Price range filter
        if (activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < 1000) {
            tags.push(
                <div key="price" className="filter-badge">
                    Price: ₦{formatNaira(activeFilters.priceRange.min)} - ₦{formatNaira(activeFilters.priceRange.max)}
                </div>
            );
        }
        
        // Category filters
        activeFilters.categories.forEach(cat => {
            tags.push(
                <div key={cat} className="filter-badge">
                    {cat}
                </div>
            );
        });
        
        // Rating filter
        if (activeFilters.ratings > 0) {
            tags.push(
                <div key="rating" className="filter-badge">
                    {Array(activeFilters.ratings).fill('★').join('')}+
                </div>
            );
        }
        
        // Sort filter (except default 'featured')
        if (activeFilters.sortBy !== 'featured') {
            const sortLabels = {
                'price-low-high': 'Price: Low to High',
                'price-high-low': 'Price: High to Low',
                'newest': 'Newest First',
                'rating': 'Highest Rated'
            };
            
            tags.push(
                <div key="sort" className="filter-badge">
                    Sort: {sortLabels[activeFilters.sortBy]}
                </div>
            );
        }
        
        return tags.length > 0 ? (
            <div className="active-filters">
                {tags}
                <button 
                    className="clear-filters-btn"
                    onClick={() => {
                        setActiveFilters({
                            priceRange: { min: 0, max: 1000 },
                            categories: [],
                            sortBy: 'featured',
                            ratings: 0
                        });
                        setSearchCourse('');
                        setCurrentPage(1);
                        setFilteredProducts(products);
                    }}
                >
                    Clear All Filters
                </button>
            </div>
        ) : null;
    };

    // Add a course to the cart
    const addCourseToCartFunction = (GFGcourse) => {
        const alreadyCourses = cartCourses.find(item => item.product.id === GFGcourse.id);
        if (alreadyCourses) {
            const latestCartUpdate = cartCourses.map(item =>
                item.product.id === GFGcourse.id ? { 
                    ...item, quantity: item.quantity + 1 
                } : item
            );
            setCartCourses(latestCartUpdate);
        } else {
            setCartCourses([...cartCourses, { product: GFGcourse, quantity: 1 }]);
        }
        
        // Show the cart when a product is added
        setShowCart(true);
    };

    // Delete a course from the cart
    const deleteCourseFromCartFunction = (GFGCourse) => {
        const updatedCart = cartCourses.filter(item => item.product.id !== GFGCourse.id);
        setCartCourses(updatedCart);
    };

    // Calculate the total amount of the cart
    const totalAmountCalculationFunction = () => {
        return cartCourses.reduce((total, item) => 
            total + item.product.price * item.quantity, 0
        );
    };

    // Handle search input
    const courseSearchUserFunction = (event) => {
        setSearchCourse(event.target.value);
    };

    // Clear cart completely
    const clearCart = () => {
        setCartCourses([]);
        localStorage.removeItem('cartCourses');
    };

    return (
        <div className="App">
            <SearchComponent 
                searchCourse={searchCourse} 
                courseSearchUserFunction={courseSearchUserFunction}
                toggleCart={toggleCart}
                cartCourses={cartCourses} // Pass cart courses to show correct count
            />
            <main className="App-main with-filters">
                <FilterSidebarComponent 
                    products={products}
                    applyFilters={applyFilters}
                />
                
                <div className="content-area">
                    {isLoading ? (
                        <div className="loading-indicator">
                            <div className="spinner"></div>
                            <p>Loading products...</p>
                        </div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : (
                        <>
                            {renderActiveFilterTags()}
                            
                            <div className="products-count">
                                <strong>
                                    {displayedProducts.length === 0 && isLoadingMore 
                                        ? "Loading next set of products..." 
                                        : `Showing products ${filteredProducts.length > 0 ? (currentPage - 1) * productsPerPage + 1 : 0} to ${Math.min(currentPage * productsPerPage, filteredProducts.length)} of ${filteredProducts.length} products`
                                    }
                                </strong>
                                <br />
                                <span className="page-info">Page {currentPage} of {Math.ceil(filteredProducts.length / productsPerPage) || 1}</span>
                            </div>
                            
                            {displayedProducts.length === 0 && isLoadingMore ? (
                                <div className="loading-indicator">
                                    <div className="spinner"></div>
                                    <p>Loading new products...</p>
                                </div>
                            ) : (
                                <ShowCourseComponent
                                    courses={products}
                                    filterCourseFunction={displayedProducts}
                                    addCourseToCartFunction={addCourseToCartFunction}
                                />
                            )}
                            
                            {filteredProducts.length > 0 ? (
                                <div className={`pagination-controls ${!hasMore ? 'no-more' : ''}`}>
                                    {currentPage > 1 && (
                                        <button 
                                            className="pagination-button"
                                            onClick={() => {
                                                setIsLoadingMore(true);
                                                setDisplayedProducts([]); // Clear current products
                                                setTimeout(() => {
                                                    setCurrentPage(prevPage => prevPage - 1);
                                                }, 500);
                                            }}
                                            disabled={isLoadingMore}
                                        >
                                            Previous Page
                                        </button>
                                    )}

                                    {hasMore && (
                                        <button 
                                            className={`pagination-button ${isLoadingMore ? 'loading' : ''}`}
                                            onClick={loadMoreProducts}
                                            disabled={!hasMore || isLoadingMore}
                                        >
                                            <span>
                                                View More 
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 18l6-6-6-6"></path>
                                                </svg>
                                            </span>
                                            <div className="loading-indicator">
                                                <div className="loading-dots">
                                                    <div></div>
                                                    <div></div>
                                                    <div></div>
                                                </div>
                                            </div>
                                        </button>
                                    )}

                                    <div className="page-indicator">
                                        Page {currentPage} of {Math.ceil(filteredProducts.length / productsPerPage)}
                                    </div>
                                </div>
                            ) : (
                                <div className="no-results">
                                    No products match your search criteria
                                </div>
                            )}

                            {!hasMore && filteredProducts.length > 0 && !isLoadingMore && (
                                <div className="no-more-results">
                                    You've reached the end of the product list
                                    {currentPage > 1 && (
                                        <button 
                                            className="back-button"
                                            onClick={() => {
                                                setIsLoadingMore(true);
                                                setDisplayedProducts([]); // Clear current products
                                                setTimeout(() => {
                                                    setCurrentPage(prevPage => prevPage - 1);
                                                }, 500);
                                            }}
                                        >
                                            Go back to previous page
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <UserCartComponent
                    cartCourses={cartCourses}
                    deleteCourseFromCartFunction={deleteCourseFromCartFunction}
                    totalAmountCalculationFunction={totalAmountCalculationFunction}
                    setCartCourses={setCartCourses}
                    clearCart={clearCart}
                    showCart={showCart}
                    setShowCart={setShowCart}
                    // Make sure to pass formatNaira as prop if you want to use it in UserCartComponent
                    // formatNaira={formatNaira}
                />
            </main>
            
            {/* Adding the Footer component here, outside of the main element */}
            <Footer />
        </div>
    );
}

export default Cart;