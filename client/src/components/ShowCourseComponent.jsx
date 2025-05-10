import React, { useState, useEffect, useRef } from 'react';

function ShowCourseComponent({ filterCourseFunction, addCourseToCartFunction }) {
    // State to track which product is selected for the popup
    const [selectedProduct, setSelectedProduct] = useState(null);
    // Add state for quantity in popup
    const [quantity, setQuantity] = useState(1);
    // Add state to track image loading errors
    const [imageErrors, setImageErrors] = useState({});
    // Reference for popup content
    const popupContentRef = useRef(null);
    
    // Function to open the popup with the selected product
    const openProductPopup = (product) => {
        setSelectedProduct(product);
        // Reset quantity to 1 whenever a new popup is opened
        setQuantity(1);
        // Add body class to prevent background scrolling
        document.body.classList.add('popup-open');
    };
    
    // Function to close the popup
    const closeProductPopup = () => {
        setSelectedProduct(null);
        // Remove body class to restore scrolling
        document.body.classList.remove('popup-open');
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            document.body.classList.remove('popup-open');
        };
    }, []);

    // Add event listeners to handle closing popup
    useEffect(() => {
        // Only add listeners if popup is open
        if (!selectedProduct) return;

        // Handler for clicks outside the popup
        const handleOutsideClick = (e) => {
            // Check if click is outside popup content
            if (popupContentRef.current && !popupContentRef.current.contains(e.target)) {
                closeProductPopup();
            }
        };

        // Handler for escape key
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                closeProductPopup();
            }
        };

        // Add event listeners with capture phase to ensure they fire before other events
        document.addEventListener('mousedown', handleOutsideClick, true);
        document.addEventListener('touchstart', handleOutsideClick, true);
        document.addEventListener('keydown', handleEscKey);

        // Clean up listeners
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick, true);
            document.removeEventListener('touchstart', handleOutsideClick, true);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [selectedProduct]);
    
    // Function to update quantity
    const updateQuantity = (change) => {
        setQuantity(prevQuantity => Math.max(1, prevQuantity + change));
    };
    
    // Function to handle image errors
    const handleImageError = (productId, imageIndex) => {
        setImageErrors(prev => ({
            ...prev,
            [`${productId}-${imageIndex}`]: true
        }));
    };
    
    return (
        <div className="product-list">
            {filterCourseFunction.length === 0 ? (
                <p className="no-results">
                    Sorry, no matching products found.
                </p>
            ) : (
                filterCourseFunction.map((product) => (
                    <div 
                        className="product" 
                        key={product.id}
                        onClick={() => openProductPopup(product)}
                    >
                        {/* Display product images with fallback */}
                        <div className="product-images">
                            {product.images && product.images.length > 0 ? (
                                product.images.map((image, index) => (
                                    imageErrors[`${product.id}-${index}`] ? (
                                        <img
                                            key={index}
                                            src="/src/assets/avatar.png"
                                            alt={`${product.name} fallback`}
                                            className="product-image"
                                        />
                                    ) : (
                                        <img
                                            key={index}
                                            src={`http://localhost:5000${image.startsWith('/') ? '' : '/'}${image}`}
                                            alt={`${product.name} ${index + 1}`}
                                            className="product-image"
                                            onError={() => handleImageError(product.id, index)}
                                        />
                                    )
                                ))
                            ) : (
                                <img
                                    src="/src/assets/avatar.png"
                                    alt={`${product.name} fallback`}
                                    className="product-image"
                                />
                            )}
                        </div>
                        <h2>{product.name}</h2>
                        <p className="product-price">Price: ${product.price}</p>
                        <p className="product-description">{product.description}</p>
                        <button
                            className="add-to-cart-button"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent div's onClick
                                addCourseToCartFunction(product);
                            }}
                        >
                            Add to Shopping Cart
                        </button>
                    </div>
                ))
            )}
            
            {/* Product Popup */}
            {selectedProduct && (
                <div 
                    className="product-popup-overlay"
                    // No onClick here - we handle clicks in useEffect to ensure proper event handling
                >
                    <div 
                        className="product-popup-content" 
                        ref={popupContentRef}
                    >
                        <button 
                            className="close-popup" 
                            aria-label="Close popup"
                            onClick={closeProductPopup}
                        >
                            &times;
                        </button>
                        
                        <div className="popup-product-container">
                            {/* Image Section */}
                            <div className="popup-product-images">
                                {selectedProduct.specialOffer && (
                                    <span className="special-offer-label">Special Offer</span>
                                )}
                                
                                <div className="image-nav">
                                    <button className="image-nav-button">
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    <button className="image-nav-button">
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                                
                                {/* Corrected image display in popup */}
                                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                    <img 
                                        src={`http://localhost:5000${selectedProduct.images[0].startsWith('/') ? '' : '/'}${selectedProduct.images[0]}`}
                                        alt={selectedProduct.name}
                                        className="popup-product-image"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "/src/assets/avatar.png";
                                        }}
                                    />
                                ) : (
                                    <img 
                                        src="/src/assets/avatar.png"
                                        alt={selectedProduct.name}
                                        className="popup-product-image"
                                    />
                                )}
                            </div>
                            
                            {/* Content Section */}
                            <div className="popup-product-content">
                                <h2>{selectedProduct.name}</h2>
                                
                                {/* Rating */}
                                {selectedProduct.rating && (
                                    <div className="popup-product-rating">
                                        <div className="stars">
                                            {[...Array(5)].map((_, i) => (
                                                <i 
                                                    key={i} 
                                                    className={`fas fa-star${i < Math.floor(selectedProduct.rating) ? '' : '-half-alt'}`}
                                                ></i>
                                            ))}
                                        </div>
                                        <span className="review-count">({selectedProduct.reviewCount || 0} reviews)</span>
                                    </div>
                                )}
                                
                                {/* Price */}
                                <div className="popup-product-price">
                                    {selectedProduct.originalPrice ? (
                                        <>
                                            <span className="original-price">${selectedProduct.originalPrice}</span>
                                            <span className="discounted-price">${selectedProduct.price}</span>
                                        </>
                                    ) : (
                                        <span className="discounted-price">${selectedProduct.price}</span>
                                    )}
                                </div>
                                
                                {/* Tags */}
                                {selectedProduct.tags && (
                                    <div className="product-tags">
                                        {selectedProduct.tags.map((tag, index) => (
                                            <span key={index} className="product-tag">{tag}</span>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Quantity Selector */}
                                <div className="quantity-selector">
                                    <button 
                                        onClick={() => updateQuantity(-1)}
                                        aria-label="Decrease quantity"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        value={quantity} 
                                        min="1" 
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        aria-label="Product quantity"
                                    />
                                    <button 
                                        onClick={() => updateQuantity(1)}
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>
                                
                                {/* Description */}
                                <div className="popup-product-description">
                                    <p>{selectedProduct.description}</p>
                                </div>
                                
                                {/* Additional Details */}
                                <div className="popup-product-details">
                                    {selectedProduct.instructor && (
                                        <div className="detail-item">
                                            <span className="icon"><i className="fas fa-chalkboard-teacher"></i></span>
                                            <div className="content">
                                                <h4>Instructor</h4>
                                                <p>{selectedProduct.instructor}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedProduct.duration && (
                                        <div className="detail-item">
                                            <span className="icon"><i className="far fa-clock"></i></span>
                                            <div className="content">
                                                <h4>Duration</h4>
                                                <p>{selectedProduct.duration}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedProduct.level && (
                                        <div className="detail-item">
                                            <span className="icon"><i className="fas fa-signal"></i></span>
                                            <div className="content">
                                                <h4>Skill Level</h4>
                                                <p>{selectedProduct.level}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="popup-actions">
                                    <button
                                        className="popup-add-to-cart-button"
                                        onClick={() => {
                                            // Create a new product object with the selected quantity
                                            const productToAdd = {...selectedProduct};
                                            // Call the addCourseToCartFunction multiple times based on quantity
                                            for (let i = 0; i < quantity; i++) {
                                                addCourseToCartFunction(productToAdd);
                                            }
                                            closeProductPopup();
                                        }}
                                    >
                                        Add to Cart
                                    </button>
                                    <button 
                                        className="popup-wishlist-button"
                                        aria-label="Add to wishlist"
                                        // onClick={() => addToWishlist(selectedProduct)}
                                    >
                                        <i className="far fa-heart"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ShowCourseComponent;