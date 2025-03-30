import React, { useEffect, useState } from 'react';
import SearchComponent from '../components/SearchComponent';
import ShowCourseComponent from '../components/ShowCourseComponent';
import UserCartComponent from '../components/UserCartComponent';
import FilterSidebarComponent from '../components/FilterSidebarComponent';


function Cart() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');
    const [cartCourses, setCartCourses] = useState([]);
    const [searchCourse, setSearchCourse] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [activeFilters, setActiveFilters] = useState({
        priceRange: { min: 0, max: 1000 },
        categories: [],
        sortBy: 'featured',
        ratings: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    // Function to toggle the cart visibility
    const toggleCart = () => {
        setShowCart(!showCart);
    };

    // Fetch products from the backend
    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/products');
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

    // Apply filters to products
const applyFilters = (filters) => {
    setActiveFilters(filters);
    
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
    
    // Apply sorting
    switch (filters.sortBy) {
        case 'price-low-high':
            result.sort((a, b) => a.price - b.price);
            break;
        case 'price-high-low':
            result.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            // Assuming products have a date or id that can be used for sorting
            result.sort((a, b) => b.id - a.id);
            break;
        case 'rating':
            result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        default: // 'featured' or any other value
            // No sorting needed for featured, assuming products come pre-sorted
            break;
    }
    
    setFilteredProducts(result);
};
    // Display active filter tags
    const renderActiveFilterTags = () => {
        const tags = [];
        
        // Price range filter
        if (activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < 1000) {
            tags.push(
                <div key="price" className="filter-badge">
                    Price: ${activeFilters.priceRange.min} - ${activeFilters.priceRange.max}
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

    // Apply search filter to already filtered products
    const searchFilteredProducts = filteredProducts.filter((course) =>
        course.name.toLowerCase().includes(searchCourse.toLowerCase())
    );

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
                                Showing {searchFilteredProducts.length} of {products.length} products
                            </div>
                            
                            <ShowCourseComponent
                                courses={products}
                                filterCourseFunction={searchFilteredProducts}
                                addCourseToCartFunction={addCourseToCartFunction}
                            />
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
                />
            </main>
        </div>
    );
}

export default Cart;