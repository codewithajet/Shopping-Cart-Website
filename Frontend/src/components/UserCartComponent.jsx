import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function UserCartComponent({
    cartCourses,
    deleteCourseFromCartFunction,
    totalAmountCalculationFunction,
    setCartCourses,
    clearCart,
    showCart,
}) {
    // Reference to the cart items container for scrolling
    const cartItemsRef = useRef(null);

    // Add effect to handle scroll when cart items change
    useEffect(() => {
        // Scroll to the bottom when new items are added
        if (cartItemsRef.current && showCart) {
            // Add a small delay to ensure rendering completes
            setTimeout(() => {
                cartItemsRef.current.scrollTop = cartItemsRef.current.scrollHeight;
            }, 100);
        }
    }, [cartCourses.length, showCart]);

    return (
        <div className={`cart ${cartCourses.length > 0 && showCart ? 'active' : ''} `}>
            <h2>My Cart</h2>
            {cartCourses.length === 0 ? (
                <p className="empty-cart">Your cart is empty.</p>
            ) : (
                <div className="cart-container ">
                    <div className="cart-actions">
                        <button
                            className="clear-cart-button"
                            onClick={clearCart}
                        >
                            Clear Cart
                        </button>
                    </div>
                    
                    {/* Cart items with scroll */}
                    <div className="cart-items-scroll" ref={cartItemsRef}>
                        <ul>
                            {cartCourses.map((item) => (
                                <li key={item.product.id} className="cart-item">
                                    <div className="item-info">
                                        <div className="item-image">
                                            {/* Display product images */}
                                            {item.product.images && item.product.images.map((image, index) => (
                                                <img
                                                    key={index}
                                                    src={`http://localhost:5000/${image}`}
                                                    alt={`${item.product.name} ${index + 1}`}
                                                    className="product-image"
                                                />
                                            ))}
                                            {!item.product.images && (
                                                <img
                                                    src="/src/assets/avatar.png"
                                                    alt={item.product.name}
                                                    className="product-image"
                                                />
                                            )}
                                        </div>
                                        <div className="item-details">
                                            <h3>{item.product.name}</h3>
                                            <p>Price: ${item.product.price}</p>
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
                    </div>
                    
                    <div className="checkout-section">
                        <div className="checkout-total">
                            <p className="total">Total Amount: ${totalAmountCalculationFunction().toFixed(2)}</p>
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
    );
}

export default UserCartComponent;