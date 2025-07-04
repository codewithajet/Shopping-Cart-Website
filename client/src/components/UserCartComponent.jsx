import React from 'react';
import { Link } from 'react-router-dom';

// Helper function to format number with commas for Naira
function formatNaira(amount) {
    if (isNaN(amount)) return amount;
    // If you want to always show decimals, use { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    return Number(amount).toLocaleString('en-NG');
}

function UserCartComponent({
    cartCourses,
    deleteCourseFromCartFunction,
    totalAmountCalculationFunction,
    setCartCourses,
    clearCart,
    showCart,
    setShowCart
}) {
    // Function to handle modal close
    const handleCloseModal = () => {
        setShowCart(false);
    };

    return (
        <>
            {/* Overlay for mobile modal */}
            {showCart && <div className="cart-overlay" onClick={handleCloseModal}></div>}
            
            <div className={`cart ${cartCourses.length > 0 && showCart ? 'active' : ''}`}>
                <div className="cart-header">
                    <h2>My Cart</h2>
                    <button className="close-cart-button" 
                                onClick={clearCart}>
                        ×
                    </button>
                </div>
                
                {cartCourses.length === 0 ? (
                    <p className="empty-cart">Your cart is empty.</p>
                ) : (
                    <div>
                        <div className="cart-actions">
                            <button
                                className="clear-cart-button"
                                onClick={clearCart}
                            >
                                Clear Cart
                            </button>
                        </div>
                        <ul>
                            {cartCourses.map((item) => (
                                <li key={item.product.id} className="cart-item">
                                    <div className="item-info">
                                        <div className="item-image">
                                            {/* Display product images */}
                                                {item.product.images && item.product.images.map((image, index) => (
                                                    <img
                                                        key={index}
                                                        src={
                                                            image.startsWith('http')
                                                                ? image
                                                                : `https://shopping-cart-5wj4.onrender.com${image.startsWith('/') ? '' : '/'}${image}`
                                                        }
                                                        alt={`${item.product.name} ${index + 1}`}
                                                        className="product-image"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/src/assets/avatar.png";
                                                        }}
                                                    />
                                                ))}
                                        </div>
                                        <div className="item-details">
                                            <h3>{item.product.name}</h3>
                                            <p>Price: ₦{formatNaira(item.product.price)}</p>
                                            <p>Quantity: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="item-actions">
                                        <button
                                            className="remove-button"
                                            onClick={() => deleteCourseFromCartFunction(item.product)}
                                        >
                                            Remove Product
                                        </button>
                                        <div className="quantity-controls">
                                            <button
                                                className="quantity-button"
                                                onClick={() => {
                                                    setCartCourses((prevCartCourses) =>
                                                        prevCartCourses.map((prevItem) =>
                                                            prevItem.product.id === item.product.id
                                                                ? { ...prevItem, quantity: item.quantity + 1 }
                                                                : prevItem
                                                        )
                                                    );
                                                }}
                                            >
                                                +
                                            </button>
                                            <button
                                                className="quantity-button"
                                                onClick={() => {
                                                    if (item.quantity <= 1) {
                                                        // Remove item if quantity would become 0
                                                        deleteCourseFromCartFunction(item.product);
                                                    } else {
                                                        setCartCourses((prevCartCourses) =>
                                                            prevCartCourses.map((prevItem) =>
                                                                prevItem.product.id === item.product.id
                                                                    ? { ...prevItem, quantity: item.quantity - 1 }
                                                                    : prevItem
                                                            )
                                                        );
                                                    }
                                                }}
                                            >
                                                -
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="checkout-section">
                            <div className="checkout-total">
                                <p className="total">
                                    Total Amount: ₦{formatNaira(Number(totalAmountCalculationFunction().toFixed(2)))}
                                </p>
                            </div>
                            {/* Disable the link if the cart is empty or total amount is 0 */}
                            {cartCourses.length === 0 || totalAmountCalculationFunction() === 0 ? (
                                <button className="checkout-button" disabled>
                                    Proceed to Payment
                                </button>
                            ) : (
                                <Link to="/checkout" className="checkout-button">
                                    Proceed to Payment
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default UserCartComponent;