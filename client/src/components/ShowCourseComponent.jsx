import { ArrowLeft, ArrowRight, X, Minus, Plus, Heart, Clock, Signal, Package, Tag, Star, StarHalf, RotateCcw } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

// Helper function to format number with commas for Naira
function formatNaira(amount) {
    if (isNaN(amount)) return amount;
    // Remove decimals for Naira if you want: return Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 0 });
    return Number(amount).toLocaleString('en-NG');
}

function ShowCourseComponent({ filterCourseFunction, addCourseToCartFunction }) {
    // State to track which product is selected for the popup
    const [selectedProduct, setSelectedProduct] = useState(null);
    // Add state for quantity in popup
    const [quantity, setQuantity] = useState(1);
    // Reference for popup content
    const popupContentRef = useRef(null);
    // Add state to track current image index in the swiper
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Function to open the popup with the selected product
    const openProductPopup = (product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setCurrentImageIndex(0);
        document.body.classList.add('popup-open');
    };
    
    // Function to close the popup
    const closeProductPopup = () => {
        setSelectedProduct(null);
        document.body.classList.remove('popup-open');
    };

    useEffect(() => {
        return () => {
            document.body.classList.remove('popup-open');
        };
    }, []);

    useEffect(() => {
        if (!selectedProduct) return;

        const handleOutsideClick = (e) => {
            if (popupContentRef.current && !popupContentRef.current.contains(e.target)) {
                closeProductPopup();
            }
        };

        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                closeProductPopup();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick, true);
        document.addEventListener('touchstart', handleOutsideClick, true);
        document.addEventListener('keydown', handleEscKey);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick, true);
            document.removeEventListener('touchstart', handleOutsideClick, true);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [selectedProduct]);
    
    const updateQuantity = (change) => {
        setQuantity(prevQuantity => Math.max(1, prevQuantity + change));
    };

    const prevImage = () => {
        if (!selectedProduct || !selectedProduct.images || selectedProduct.images.length <= 1) return;
        setCurrentImageIndex(prevIndex => 
            prevIndex === 0 ? selectedProduct.images.length - 1 : prevIndex - 1
        );
    };

    const nextImage = () => {
        if (!selectedProduct || !selectedProduct.images || selectedProduct.images.length <= 1) return;
        setCurrentImageIndex(prevIndex => 
            prevIndex === selectedProduct.images.length - 1 ? 0 : prevIndex + 1
        );
    };

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
                        {/* Display only the first product image with fallback */}
                        <div className="product-image-container">
                            {product.images && product.images.length > 0 ? (
                                <img
                                    src={`http://localhost:5000${product.images[0].startsWith('/') ? '' : '/'}${product.images[0]}`}
                                    alt={`${product.name}`}
                                    className="product-image"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/src/assets/avatar.png";
                                    }}
                                />
                            ) : (
                                <img
                                    src="/src/assets/avatar.png"
                                    alt={`${product.name} fallback`}
                                    className="product-image"
                                />
                            )}
                        </div>
                        <h2>{product.name}</h2>
                        <p className="product-price">Price: ₦{formatNaira(product.price)}</p>
                        <p className="product-description">{product.description}</p>
                        <button
                            className="add-to-cart-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                addCourseToCartFunction(product);
                            }}
                        >
                            Add to cart
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
                            <div className="popup-product-images">
                                {selectedProduct.specialOffer && (
                                    <span className="special-offer-label">Special Offer</span>
                                )}
                                <div className="main-image-container">
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
                                    <div className="rotatable-image-container">
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
                                    </div>
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
                                {selectedProduct.images && selectedProduct.images.length > 1 && (
                                    <div className="image-counter">
                                        {currentImageIndex + 1} / {selectedProduct.images.length}
                                    </div>
                                )}
                            </div>
                            
                            <div className="popup-product-content">
                                <h2>{selectedProduct.name}</h2>
                                {selectedProduct.rating && (
                                    <div className="popup-product-rating">
                                        <div className="stars">
                                            {renderStarRating(selectedProduct.rating)}
                                        </div>
                                        <span className="review-count">({selectedProduct.reviewCount || 0} reviews)</span>
                                    </div>
                                )}
                                <div className="popup-product-price">
                                    {selectedProduct.originalPrice ? (
                                        <>
                                            <span className="original-price">₦{formatNaira(selectedProduct.originalPrice)}</span>
                                            <span className="discounted-price">₦{formatNaira(selectedProduct.price)}</span>
                                        </>
                                    ) : (
                                        <span className="discounted-price">₦{formatNaira(selectedProduct.price)}</span>
                                    )}
                                </div>
                                {selectedProduct.tags && (
                                    <div className="product-tags">
                                        {selectedProduct.tags.map((tag, index) => (
                                            <span key={index} className="product-tag">{tag}</span>
                                        ))}
                                    </div>
                                )}
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
                                <div className="popup-product-description">
                                    <p>{selectedProduct.description}</p>
                                </div>
                                <div className="popup-product-details">
                                    {selectedProduct.instructor && (
                                        <div className="detail-item">
                                            <span className="icon">{/* <ChalkboardPencil size={18} /> */}</span>
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
                                <div className="popup-actions">
                                    <button
                                        className="popup-add-to-cart-button"
                                        onClick={() => {
                                            const productToAdd = {...selectedProduct};
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