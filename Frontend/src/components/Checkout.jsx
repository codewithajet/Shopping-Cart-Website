import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Checkout = ({ cartCourses = [], totalAmount = 0, clearCart }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        paymentMethod: 'credit-card',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [localCartCourses, setLocalCartCourses] = useState([]);
    const [localTotalAmount, setLocalTotalAmount] = useState(0);

    // Load cart data from localStorage on component mount
    useEffect(() => {
        // First try to use props if available
        if (cartCourses && cartCourses.length > 0) {
            setLocalCartCourses(cartCourses);
            setLocalTotalAmount(totalAmount);
        } else {
            // Otherwise load from localStorage
            try {
                const savedCart = localStorage.getItem('cartCourses');
                const savedTotal = localStorage.getItem('cartTotal');
                
                if (savedCart) {
                    const parsedCart = JSON.parse(savedCart);
                    setLocalCartCourses(parsedCart);
                    console.log("Loaded cart from localStorage:", parsedCart);
                    
                    // Use saved total or calculate if not available
                    if (savedTotal) {
                        setLocalTotalAmount(parseFloat(savedTotal));
                    } else {
                        // Calculate total if not stored
                        const calculatedTotal = parsedCart.reduce(
                            (sum, item) => sum + (item.product.price * item.quantity), 
                            0
                        );
                        setLocalTotalAmount(calculatedTotal);
                    }
                }
            } catch (err) {
                console.error('Error parsing saved cart:', err);
            }
        }
    }, [cartCourses, totalAmount]);

    // Track last clicked product for analytics
    useEffect(() => {
        const lastClickedProductId = localStorage.getItem('lastClickedProductId');
        if (lastClickedProductId) {
            console.log(`Last clicked product ID in checkout: ${lastClickedProductId}`);
            // You could use this for analytics or recommendations
        }
    }, []);

    // Debug the cart data on component mount and whenever it changes
    useEffect(() => {
        console.log("Cart data in Checkout:", {
            localCartCourses,
            localTotalAmount,
            cartLength: localCartCourses ? localCartCourses.length : 0,
        });
    }, [localCartCourses, localTotalAmount]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Name must be at least 3 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        } else if (formData.address.trim().length < 10) {
            newErrors.address = 'Address must be at least 10 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submitted", { formData });

        if (!validateForm()) {
            console.log("Form validation failed", errors);
            return;
        }

        // Check if cart has items with valid quantities
        if (!localCartCourses || localCartCourses.length === 0) {
            setOrderError('Your cart is empty. Please add items before checkout.');
            console.log("Cart is empty - validation failed");
            return;
        }

        setIsSubmitting(true);
        setOrderError('');

        try {
            const order = {
                ...formData,
                items: localCartCourses,
                totalAmount: localTotalAmount,
                lastClickedProductId: localStorage.getItem('lastClickedProductId') || null,
            };

            console.log("Sending order data:", JSON.stringify(order));

            const response = await fetch('http://127.0.0.1:5000/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(order),
            });

            console.log("Response received:", response.status);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to place order. Please try again.');
            }

            setOrderPlaced(true);
            
            // Clear cart in localStorage
            if (clearCart) {
                clearCart();
            } else {
                localStorage.removeItem('cartCourses');
                localStorage.removeItem('cartTotal');
                localStorage.removeItem('lastClickedProductId');
            }
            
            console.log("Order placed successfully!");
        } catch (err) {
            console.error("Order submission error:", err);
            setOrderError(err.message || 'An error occurred while connecting to the server. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6" style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
            <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-dark)' }}>Checkout</h1>

            {orderPlaced ? (
                <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow-md)' }} className="text-center">
                    <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-dark)' }}>Thank you for your order!</h2>
                    <p className="mb-4" style={{ color: 'var(--text-light)' }}>Your order has been placed successfully.</p>
                    <Link
                        to="/"
                        style={{ 
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            transition: 'var(--transition)'
                        }}
                        className="hover:bg-opacity-90 focus:outline-none focus:ring-2"
                    >
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow-md)' }}>
                    <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-dark)' }}>Order Summary</h2>
                    {!localCartCourses || localCartCourses.length === 0 ? (
                        <p style={{ color: 'var(--text-light)' }} className="mb-4">Your cart is empty.</p>
                    ) : (
                        <>
                            <ul className="mb-6">
                                {localCartCourses.map((item) => (
                                    <li key={item.product.id} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <span style={{ color: 'var(--text-dark)' }}>{item.product.name} (x{item.quantity})</span>
                                        <span style={{ color: 'var(--text-dark)' }}>${(item.product.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xl font-semibold mb-6" style={{ color: 'var(--text-dark)' }}>Total: ${(localTotalAmount || 0).toFixed(2)}</p>
                        </>
                    )}

                    <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-dark)' }}>Shipping Information</h2>
                    {orderError && (
                        <div style={{ backgroundColor: 'var(--danger)', color: 'white' }} className="p-3 rounded-lg mb-4">
                            {orderError}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block mb-1" style={{ color: 'var(--text-dark)' }}>Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded-lg"
                                    style={{
                                        border: `1px solid ${errors.name ? 'var(--danger)' : 'var(--border-light)'}`,
                                        transition: 'var(--transition)'
                                    }}
                                />
                                {errors.name && <p style={{ color: 'var(--danger)' }} className="text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="email" className="block mb-1" style={{ color: 'var(--text-dark)' }}>Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded-lg"
                                    style={{
                                        border: `1px solid ${errors.email ? 'var(--danger)' : 'var(--border-light)'}`,
                                        transition: 'var(--transition)'
                                    }}
                                />
                                {errors.email && <p style={{ color: 'var(--danger)' }} className="text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="address" className="block mb-1" style={{ color: 'var(--text-dark)' }}>Shipping Address</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full p-2 rounded-lg"
                                    style={{
                                        border: `1px solid ${errors.address ? 'var(--danger)' : 'var(--border-light)'}`,
                                        transition: 'var(--transition)'
                                    }}
                                ></textarea>
                                {errors.address && <p style={{ color: 'var(--danger)' }} className="text-sm mt-1">{errors.address}</p>}
                            </div>

                            <div>
                                <label htmlFor="paymentMethod" className="block mb-1" style={{ color: 'var(--text-dark)' }}>Payment Method</label>
                                <select
                                    id="paymentMethod"
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleInputChange}
                                    className="w-full p-2 rounded-lg"
                                    style={{
                                        border: '1px solid var(--border-light)',
                                        transition: 'var(--transition)'
                                    }}
                                >
                                    <option value="credit-card">Credit Card</option>
                                    <option value="debit-card">Debit Card</option>
                                    <option value="paypal">PayPal</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !localCartCourses || localCartCourses.length === 0}
                                className="w-full py-2 px-4 rounded-lg text-white font-semibold"
                                style={{
                                    backgroundColor: isSubmitting || !localCartCourses || localCartCourses.length === 0 
                                        ? 'var(--text-light)' 
                                        : 'var(--primary)',
                                    transition: 'var(--transition)',
                                    cursor: isSubmitting || !localCartCourses || localCartCourses.length === 0 
                                        ? 'not-allowed' 
                                        : 'pointer'
                                }}
                            >
                                {isSubmitting ? 'Processing...' : 'Place Order'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Checkout;