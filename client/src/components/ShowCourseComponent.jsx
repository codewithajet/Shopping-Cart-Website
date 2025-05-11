import { ArrowLeft,ArrowRight,X,Minus,Plus,Heart,Clock,Signal,Package,Tag,Star,StarHalf} from 'lucide-react';
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
    // Add state to track current image index in the swiper
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Function to open the popup with the selected product
    const openProductPopup = (product) => {
        setSelectedProduct(product);
        // Reset quantity to 1 whenever a new popup is opened
        setQuantity(1);
        // Reset current image index to 0
        setCurrentImageIndex(0);
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

    // Function to navigate to previous image
    const prevImage = () => {
        if (!selectedProduct || !selectedProduct.images || selectedProduct.images.length <= 1) return;
        
        setCurrentImageIndex(prevIndex => 
            prevIndex === 0 ? selectedProduct.images.length - 1 : prevIndex - 1
        );
    };

    // Function to navigate to next image
    const nextImage = () => {
        if (!selectedProduct || !selectedProduct.images || selectedProduct.images.length <= 1) return;
        
        setCurrentImageIndex(prevIndex => 
            prevIndex === selectedProduct.images.length - 1 ? 0 : prevIndex + 1
        );
    };

    // Function to select a specific image by index
    const selectImage = (index) => {
        setCurrentImageIndex(index);
    };
    
    // Render star rating component using Lucide icons
    const renderStarRating = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const stars = [];
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<Star key={i} className="filled-star" size={16} fill="currentColor" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<StarHalf key={i} className="half-star" size={16} fill="currentColor" />);
            } else {
                stars.push(<Star key={i} className="empty-star" size={16} />);
            }
        }
        
        return stars;
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
            
            {/* Product Popup with Enhanced Image Swiper */}
            {selectedProduct && (
                <div className="product-popup-overlay">
                    <div 
                        className="product-popup-content" 
                        ref={popupContentRef}
                    >
                        <button 
                            className="close-popup" 
                            aria-label="Close popup"
                            onClick={closeProductPopup}
                        >
                            <X size={24} />
                        </button>
                        
                        <div className="popup-product-container">
                            {/* Enhanced Image Section with Swiper */}
                            <div className="popup-product-images">
                                {selectedProduct.specialOffer && (
                                    <span className="special-offer-label">Special Offer</span>
                                )}
                                
                                {/* Main Image with Navigation Controls */}
                                <div className="main-image-container">
                                    {/* Navigation buttons */}
                                    <button 
                                        className="image-nav-button prev"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            prevImage();
                                        }}
                                        disabled={!selectedProduct.images || selectedProduct.images.length <= 1}
                                        aria-label="Previous image"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    
                                    {/* Main image display */}
                                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                        <img 
                                            src={`http://localhost:5000${selectedProduct.images[currentImageIndex].startsWith('/') ? '' : '/'}${selectedProduct.images[currentImageIndex]}`}
                                            alt={`${selectedProduct.name} - image ${currentImageIndex + 1}`}
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
                                    
                                    <button 
                                        className="image-nav-button next"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            nextImage();
                                        }}
                                        disabled={!selectedProduct.images || selectedProduct.images.length <= 1}
                                        aria-label="Next image"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                                
                                {/* Thumbnail Navigation */}
                                {selectedProduct.images && selectedProduct.images.length > 1 && (
                                    <div className="image-thumbnails">
                                        {selectedProduct.images.map((image, index) => (
                                            <div 
                                                key={index} 
                                                className={`thumbnail-container ${index === currentImageIndex ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    selectImage(index);
                                                }}
                                            >
                                                <img 
                                                    src={`http://localhost:5000${image.startsWith('/') ? '' : '/'}${image}`}
                                                    alt={`${selectedProduct.name} thumbnail ${index + 1}`}
                                                    className="thumbnail-image"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "/src/assets/avatar.png";
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Image counter indicator */}
                                {selectedProduct.images && selectedProduct.images.length > 1 && (
                                    <div className="image-counter">
                                        {currentImageIndex + 1} / {selectedProduct.images.length}
                                    </div>
                                )}
                            </div>
                            
                            {/* Content Section */}
                            <div className="popup-product-content">
                                <h2>{selectedProduct.name}</h2>
                                
                                {/* Rating with Lucide Star icons */}
                                {selectedProduct.rating && (
                                    <div className="popup-product-rating">
                                        <div className="stars">
                                            {renderStarRating(selectedProduct.rating)}
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
                                
                                {/* Quantity Selector with Lucide icons */}
                                <div className="quantity-selector">
                                    <button 
                                        onClick={() => updateQuantity(-1)}
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus size={16} />
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
                                        <Plus size={16} />
                                    </button>
                                </div>
                                
                                {/* Description */}
                                <div className="popup-product-description">
                                    <p>{selectedProduct.description}</p>
                                </div>
                                
                                {/* Additional Details with Lucide icons */}
                                <div className="popup-product-details">
                                    {selectedProduct.instructor && (
                                        <div className="detail-item">
                                            <span className="icon">
                                                {/* <ChalkboardPencil size={18} /> */}
                                            </span>
                                            <div className="content">
                                                <h4>Instructor</h4>
                                                <p>{selectedProduct.instructor}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedProduct.duration && (
                                        <div className="detail-item">
                                            <span className="icon">
                                                <Clock size={18} />
                                            </span>
                                            <div className="content">
                                                <h4>Duration</h4>
                                                <p>{selectedProduct.duration}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedProduct.level && (
                                        <div className="detail-item">
                                            <span className="icon">
                                                <Signal size={18} />
                                            </span>
                                            <div className="content">
                                                <h4>Skill Level</h4>
                                                <p>{selectedProduct.level}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedProduct.stock_quantity && (
                                        <div className="detail-item">
                                            <span className="icon">
                                                <Package size={18} />
                                            </span>
                                            <div className="content">
                                                <h4>In Stock</h4>
                                                <p>{selectedProduct.stock_quantity} available</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedProduct.category_name && (
                                        <div className="detail-item">
                                            <span className="icon">
                                                <Tag size={18} />
                                            </span>
                                            <div className="content">
                                                <h4>Category</h4>
                                                <p>{selectedProduct.category_name}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Action Buttons with Lucide icons */}
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
                                    >
                                        <Heart size={18} />
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