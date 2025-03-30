import React, { useState } from 'react';

function ShowCourseComponent({ filterCourseFunction, addCourseToCartFunction }) {
    // State to track which product is selected for the popup
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    // Function to open the popup with the selected product
    const openProductPopup = (product) => {
        setSelectedProduct(product);
    };
    
    // Function to close the popup
    const closeProductPopup = () => {
        setSelectedProduct(null);
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
                        {/* Display product images */}
                        <div className="product-images">
                            {/* {product.images && product.images.map((image, index) => (
                                <img
                                    key={index}
                                    src={`http://localhost:5000/${image}`}
                                    alt={`${product.name} ${index + 1}`}
                                    className="product-image"
                                />
                            ))} */}
                            <img src="/src/assets/avatar.png" alt="" />
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
                <div className="product-popup-overlay" onClick={closeProductPopup}>
                    <div className="product-popup-content" onClick={(e) => e.stopPropagation()}>
                        <span className="close-popup" onClick={closeProductPopup}>&times;</span>
                        
                        <div className="popup-product-images">
                            {/* {selectedProduct.images?.map((image, index) => (
                                <img
                                    key={index}
                                    src={`http://localhost:5000/${image}`}
                                    alt={`${selectedProduct.name} ${index + 1}`}
                                    className="popup-product-image" />
                            ))} */}
                            <img src="/src/assets/avatar.png" alt="" />
                        </div>
                        
                        <h2>{selectedProduct.name}</h2>
                        <p className="popup-product-price">Price: ${selectedProduct.price}</p>
                        <div className="popup-product-description">
                            <h3>Description:</h3>
                            <p>{selectedProduct.description}</p>
                        </div>
                        
                        {/* Additional product details can be shown here */}
                        {selectedProduct.instructor && (
                            <div className="popup-product-instructor">
                                <h3>Instructor:</h3>
                                <p>{selectedProduct.instructor}</p>
                            </div>
                        )}
                        
                        {selectedProduct.duration && (
                            <div className="popup-product-duration">
                                <h3>Duration:</h3>
                                <p>{selectedProduct.duration}</p>
                            </div>
                        )}
                        
                        <button
                            className="popup-add-to-cart-button"
                            onClick={() => {
                                addCourseToCartFunction(selectedProduct);
                                closeProductPopup();
                            }}
                        >
                            Add to Shopping Cart
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ShowCourseComponent;