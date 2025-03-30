import React from 'react';
import { Link } from 'react-router-dom';

function UserCartComponent({
    cartCourses,
    deleteCourseFromCartFunction,
    totalAmountCalculationFunction,
    setCartCourses,
    clearCart,
    showCart,
}) {
    return (
        <div className={`cart ${cartCourses.length > 0 && showCart ? 'active' : ''}`}>
            <h2>My Cart</h2>
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
                                                src={`http://localhost:5000/${image}`}
                                                alt={`${item.product.name} ${index + 1}`}
                                                className="product-image"
                                            />
                                        ))}
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