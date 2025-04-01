import React, { useState, useEffect } from 'react';
import { Link, Navigate, } from 'react-router-dom';

    // Cart Summary Component
    export const CartSummary = ({ items, total, currency = '$' }) => {
    if (!items || items.length === 0) {
        return <p className="text-gray-500 py-4">Your cart is empty.</p>;
    }
    
    return (
        <div className="border rounded-lg p-4 mb-6 bg-gray-50">
        <h3 className="font-medium mb-3">Order Items ({items.length})</h3>
        <ul className="divide-y">
            {items.map((item) => (
            <li key={item.product.id} className="flex justify-between items-center py-3">
                <div className="flex items-center">
                {item.product.imageUrl && (
                    <img 
                    src={item.product.imageUrl} 
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded mr-3" 
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/48';
                    }}
                    />
                )}
                <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                    {currency}{typeof item.product.price === 'number' ? item.product.price.toFixed(2) : item.product.price} × {item.quantity}
                    </p>
                    {item.product.attributes && (
                    <p className="text-xs text-gray-500">
                        {Object.entries(item.product.attributes)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </p>
                    )}
                </div>
                </div>
                <span className="font-medium">{currency}{typeof item.product.price === 'number' ? (item.product.price * item.quantity).toFixed(2) : item.product.price * item.quantity}</span>
            </li>
            ))}
        </ul>
        
        <div className="mt-4 pt-3 border-t">
            <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{currency}{total.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm mt-2">
            <span>Shipping:</span>
            <span>{total >= 100 ? 'Free' : `${currency}10.00`}</span>
            </div>
            
            {total >= 100 && (
            <div className="flex justify-between text-sm mt-1 text-green-600">
                <span>Free Shipping Applied:</span>
                <span>-{currency}10.00</span>
            </div>
            )}
            
            <div className="flex justify-between text-sm mt-2">
            <span>Tax (estimated):</span>
            <span>{currency}{(total * 0.07).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between font-semibold text-lg mt-3 pt-3 border-t">
            <span>Total:</span>
            <span>{currency}{(total + (total >= 100 ? 0 : 10) + (total * 0.07)).toFixed(2)}</span>
            </div>
        </div>
        </div>
    );
    };

    // Order Confirmation Component
    export const OrderConfirmation = ({ orderId, email }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        
        <h2 className="text-2xl font-semibold mb-2">Thank you for your order!</h2>
        <p className="mb-1 text-gray-600">Your order has been placed successfully.</p>
        <p className="mb-4 font-medium">Order ID: #{orderId}</p>
        <p className="mb-4 text-sm text-gray-600">We've sent a confirmation email to <span className="font-medium">{email}</span></p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <Link
            to="/orders"
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
            >
            View My Orders
            </Link>
            <Link
            to="/"
            className=" py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
            Continue Shopping
            </Link>
        </div>
        </div>
    );
    };

// Main Checkout Component
export const Checkout = ({ cartCourses = [], totalAmount = 0, clearCart }) => {
    // const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        paymentMethod: 'credit-card',
        saveInfo: false,
        deliveryMethod: 'standard',
        deliveryInstructions: '',
        isGift: false,
        giftMessage: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [orderError, setOrderError] = useState('');
    const [localCartCourses, setLocalCartCourses] = useState([]);
    const [localTotalAmount, setLocalTotalAmount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [finalAmount, setFinalAmount] = useState(0);
    
    // Country, State, City data
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [countryId, setCountryId] = useState('');
    const [stateId, setStateId] = useState('');
    
    // Delivery options
    const deliveryOptions = [
        { id: 'pickup', name: 'Pick-up Station (Collect at your convenience)', price: 0 },
        { id: 'door', name: 'Door Delivery (Standard, 3-5 business days)', price: 5 }
    ];
    
    // Load countries data
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('https://api.countrystatecity.in/v1/countries', {
                    headers: {
                        'X-CSCAPI-KEY': 'YOUR_API_KEY_HERE' // Replace with your actual API key
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch countries');
                }
                
                const countryData = await response.json();
                setCountries(countryData);
            } catch (error) {
                console.error('Error fetching countries:', error);
            }
        };
        
        fetchCountries();
    }, []);
    
    // Load states when country changes
    useEffect(() => {
        const fetchStates = async () => {
            if (countryId) {
                try {
                    const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryId}/states`, {
                        headers: {
                            'X-CSCAPI-KEY': 'YOUR_API_KEY_HERE' // Replace with your actual API key
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch states');
                    }
                    
                    const stateData = await response.json();
                    setStates(stateData);
                    setCities([]);
                    setFormData(prev => ({
                        ...prev, 
                        state: '',
                        city: ''
                    }));
                    setStateId('');
                } catch (error) {
                    console.error('Error fetching states:', error);
                }
            }
        };
        
        fetchStates();
    }, [countryId]);
    
    // Load cities when state changes
    useEffect(() => {
        const fetchCities = async () => {
            if (stateId && countryId) {
                try {
                    const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryId}/states/${stateId}/cities`, {
                        headers: {
                            'X-CSCAPI-KEY': 'YOUR_API_KEY_HERE' // Replace with your actual API key
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch cities');
                    }
                    
                    const cityData = await response.json();
                    setCities(cityData);
                    setFormData(prev => ({
                        ...prev, 
                        city: ''
                    }));
                } catch (error) {
                    console.error('Error fetching cities:', error);
                }
            }
        };
        
        fetchCities();
    }, [stateId, countryId]);
    
    // Load cart data from localStorage/props and calculate final amount
    useEffect(() => {
        const loadCartData = () => {
            // First priority: use props if available
            if (cartCourses && cartCourses.length > 0) {
                setLocalCartCourses(cartCourses);
                setLocalTotalAmount(totalAmount);
            } else {
                // Second priority: load from localStorage
                try {
                    const savedCart = localStorage.getItem('cartCourses');
                    if (savedCart) {
                        const parsedCart = JSON.parse(savedCart);
                        setLocalCartCourses(parsedCart);
                        
                        // Get total from localStorage or calculate it
                        const savedTotal = localStorage.getItem('cartTotal');
                        if (savedTotal) {
                            setLocalTotalAmount(parseFloat(savedTotal));
                        } else {
                            const calculatedTotal = parsedCart.reduce(
                                (sum, item) => sum + (item.product.price * item.quantity), 
                                0
                            );
                            setLocalTotalAmount(calculatedTotal);
                        }
                    }
                } catch (err) {
                    console.error('Error loading cart data:', err);
                    setOrderError('There was an error loading your cart. Please try refreshing the page.');
                }
            }
        };
        
        loadCartData();
    }, [cartCourses, totalAmount]);
    
    // Calculate final amount whenever total, coupon, or delivery method changes
    useEffect(() => {
        let calculatedAmount = localTotalAmount;
        
        // Apply shipping cost if applicable
        const shippingCost = localTotalAmount >= 100 ? 0 : 10;
        
        // Add delivery cost
        const selectedDelivery = deliveryOptions.find(option => option.id === formData.deliveryMethod);
        const deliveryCost = selectedDelivery ? selectedDelivery.price : 0;
        
        // Apply taxes
        const taxAmount = localTotalAmount * 0.07;
        
        // Apply coupon if any
        if (appliedCoupon) {
            if (appliedCoupon.type === 'percentage') {
                const discountAmount = (localTotalAmount * appliedCoupon.value) / 100;
                calculatedAmount -= discountAmount;
            } else if (appliedCoupon.type === 'fixed') {
                calculatedAmount -= appliedCoupon.value;
            }
        }
        
        // Ensure total is not negative
        calculatedAmount = Math.max(0, calculatedAmount);
        
        // Add shipping, delivery, and tax
        calculatedAmount += shippingCost + deliveryCost + taxAmount;
        
        setFinalAmount(calculatedAmount);
    }, [localTotalAmount, appliedCoupon, formData.deliveryMethod]);
    
    // Load user data from localStorage if available
    useEffect(() => {
        const savedUserInfo = localStorage.getItem('userCheckoutInfo');
        if (savedUserInfo) {
            try {
                const parsedInfo = JSON.parse(savedUserInfo);
                setFormData(prevData => ({
                    ...prevData,
                    ...parsedInfo,
                    saveInfo: true
                }));
                
                // Set countryId and stateId based on saved data if available
                if (parsedInfo.countryObj) {
                    setCountryId(parsedInfo.countryObj.id);
                    if (parsedInfo.stateObj) {
                        setStateId(parsedInfo.stateObj.id);
                    }
                }
            } catch (err) {
                console.error('Error parsing saved user info:', err);
            }
        }
    }, []);
    
    // Track last clicked product for analytics
    useEffect(() => {
        const lastClickedProductId = localStorage.getItem('lastClickedProductId');
        if (lastClickedProductId) {
            // You could use this for analyticsitems or recommendations
            // This could be connected to a proper analytics service
        }
    }, []);
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }
        
        if (!formData.country) {
            newErrors.country = 'Country is required';
        }
        
        if (!formData.state) {
            newErrors.state = 'State is required';
        }
        
        if (!formData.city) {
            newErrors.city = 'City is required';
        }
        
        if (!formData.zipCode.trim()) {
            newErrors.zipCode = 'ZIP code is required';
        } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
            newErrors.zipCode = 'Please enter a valid ZIP code';
        }
        
        if (formData.isGift && !formData.giftMessage.trim()) {
            newErrors.giftMessage = 'Gift message is localCartCoursesrequired when sending as a gift';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });

        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };
    
    const handleCountryChange = (e) => {
        const selectedCountryId = e.target.value;
        setCountryId(selectedCountryId);
        
        const selectedCountry = countries.find(country => country.id === selectedCountryId || country.iso2 === selectedCountryId);
        setFormData({ 
            ...formData, 
            country: selectedCountryId,
            countryObj: selectedCountry
        });
        
        if (errors.country) {
            setErrors({ ...errors, country: '' });
        }
    };
    
    const handleStateChange = (e) => {
        const selectedStateId = e.target.value;
        setStateId(selectedStateId);
        
        const selectedState = states.find(state => state.id === selectedStateId || state.iso2 === selectedStateId);
        setFormData({ 
            ...formData, 
            state: selectedStateId,
            stateObj: selectedState
        });
        
        if (errors.state) {
            setErrors({ ...errors, state: '' });
        }
    };
    
    const handleCityChange = (e) => {
        const selectedCityId = e.target.value;
        
        const selectedCity = cities.find(city => city.id === selectedCityId);
        setFormData({ 
            ...formData, 
            city: selectedCityId,
            cityObj: selectedCity
        });
        
        if (errors.city) {
            setErrors({ ...errors, city: '' });
        }
    };
    
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }
        
        setIsApplyingCoupon(true);
        setCouponError('');
        
        try {
            // This would be a real API call in production
            // Simulating API call with timeout
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verify the coupon code (in a real app, this would be an API call)
            if (couponCode.toLowerCase() === 'welcome10') {
                setAppliedCoupon({
                    code: couponCode,
                    type: 'percentage',
                    value: 10,
                    description: '10% off your entire order'
                });
            } else if (couponCode.toLowerCase() === 'newuser') {
                setAppliedCoupon({
                    code: couponCode,
                    type: 'fixed',
                    value: 15,
                    description: '$15 off your order'
                });
            } else {
                setCouponError('Invalid or expired coupon code');
            }
        } catch (err) {
            setCouponError('Error applying coupon. Please try again.');
        } finally {
            setIsApplyingCoupon(false);
        }
    };
    
    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
    };
    
    // Function to check if items are in stock
    const checkStock = async () => {
        try {
                    // Check if all items are in stock
                    const stockStatus = await Promise.all(localCartCourses.map(async item => {
                        // Simulated stock check
                        const isInStock = Math.random() > 0.1; // 90% chance item is in stock
                        return {
                            id: item.product.id,
                            inStock: isInStock,
                            quantity: item.quantity
                        };
                    }));

                    const outOfStockItems = stockStatus.filter(item => !item.inStock);
                    if (outOfStockItems.length > 0) {
                        throw new Error('Some items in your cart are no longer in stock. Please remove them and try again.');
                    }
 // In a real application, this would be an API call
            // Simulating API call with timeout
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // For this example, we'll assume all items are in stock
            return true;
            
            // In a real application, it would look something like:
            /*
            const response = await fetch('http://127.0.0.1:5000/check-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: items.map(i => ({ id: i.product.id, quantity: i.quantity })) })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message);
            }
            
            return true;
            */
        } catch (err) {
            setOrderError(err.message || 'Could not verify stock availability. Please try again.');
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            window.scrollTo(0, 0);
            return;
        }

        // Check if cart has items
        if (!localCartCourses || localCartCourses.length === 0) {
            setOrderError('Your cart is empty. Please add items before checkout.');
            return;
        }
        
        // Check stock availability
        const stockAvailable = await checkStock();
        if (!stockAvailable) {
            return;
        }

        setIsSubmitting(true);
        setOrderError('');

        try {
            // Save user info if requested
            if (formData.saveInfo) {
                const userInfoToSave = { ...formData };
                delete userInfoToSave.saveInfo; // Don't need to save this flag
                localStorage.setItem('userCheckoutInfo', JSON.stringify(userInfoToSave));
            } else {
                localStorage.removeItem('userCheckoutInfo');
            }
            
            // Get selected delivery option
            const selectedDelivery = deliveryOptions.find(option => option.id === formData.deliveryMethod);
            
            // Prepare order data
            const order = {
                customer: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone
                },
                shipping: {
                    address: formData.address,
                    city: formData.cityObj ? formData.cityObj.name : '',
                    state: formData.stateObj ? formData.stateObj.name : '',
                    zipCode: formData.zipCode,
                    country: formData.countryObj ? formData.countryObj.name : '',
                    cost: localTotalAmount >= 100 ? 0 : 10
                },
                delivery: {
                    method: formData.deliveryMethod,
                    name: selectedDelivery ? selectedDelivery.name : '',
                    cost: selectedDelivery ? selectedDelivery.price : 0,
                    instructions: formData.deliveryInstructions,
                    isGift: formData.isGift,
                    giftMessage: formData.isGift ? formData.giftMessage : ''
                },
                items: localCartCourses,
                payment: {
                    method: formData.paymentMethod,
                    // Other payment details would go here
                },
                subtotal: localTotalAmount,
                tax: localTotalAmount * 0.07,
                discount: appliedCoupon ? (
                    appliedCoupon.type === 'percentage' 
                        ? (localTotalAmount * appliedCoupon.value / 100) 
                        : appliedCoupon.value
                ) : 0,
                total: finalAmount,
                couponApplied: appliedCoupon ? appliedCoupon.code : null,
                orderDate: new Date().toISOString()
            };

            // In a real application, you would send this data to your server
            console.log("Sending order data:", JSON.stringify(order));

            // Simulate API call with timeout
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo purposes, we'll generate a random order ID
            const generatedOrderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
            setOrderId(generatedOrderId);
            setOrderPlaced(true);
            
            // Clear cart
            if (clearCart && typeof clearCart === 'function') {
                clearCart();
            } else {
                localStorage.removeItem('cartCourses');
                localStorage.removeItem('cartTotal');
                localStorage.removeItem('lastClickedProductId');
            }
        } catch (err) {
            console.error("Order submission error:", err);
            setOrderError(err.message || 'An error occurred while processing your order. Please try again.');
            window.scrollTo(0, 0);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold mb-6">Checkout</h1>

                {orderPlaced ? (
                    <OrderConfirmation 
                        orderId={orderId} 
                        email={formData.email}
                    />
                ) : (
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Left Column - Customer Information */}
                            <div className="md:col-span-2">
                                <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm mb-6">
                                    {orderError && (
                                        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
                                            {orderError}
                                        </div>
                                    )}
                                    
                                    <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
                                    <form onSubmit={handleSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label htmlFor="firstName" className="block mb-1 text-sm font-medium">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="firstName"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    className={`w-full p-2 border rounded-md ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                                                />
                                                {errors.firstName && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <label htmlFor="lastName" className="block mb-1 text-sm font-medium">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="lastName"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleInputChange}
                                                    className={`w-full p-2 border rounded-md ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                                                />
                                                {errors.lastName && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <label htmlFor="email" className="block mb-1 text-sm font-medium">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className={`w-full p-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                                />
                                                {errors.email && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <label htmlFor="phone" className="block mb-1 text-sm font-medium">
                                                    Phone Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className={`w-full p-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                                />
                                                {errors.phone && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                                        <div className="grid grid-cols-1 gap-4 mb-6">
                                            <div>
                                                <label htmlFor="address" className="block mb-1 text-sm font-medium">
                                                    Street Address
                                                </label>
                                                <input
                                                    type="text"
                                                    id="address"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    className={`w-full p-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                                                />
                                                {errors.address && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <label htmlFor="country" className="block mb-1 text-sm font-medium">
                                                    Country
                                                </label>
                                                <select
                                                    id="country"
                                                    name="country"
                                                    value={countryId}
                                                    onChange={handleCountryChange}
                                                    className={`w-full p-2 border rounded-md ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
                                                >
                                                    <option value="">Select Country</option>
                                                    {countries.map((country) => (
                                                        <option key={country.id} value={country.id}>
                                                            {country.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.country && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="state" className="block mb-1 text-sm font-medium">
                                                        State / Province
                                                    </label>
                                                    <select
                                                        id="state"
                                                        name="state"
                                                        value={stateId}
                                                        onChange={handleStateChange}
                                                        disabled={!countryId}
                                                        className={`w-full p-2 border rounded-md ${errors.state ? 'border-red-500' : 'border-gray-300'} ${!countryId ? 'bg-gray-100' : ''}`}
                                                    >
                                                        <option value="">Select State</option>
                                                        {states.map((state) => (
                                                            <option key={state.id} value={state.id}>
                                                                {state.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.state && (
                                                        <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label htmlFor="city" className="block mb-1 text-sm font-medium">
                                                        City
                                                    </label>
                                                    <select
                                                        id="city"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleCityChange}
                                                        disabled={!stateId}
                                                        className={`w-full p-2 border rounded-md ${errors.city ? 'border-red-500' : 'border-gray-300'} ${!stateId ? 'bg-gray-100' : ''}`}
                                                    >
                                                        <option value="">Select City</option>
                                                        {cities.map((city) => (
                                                            <option key={city.id} value={city.id}>
                                                                {city.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.city && (
                                                        <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label htmlFor="zipCode" className="block mb-1 text-sm font-medium">
                                                    ZIP / Postal Code
                                                </label>
                                                <input
                                                    type="text"
                                                    id="zipCode"
                                                    name="zipCode"
                                                    value={formData.zipCode}
                                                    onChange={handleInputChange}
                                                    className={`w-full p-2 border rounded-md ${errors.zipCode ? 'border-red-500' : 'border-gray-300'}`}
                                                />
                                                {errors.zipCode && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <h2 className="text-xl font-semibold mb-4">Delivery Options</h2>
                                        <div className="mb-6">
                                            {deliveryOptions.map((option) => (
                                                <div key={option.id} className="mb-2">
                                                    <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                                                        <input
                                                            type="radio"
                                                            name="deliveryMethod"
                                                            value={option.id}
                                                            checked={formData.deliveryMethod === option.id}
                                                            onChange={handleInputChange}
                                                            className="mr-2"
                                                        />
                                                        <div>
                                                            <span className="font-medium">{option.name}</span>
                                                            <span className="ml-2 text-gray-500">
                                                                {option.price === 0 ? 'Free' : `$${option.price.toFixed(2)}`}
                                                            </span>
                                                        </div>
                                                    </label>
                                                </div>
                                            ))}
                                            
                                            <div className="mt-4">
                                                <label htmlFor="deliveryInstructions" className="block mb-1 text-sm font-medium">
                                                    Delivery Instructions (Optional)
                                                </label>
                                                <textarea
                                                    id="deliveryInstructions"
                                                    name="deliveryInstructions"
                                                    value={formData.deliveryInstructions}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                    rows="2"
                                                    placeholder="Special instructions for delivery..."
                                                />
                                            </div>
                                            
                                            <div className="mt-4">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        name="isGift"
                                                        checked={formData.isGift}
                                                        onChange={handleInputChange}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm font-medium">This is a gift</span>
                                                </label>
                                                
                                                {formData.isGift && (
                                                    <div className="mt-3">
                                                        <label htmlFor="giftMessage" className="block mb-1 text-sm font-medium">
                                                            Gift Message
                                                        </label>
                                                        <textarea
                                                            id="giftMessage"
                                                            name="giftMessage"
                                                            value={formData.giftMessage}
                                                            onChange={handleInputChange}
                                                            className={`w-full p-2 border rounded-md ${errors.giftMessage ? 'border-red-500' : 'border-gray-300'}`}
                                                            rows="3"
                                                            placeholder="Add your gift message here..."
                                                        />
                                                        {errors.giftMessage && (
                                                            <p className="text-red-500 text-xs mt-1">{errors.giftMessage}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                                        <div className="mb-6">
                                            <div className="mb-2">
                                                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value="credit-card"
                                                        checked={formData.paymentMethod === 'credit-card'}
                                                        onChange={handleInputChange}
                                                        className="mr-2"
                                                    />
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-2">Credit Card</span>
                                                        <div className="flex space-x-1">
                                                            <span className="text-blue-600">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                                </svg>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                            
                                            <div className="mb-2">
                                                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value="paypal"
                                                        checked={formData.paymentMethod === 'paypal'}
                                                        onChange={handleInputChange}
                                                        className="mr-2"
                                                    />
                                                    <span className="font-medium">PayPal</span>
                                                </label>
                                            </div>
                                            
                                            <div className="mt-4">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        name="saveInfo"
                                                        checked={formData.saveInfo}
                                                        onChange={handleInputChange}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">Save my information for faster checkout next time</span>
                                                </label>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 pt-6 border-t">
                                            <button
                                                type="submit"
                                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    'Complete Order'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            
                            {/* Right Column - Order Summary */}
                            <div className="md:col-span-1">
                                <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm sticky top-4">
                                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                                    
                                    <CartSummary 
                                        items={localCartCourses}
                                        total={localTotalAmount}
                                    />
                                    
                                    <div className="mb-6">
                                        <h3 className="font-medium mb-3">Delivery Method</h3>
                                        <div className="text-sm">
                                            {deliveryOptions.find(option => option.id === formData.deliveryMethod)?.name || 'Standard Delivery'}
                                            <span className="float-right">
                                                {formData.deliveryMethod === 'standard' ? 'Free' : 
                                                 `$${deliveryOptions.find(option => option.id === formData.deliveryMethod)?.price.toFixed(2) || '0.00'}`}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Coupon Section */}
                                    <div className="mb-6 pb-4 border-b">
                                        <h3 className="font-medium mb-3">Apply Coupon</h3>
                                        {appliedCoupon ? (
                                            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                                                        <p className="text-sm text-green-700">{appliedCoupon.description}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={removeCoupon}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    placeholder="Enter coupon code"
                                                    value={couponCode}
                                                    onChange={(e) => {
                                                        setCouponCode(e.target.value);
                                                        setCouponError('');
                                                    }}
                                                    className="flex-grow p-2 border rounded-l-md"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleApplyCoupon}
                                                    disabled={isApplyingCoupon}
                                                    className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-r-md whitespace-nowrap"
                                                >
                                                    {isApplyingCoupon ? 'Applying...' : 'Apply'}
                                                </button>
                                            </div>
                                        )}
                                        {couponError && (
                                            <p className="text-red-500 text-xs mt-1">{couponError}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-medium mb-3">Final Price</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>${localTotalAmount.toFixed(2)}</span>
                                            </div>
                                            
                                            <div className="flex justify-between">
                                                <span>Shipping:</span>
                                                <span>{localTotalAmount >= 100 ? 'Free' : '$10.00'}</span>
                                            </div>
                                            
                                            <div className="flex justify-between">
                                                <span>Delivery:</span>
                                                <span>
                                                    ${deliveryOptions.find(option => option.id === formData.deliveryMethod)?.price.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                            
                                            <div className="flex justify-between">
                                                <span>Tax (7%):</span>
                                                <span>${(localTotalAmount * 0.07).toFixed(2)}</span>
                                            </div>
                                            
                                            {appliedCoupon && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Discount ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : '$' + appliedCoupon.value}):</span>
                                                    <span>
                                                        -${appliedCoupon.type === 'percentage' 
                                                            ? ((localTotalAmount * appliedCoupon.value) / 100).toFixed(2) 
                                                            : appliedCoupon.value.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-between font-bold pt-2 border-t text-lg">
                                                <span>Total:</span>
                                                <span>${finalAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default Checkout;