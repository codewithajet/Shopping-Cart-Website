import React, { useState, useEffect, useMemo } from 'react';
import { Link, Navigate, } from 'react-router-dom';
import {CountrySelect, StateSelect, CitySelect, PhonecodeSelect} from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";

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


// Main Checkout Component

const Checkout = ({ cartCourses, totalAmount, clearCart }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneCode: '+1',
        phoneNumber: '',
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
    
    // Location selection
    const [countryId, setCountryId] = useState(0);
    const [stateId, setStateId] = useState(0);
    const [cityId, setCityId] = useState(0);
    
    // API base URL from environment variable
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    
    // Delivery options
    const deliveryOptions = useMemo(() => [
        { id: 'standard', name: 'Standard Delivery (3-5 business days)', price: 5 },
        { id: 'pickup', name: 'Pick-up Station (Collect at your convenience)', price: 0 }
    ], []);
    
    // Load cart data
    useEffect(() => {
        const loadCartData = () => {
            if (cartCourses && cartCourses.length > 0) {
                setLocalCartCourses(cartCourses);
                setLocalTotalAmount(totalAmount);
            } else {
                try {
                    const savedCart = localStorage.getItem('cartCourses');
                    if (savedCart) {
                        const parsedCart = JSON.parse(savedCart);
                        setLocalCartCourses(parsedCart);
                        
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
    
    // Calculate final amount
    useEffect(() => {
        let calculatedAmount = localTotalAmount;
        
        // Free shipping for orders over $100, otherwise $10
        const shippingCost = localTotalAmount >= 100 ? 0 : 10;
        
        // Get delivery cost based on selected method
        const selectedDelivery = deliveryOptions.find(option => option.id === formData.deliveryMethod);
        const deliveryCost = selectedDelivery ? selectedDelivery.price : 0;
        
        // Calculate tax (7%)
        const taxAmount = localTotalAmount * 0.07;
        
        // Apply coupon if available
        if (appliedCoupon) {
            if (appliedCoupon.type === 'percentage') {
                const discountAmount = (localTotalAmount * appliedCoupon.value) / 100;
                calculatedAmount -= discountAmount;
            } else if (appliedCoupon.type === 'fixed') {
                calculatedAmount -= appliedCoupon.value;
            }
        }
        
        // Ensure amount is never negative
        calculatedAmount = Math.max(0, calculatedAmount);
        
        // Add shipping, delivery, and tax
        calculatedAmount += shippingCost + deliveryCost + taxAmount;
        
        setFinalAmount(calculatedAmount);
    }, [localTotalAmount, appliedCoupon, formData.deliveryMethod, deliveryOptions]);
    
    // Load user data
    useEffect(() => {
        const loadSavedUserInfo = () => {
            const savedUserInfo = localStorage.getItem('userCheckoutInfo');
            if (savedUserInfo) {
                try {
                    const parsedInfo = JSON.parse(savedUserInfo);
                    setFormData(prevData => ({
                        ...prevData,
                        ...parsedInfo,
                        saveInfo: true
                    }));
                    
                    if (parsedInfo.countryId) {
                        setCountryId(parsedInfo.countryId);
                        if (parsedInfo.stateId) {
                            setStateId(parsedInfo.stateId);
                            if (parsedInfo.cityId) {
                                setCityId(parsedInfo.cityId);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error parsing saved user info:', err);
                }
            }
        };
        
        loadSavedUserInfo();
    }, []);
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        } else {
            // Remove all non-digit characters for validation
            const cleanedPhone = formData.phoneNumber.replace(/\D/g, '');
            if (cleanedPhone.length < 6) {
                newErrors.phoneNumber = 'Please enter a valid phone number';
            }
        }
        
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.country.trim()) newErrors.country = 'Country is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        
        if (!formData.zipCode.trim()) {
            newErrors.zipCode = 'ZIP code is required';
        } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
            newErrors.zipCode = 'Please enter a valid ZIP code';
        }
        
        if (formData.isGift && !formData.giftMessage.trim()) {
            newErrors.giftMessage = 'Gift message is required when sending as a gift';
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
    
    const handlePhoneCodeChange = (code) => {
        setFormData({
            ...formData,
            phoneCode: code
        });
    };

    const handlePhoneNumberChange = (e) => {
        const { value } = e.target;
        setFormData({
            ...formData,
            phoneNumber: value
        });
        
        if (errors.phoneNumber) {
            setErrors({ ...errors, phoneNumber: '' });
        }
    };
    
    const handleCountryChange = (countryData) => {
        if (countryData) {
            setCountryId(countryData.id);
            setStateId(0);
            setCityId(0);
            
            setFormData({
                ...formData,
                country: countryData.name,
                countryId: countryData.id,
                state: '',
                city: ''
            });
            
            if (errors.country) {
                setErrors({ ...errors, country: '' });
            }
        }
    };
    
    const handleStateChange = (stateData) => {
        if (stateData) {
            setStateId(stateData.id);
            setCityId(0);
            
            setFormData({
                ...formData,
                state: stateData.name,
                stateId: stateData.id,
                city: ''
            });
            
            if (errors.state) {
                setErrors({ ...errors, state: '' });
            }
        }
    };
    
    const handleCityChange = (cityData) => {
        if (cityData) {
            setCityId(cityData.id);
            
            setFormData({
                ...formData,
                city: cityData.name,
                cityId: cityData.id
            });
            
            if (errors.city) {
                setErrors({ ...errors, city: '' });
            }
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
            const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: couponCode,
                    subtotal: localTotalAmount
                }),
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || 'Failed to validate coupon');
            }
    
            if (!data.valid) {
                throw new Error(data.message || 'Invalid coupon');
            }
    
            setAppliedCoupon({
                code: data.coupon.code,
                type: data.coupon.discount_type,
                value: data.coupon.discount_value,
                description: `Coupon applied (${data.coupon.discount_type === 'percentage' 
                    ? `${data.coupon.discount_value}% off` 
                    : `$${data.coupon.discount_value} off`})`,
                couponData: data.coupon
            });
    
        } catch (err) {
            setCouponError(err.message || 'Error applying coupon. Please try again.');
        } finally {
            setIsApplyingCoupon(false);
        }
    };
    
    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
    };
    
    const checkStock = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/check-stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: localCartCourses.map(item => ({
                        productId: item.product.id,
                        quantity: item.quantity
                    }))
                }),
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || 'Could not verify stock availability');
            }
    
            if (data.outOfStockItems && data.outOfStockItems.length > 0) {
                const outOfStockNames = data.outOfStockItems.map(item => item.name).join(', ');
                throw new Error(`Some items in your cart are no longer available: ${outOfStockNames}`);
            }
    
            return true;
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
    
        if (!localCartCourses || localCartCourses.length === 0) {
            setOrderError('Your cart is empty. Please add items before checkout.');
            return;
        }
        
        const stockAvailable = await checkStock();
        if (!stockAvailable) {
            return;
        }
    
        setIsSubmitting(true);
        setOrderError('');
    
        try {
            // Format full phone number with country code
            const fullPhoneNumber = `${formData.phoneCode}${formData.phoneNumber.replace(/\D/g, '')}`;
            
            if (formData.saveInfo) {
                const userInfoToSave = { 
                    ...formData,
                    countryId,
                    stateId,
                    cityId
                };
                delete userInfoToSave.saveInfo;
                localStorage.setItem('userCheckoutInfo', JSON.stringify(userInfoToSave));
            } else {
                localStorage.removeItem('userCheckoutInfo');
            }
            
            const selectedDelivery = deliveryOptions.find(option => option.id === formData.deliveryMethod);
            const deliveryCost = selectedDelivery ? selectedDelivery.price : 0;
            const shippingCost = localTotalAmount >= 100 ? 0 : 10;
            const taxAmount = localTotalAmount * 0.07;
            
            const orderData = {
                customer_name: `${formData.firstName} ${formData.lastName}`,
                customer_email: formData.email,
                customer_phone: fullPhoneNumber,
                shipping_address: formData.address,
                shipping_city: formData.city,
                shipping_state: formData.state,
                shipping_country: formData.country,
                shipping_zip_code: formData.zipCode,
                delivery_method: formData.deliveryMethod,
                delivery_instructions: formData.deliveryInstructions,
                is_gift: formData.isGift,
                gift_message: formData.isGift ? formData.giftMessage : '',
                subtotal: localTotalAmount,
                shipping_cost: shippingCost,
                delivery_cost: deliveryCost,
                tax_amount: taxAmount,
                total_amount: finalAmount,
                payment_method: formData.paymentMethod,
                items: localCartCourses.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.product.price,
                    attributes: {
                        name: item.product.title,
                        image: item.product.image
                    }
                })),
                coupon: appliedCoupon ? {
                    code: appliedCoupon.code,
                    discount_type: appliedCoupon.type,
                    discount_value: appliedCoupon.value
                } : null
            };
    
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error(data.message || 'Invalid order data. Please check your information.');
                } else if (response.status === 409) {
                    throw new Error('Some items in your cart have changed. Please refresh your cart.');
                } else if (response.status === 422) {
                    throw new Error('Payment processing failed. Please check your payment details.');
                } else {
                    throw new Error(data.message || 'Failed to place order');
                }
            }
    
            setOrderId(data.order_number);
            setOrderPlaced(true);
            
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
    
    if (orderPlaced) {
        return <OrderConfirmation orderId={orderId} email={formData.email} totalAmount={finalAmount} />;
    }
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
                                                <label htmlFor="phoneNumber" className="block mb-1 text-sm font-medium">
                                                    Phone Number
                                                </label>
                                                <div className="flex">
                                                    <PhonecodeSelect
                                                        value={formData.phoneCode}
                                                        onChange={handlePhoneCodeChange}
                                                        className="w-24 p-2 border rounded-l-md border-gray-300"
                                                    />
                                                    <input
                                                        type="tel"
                                                        id="phoneNumber"
                                                        name="phoneNumber"
                                                        value={formData.phoneNumber}
                                                        onChange={handlePhoneNumberChange}
                                                        className={`flex-1 p-2 border rounded-r-md ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                                                        placeholder="Phone number"
                                                    />
                                                </div>
                                                {errors.phoneNumber && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
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
                                                <label className="block mb-1 text-sm font-medium">
                                                    Country
                                                </label>
                                                <CountrySelect
                                                    onChange={handleCountryChange}
                                                    placeHolder="Select Country"
                                                    containerClassName={`w-full ${errors.country ? 'border-red-500' : ''}`}
                                                    inputClassName={`w-full p-2 border rounded-md ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
                                                    value={countryId || ""}
                                                />
                                                {errors.country && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium">
                                                        State / Province
                                                    </label>
                                                    <StateSelect
                                                        countryid={countryId}
                                                        onChange={handleStateChange}
                                                        placeHolder="Select State"
                                                        containerClassName={`w-full ${errors.state ? 'border-red-500' : ''}`}
                                                        inputClassName={`w-full p-2 border rounded-md ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                                                        value={stateId || ""}
                                                        disabled={!countryId}
                                                    />
                                                    {errors.state && (
                                                        <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium">
                                                        City
                                                    </label>
                                                    <CitySelect
                                                        countryid={countryId}
                                                        stateid={stateId}
                                                        onChange={handleCityChange}
                                                        placeHolder="Select City"
                                                        containerClassName={`w-full ${errors.city ? 'border-red-500' : ''}`}
                                                        inputClassName={`w-full p-2 border rounded-md ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                                                        value={cityId || ""}
                                                        disabled={!stateId}
                                                    />
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
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-2">PayPal</span>
                                                        <div className="flex space-x-1">
                                                            <span className="text-blue-600">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                </svg>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>

                                            <div>
                                                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value="bank-transfer"
                                                        checked={formData.paymentMethod === 'bank-transfer'}
                                                        onChange={handleInputChange}
                                                        className="mr-2"
                                                    />
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-2">Bank Transfer</span>
                                                        <div className="flex space-x-1">
                                                            <span className="text-blue-600">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                                                </svg>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="saveInfo"
                                                    checked={formData.saveInfo}
                                                    onChange={handleInputChange}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">Save this information for future orders</span>
                                            </label>
                                        </div>

                                        <div className="mt-8">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className={`w-full py-3 px-4 text-white font-medium rounded-md ${
                                                    isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                                                }`}
                                            >
                                                {isSubmitting ? 'Processing Order...' : 'Place Order'}
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

// Order Confirmation Component
const OrderConfirmation = ({ orderId, email }) => {
    return (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm">
            <div className="text-center mb-6">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
                <p className="text-gray-600">Thank you for your purchase</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="flex flex-col md:flex-row justify-between mb-4">
                    <div className="mb-2 md:mb-0">
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="font-medium">{orderId}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Confirmation sent to</p>
                        <p className="font-medium">{email}</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600">
                    We'll send you shipping confirmation when your items are on the way!
                </p>
            </div>
            
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">What happens next?</h2>
                <div className="space-y-4">
                    <div className="flex">
                        <div className="flex-shrink-0 mr-3">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium">Order Confirmation</h3>
                            <p className="text-sm text-gray-600">
                                You'll receive an email confirmation with your order details.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="flex-shrink-0 mr-3">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium">Order Processing</h3>
                            <p className="text-sm text-gray-600">
                                We'll start processing your order right away.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="flex-shrink-0 mr-3">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium">Shipping & Delivery</h3>
                            <p className="text-sm text-gray-600">
                                We'll notify you when your items ship and provide tracking information.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="text-center space-y-4">
                <button 
                    type="button"
                    onClick={() => window.location.href = '/'}
                    className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                    Continue Shopping
                </button>
                
                <p className="text-sm text-gray-600">
                    Have a question? <a href="/contact" className="text-blue-600 hover:text-blue-800">Contact our support team</a>
                </p>
            </div>
        </div>
    );
};

export default Checkout;