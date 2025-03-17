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
    const navigate = useNavigate();

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
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>

            {orderPlaced ? (
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h2 className="text-2xl font-semibold mb-4">Thank you for your order!</h2>
                    <p className="text-gray-600 mb-4">Your order has been placed successfully.</p>
                    <Link
                        to="/"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                    {!localCartCourses || localCartCourses.length === 0 ? (
                        <p className="text-gray-600 mb-4">Your cart is empty.</p>
                    ) : (
                        <>
                            <ul className="mb-6">
                                {localCartCourses.map((item) => (
                                    <li key={item.product.id} className="flex justify-between items-center border-b py-2">
                                        <span>{item.product.name} (x{item.quantity})</span>
                                        <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xl font-semibold mb-6">Total: ${(localTotalAmount || 0).toFixed(2)}</p>
                        </>
                    )}

                    <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                    {orderError && (
                        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                            {orderError}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                        errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                        errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="address" className="block text-gray-700 mb-1">Shipping Address</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                        errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                ></textarea>
                                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                            </div>

                            <div>
                                <label htmlFor="paymentMethod" className="block text-gray-700 mb-1">Payment Method</label>
                                <select
                                    id="paymentMethod"
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="credit-card">Credit Card</option>
                                    <option value="debit-card">Debit Card</option>
                                    <option value="paypal">PayPal</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !localCartCourses || localCartCourses.length === 0}
                                className={`w-full py-2 px-4 rounded-lg text-white font-semibold ${
                                    isSubmitting || !localCartCourses || localCartCourses.length === 0
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                }`}
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