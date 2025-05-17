import React, { useState, useEffect, useCallback } from 'react';
import OrderManagement from './OrderMangement';

const OrderDataFetcher = () => {
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [filterStatus, setFilterStatus] = useState('all');
const [searchTerm, setSearchTerm] = useState('');
const [dateRange, setDateRange] = useState({ from: '', to: '' });

// Define the base API URL - replace with your actual backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://shopping-cart-5wj4.onrender.com';

const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}/orders`);
    
    if (filterStatus !== 'all') {
        url.searchParams.append('status', filterStatus);
    }
    
    if (dateRange.from) {
        url.searchParams.append('from_date', dateRange.from);
    }
    
    if (dateRange.to) {
        url.searchParams.append('to_date', dateRange.to);
    }
    
    if (searchTerm) {
        url.searchParams.append('search', searchTerm);
    }
    
    console.log('Fetching orders from:', url.toString());
    
    // Make the API request
    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // If using token authentication
        }
    });
    
    // Check if response is ok
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    
    // Parse the response data
    const data = await response.json();
    
    console.log('Received data:', data);
    
    // Make sure we're extracting the orders array correctly
    // Adjust this based on your API response structure
    let receivedOrders = data.orders || data.data || data;
    
    if (!Array.isArray(receivedOrders)) {
        console.error('Expected an array of orders but got:', receivedOrders);
        throw new Error('Invalid data format received from server');
    }
    
    // Ensure each order has an items array
    receivedOrders = receivedOrders.map(order => {
        return {
        ...order,
        // Ensure items is an array, if it doesn't exist or isn't an array
        items: Array.isArray(order.items) ? order.items : [],
        // Ensure other required properties have defaults
        payments: Array.isArray(order.payments) ? order.payments : [{ payment_method: 'unknown', transaction_id: 'N/A' }],
        notes: Array.isArray(order.notes) ? order.notes : [],
        customer_name: order.customer_name || 'Unknown Customer',
        customer_email: order.customer_email || 'N/A',
        customer_phone: order.customer_phone || 'N/A',
        shipping_address: order.shipping_address || 'N/A',
        shipping_city: order.shipping_city || 'N/A',
        shipping_state: order.shipping_state || 'N/A',
        shipping_zip_code: order.shipping_zip_code || 'N/A',
        shipping_country: order.shipping_country || 'N/A',
        subtotal: order.subtotal || 0,
        shipping_cost: order.shipping_cost || 0,
        tax_amount: order.tax_amount || 0,
        discount_amount: order.discount_amount || 0,
        total_amount: order.total_amount || 0,
        payment_status: order.payment_status || 'pending'
        };
    });
    
    // Update state with the fetched orders
    setOrders(receivedOrders);
    setLoading(false);
    } catch (err) {
    console.error('Error fetching orders:', err);
    setError(err.message || 'Failed to fetch orders. Please try again.');
    setLoading(false);
    }
}, [API_BASE_URL, filterStatus, dateRange, searchTerm]);

// Fetch orders on component mount
useEffect(() => {
    fetchOrders();
}, []);

// Function to update order status
const updateOrderStatus = async (orderNumber, newStatus) => {
    try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/status`, {
        method: 'PATCH',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update order status. Server returned ${response.status}`);
    }
    
    // Update the local state to reflect the change
    setOrders(orders.map(order => 
        order.order_number === orderNumber 
        ? { ...order, order_status: newStatus } 
        : order
    ));
    
    return true;
    } catch (err) {
    console.error('Error updating order status:', err);
    setError('Failed to update order status. Please try again.');
    return false;
    }
};

return (
    <OrderManagement 
    orders={orders}
    loading={loading}
    error={error}
    fetchOrders={fetchOrders}
    updateOrderStatus={updateOrderStatus}
    filterStatus={filterStatus}
    setFilterStatus={setFilterStatus}
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    dateRange={dateRange}
    setDateRange={setDateRange}
    />
);
};

export default OrderDataFetcher;