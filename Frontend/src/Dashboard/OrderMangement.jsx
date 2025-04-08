import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Filter, Package, Truck, Check, X, RefreshCw, DollarSign, Calendar, ChevronDown, ChevronUp, User, Phone, MapPin, Clock, AlertCircle, FileText, Sliders } from 'lucide-react';

const OrderManagement = ({
    orders = [],
    loading = false,
    error = null,
    fetchOrders,
    updateOrderStatus,
    filterStatus = 'all',
    setFilterStatus,
    searchTerm = '',
    setSearchTerm,
    dateRange = { from: '', to: '' },
    setDateRange
}) => {
    const [isUpdating, setIsUpdating] = useState(null); // Will store the order number being updated
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchField, setSearchField] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [advancedFiltersApplied, setAdvancedFiltersApplied] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [setShowSearchHistory] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const searchTimeoutRef = useRef(null);
    const searchInputRef = useRef(null);
    const searchHistoryRef = useRef(null);

    // New effect to visually indicate when advanced filters are applied
    useEffect(() => {
        const hasAdvancedFilters = 
        dateRange.from !== '' || 
        dateRange.to !== '' || 
        paymentFilter !== 'all' || 
        priceRange.min !== '' || 
        priceRange.max !== '';
        
        setAdvancedFiltersApplied(hasAdvancedFilters);
    }, [dateRange, paymentFilter, priceRange]);

    const toggleOrderExpand = (orderNumber) => {
        if (expandedOrder === orderNumber) {
        setExpandedOrder(null);
        } else {
        setExpandedOrder(orderNumber);
        }
    };

    useEffect(() => {
        if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
        setSearchTerm(localSearchTerm);
        if (localSearchTerm && !searchHistory.includes(localSearchTerm)) {
            setSearchHistory(prev => [localSearchTerm, ...prev].slice(0, 5));
        }
        }, 500); // 500ms debounce
        
        return () => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        };
    }, [localSearchTerm]);

    // Handle click outside to close search history dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
        if (searchHistoryRef.current && !searchHistoryRef.current.contains(event.target) &&
            searchInputRef.current && !searchInputRef.current.contains(event.target)) {
            setShowSearchHistory(false);
        }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Visual effect when search is active
    useEffect(() => {
        if (searchTerm) {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setIsSearching(false);
        }, 1000);
        return () => clearTimeout(timer);
        }
    }, [searchTerm]);

    const handleSearch = (e) => {
        e.preventDefault();
        // Save search term to history if not already there
        if (localSearchTerm && !searchHistory.includes(localSearchTerm)) {
        setSearchHistory(prev => [localSearchTerm, ...prev].slice(0, 5));
        }
        setSearchTerm(localSearchTerm);
        fetchOrders();
        setShowSearchHistory(false);
    };

    const clearSearch = () => {
        setLocalSearchTerm('');
        setSearchTerm('');
        fetchOrders();
    };

    const handleApplyFilters = () => {
        fetchOrders();
        setIsFilterOpen(false);
    };

    const handleResetFilters = () => {
        setFilterStatus('all');
        setDateRange({ from: '', to: '' });
        setSearchTerm('');
        setSearchField('all');
        setPaymentFilter('all');
        setPriceRange({ min: '', max: '' });
        setIsFilterOpen(false);
        fetchOrders();
    };

    const getStatusColor = (status) => {
        switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'processing': return 'bg-blue-100 text-blue-800';
        case 'shipped': return 'bg-purple-100 text-purple-800';
        case 'delivered': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        case 'refunded': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
        case 'paid': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'partially_paid': return 'bg-blue-100 text-blue-800';
        case 'refunded': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
        case 'pending': return <Clock className="w-4 h-4" />;
        case 'processing': return <RefreshCw className="w-4 h-4" />;
        case 'shipped': return <Truck className="w-4 h-4" />;
        case 'delivered': return <Check className="w-4 h-4" />;
        case 'cancelled': return <X className="w-4 h-4" />;
        case 'refunded': return <RefreshCw className="w-4 h-4" />;
        default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
        }).format(amount);
    };

    // Get count of active filters
    const getActiveFiltersCount = () => {
        let count = 0;
        if (filterStatus !== 'all') count++;
        if (searchTerm !== '') count++;
        if (dateRange.from !== '') count++;
        if (dateRange.to !== '') count++;
        if (paymentFilter !== 'all') count++;
        if (priceRange.min !== '') count++;
        if (priceRange.max !== '') count++;
        return count;
    };

    const updateOrder = async (orderNumber, status) => {
            try {
            setIsUpdating(orderNumber);
            
            if (updateOrderStatus) {
                await updateOrderStatus(orderNumber, status);
            } else {
                // Updated to match your endpoint and request format
                const response = await axios.patch(`/orders/${orderNumber}/status`, { 
                status: status 
                });
                
                if (response.status !== 200) {
                throw new Error('Failed to update order status');
                }
            }
            
            // Success notification
            // You could add a toast system or a simple message
            
            fetchOrders();
            } catch (error) {
            console.error('Error updating order status:', error);
            // Show error notification
            } finally {
            setIsUpdating(null);
            }
        };

    const updateOrderItem = async (itemId, updates) => {
        try {
            const response = await axios.patch(`/delivery-items/${itemId}`, updates);
            if (response.status === 200) {
                // Optionally, show a success message and refetch orders
                fetchOrders();
            } else {
                // Optionally, show an error message
                console.error('Failed to update order item');
            }
        } catch (error) {
            console.error('Error updating order item:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
        {/* Dashboard Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Order Management Dashboard</h1>
            <button 
                onClick={fetchOrders}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
            </button>
            </div>
        </div>
        
        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* Enhanced Search */}
                <div className="flex-1 max-w-md">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0">
                        <div className="flex-1 flex relative">
                        <select
                            className="shadow-sm block sm:text-sm rounded-l-md w-28 border border-gray-300 bg-gray-50 text-gray-700 font-medium py-2 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                            value={searchField}
                            onChange={(e) => setSearchField(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="order">Order #</option>
                            <option value="name">Name</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                        </select>
                        <div 
                            ref={searchInputRef}
                            className={`relative flex-1 ${isSearching ? 'animate-pulse' : ''}`}
                        >
                            <input
                            type="text"
                            placeholder={searchField === 'all' ? "Search by order #, name, email..." : `Search by ${searchField}...`}
                            className={`shadow-sm block w-full sm:text-sm border-gray-300 border-l-0 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${localSearchTerm ? 'pr-8' : ''}`}
                            value={localSearchTerm}
                            onChange={(e) => setLocalSearchTerm(e.target.value)}
                            onFocus={() => searchHistory.length > 0 && setShowSearchHistory(true)}
                            />
                            {localSearchTerm && (
                            <button 
                                type="button" 
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition duration-200"
                                onClick={clearSearch}
                            >
                                <X className="h-4 w-4" />
                            </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition duration-200 transform hover:scale-105"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                        </div>
                    </form>
                
                    {/* Search History Dropdown */}
                    {/* {showSearchHistory && searchHistory.length > 0 && (
                    <div 
                    ref={searchHistoryRef}
                    className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto transition-all duration-300 ease-in-out"
                    >
                    <div className="px-3 py-2 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <span className="text-xs font-medium text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> Recent Searches
                        </span>
                        <button 
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition duration-200"
                        onClick={() => setSearchHistory([])}
                        >
                        Clear All
                        </button>
                    </div>
                    <ul className="py-1">
                        {searchHistory.map((term, index) => (
                        <li key={index}>
                            <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center transition duration-200"
                            onClick={() => handleSearchHistorySelect(term)}
                            >
                            <Clock className="h-3 w-3 mr-2 text-gray-400" />
                            {term}
                            </button>
                        </li>
                        ))}
                    </ul>
                    </div>
                )} */}
                </div>
                
                {/* Filter Toggle */}
                <div className="flex space-x-4">
                    <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        advancedFiltersApplied 
                        ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    >
                    <Sliders className="mr-2 h-4 w-4" />
                    Filters
                    {getActiveFiltersCount() > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                        {getActiveFiltersCount()}
                        </span>
                    )}
                    {isFilterOpen ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                    </button>
                    
                    {/* Status Quick Filter */}
                    <select
                    className="block shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                    value={filterStatus}
                    onChange={(e) => {
                        setFilterStatus(e.target.value);
                        fetchOrders();
                    }}
                    >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                </div>
                
                {/* Advanced Filters */}
                {isFilterOpen && (
                <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                        <div className="flex space-x-2">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">From</label>
                            <input
                            type="date"
                            className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                            value={dateRange.from}
                            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">To</label>
                            <input
                            type="date"
                            className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                            value={dateRange.to}
                            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                            />
                        </div>
                        </div>
                    </div>
                    
                    {/* Payment Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                        <select
                        className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        >
                        <option value="all">All Payment Statuses</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="refunded">Refunded</option>
                        </select>
                    </div>
                    
                    {/* Price Range Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                        <div className="flex items-center space-x-2">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Min ($)</label>
                            <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Max ($)</label>
                            <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="999.99"
                            className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                            />
                        </div>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Active Filters</label>
                        <div className="p-2 bg-white border border-gray-200 rounded-md h-20 overflow-y-auto">
                        {getActiveFiltersCount() === 0 ? (
                            <p className="text-sm text-gray-500">No filters applied</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                            {filterStatus !== 'all' && (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center">
                                Status: {filterStatus}
                                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setFilterStatus('all')} />
                                </span>
                            )}
                            {searchTerm !== '' && (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center">
                                Search: {searchTerm}
                                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                                </span>
                            )}
                            {dateRange.from !== '' && (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center">
                                From: {dateRange.from}
                                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setDateRange({...dateRange, from: ''})} />
                                </span>
                            )}
                            {dateRange.to !== '' && (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center">
                                To: {dateRange.to}
                                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setDateRange({...dateRange, to: ''})} />
                                </span>
                            )}
                            {paymentFilter !== 'all' && (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center">
                                Payment: {paymentFilter.replace('_', ' ')}
                                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setPaymentFilter('all')} />
                                </span>
                            )}
                            {priceRange.min !== '' && (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center">
                                Min: ${priceRange.min}
                                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setPriceRange({...priceRange, min: ''})} />
                                </span>
                            )}
                            {priceRange.max !== '' && (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center">
                                Max: ${priceRange.max}
                                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setPriceRange({...priceRange, max: ''})} />
                                </span>
                            )}
                            </div>
                        )}
                        </div>
                    </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                    <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Reset All
                    </button>
                    <button
                        onClick={handleApplyFilters}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Apply Filters
                    </button>
                    </div>
                </div>
                )}
            </div>

            {/* Order Stats */}
            <div className="bg-gray-50 px-4 py-5 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-md bg-blue-100 text-blue-600">
                    <Package className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                    <p className="text-lg font-semibold text-gray-900">{orders.length}</p>
                    </div>
                </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-md bg-yellow-100 text-yellow-600">
                    <Clock className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                    <p className="text-lg font-semibold text-gray-900">
                        {orders.filter(o => o.order_status === 'pending').length}
                    </p>
                    </div>
                </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-md bg-purple-100 text-purple-600">
                    <Truck className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Shipping</h3>
                    <p className="text-lg font-semibold text-gray-900">
                        {orders.filter(o => o.order_status === 'shipped').length}
                    </p>
                    </div>
                </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-md bg-green-100 text-green-600">
                    <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
                    <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0))}
                    </p>
                    </div>
                </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
                {loading ? (
                <div className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-500">Loading orders...</p>
                </div>
                ) : error ? (
                <div className="p-12 text-center text-red-500">
                    <AlertCircle className="mx-auto h-12 w-12" />
                    <p className="mt-2">{error}</p>
                    <button
                    onClick={fetchOrders}
                    className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                    Try Again
                    </button>
                </div>
                ) : orders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <Package className="mx-auto h-12 w-12" />
                    <p className="mt-2">No orders found</p>
                </div>
                ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                        <React.Fragment key={order.order_number}>
                        <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <FileText className="flex-shrink-0 h-5 w-5 text-gray-400" />
                                <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                                <div className="text-sm text-gray-500">{order.items.length} items</div>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                            <div className="text-sm text-gray-500">{order.customer_email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(order.created_at)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
                                <span className="flex items-center">
                                {getStatusIcon(order.order_status)}
                                <span className="ml-1 capitalize">{order.order_status}</span>
                                </span>
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                                <span className="capitalize">{order.payment_status.replace('_', ' ')}</span>
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(order.total_amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                                onClick={() => toggleOrderExpand(order.order_number)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                                {expandedOrder === order.order_number ? 'Hide' : 'View'}
                            </button>
                            <select
                                value={order.order_status}
                                onChange={(e) => updateOrder(order.order_number, e.target.value)}
                                className="mt-1 block text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                // Disable select while updating to prevent multiple submissions
                                disabled={isUpdating === order.order_number}
                                >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                </select>
                                {isUpdating === order.order_number && (
                                <span className="ml-2 text-xs text-blue-600">Updating...</span>
                                )}
                            </td>
                        </tr>
                        {expandedOrder === order.order_number && (
                            <tr>
                            <td colSpan="7" className="px-6 py-4 bg-gray-50">
                                <div className="border rounded-lg overflow-hidden bg-white">
                                {/* Order Details */}
                                <div className="px-4 py-3 bg-gray-100 border-b">
                                    <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
                                </div>
                                <div className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Customer Information */}
                                    <div className="border rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 flex items-center mb-2">
                                        <User className="mr-2 h-4 w-4 text-gray-500" />
                                        Customer Information
                                        </h4>
                                        <div className="text-sm">
                                        <p className="font-medium">{order.customer_name}</p>
                                        <p className="text-gray-600">{order.customer_email}</p>
                                        <p className="text-gray-600">{order.customer_phone}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Shipping Information */}
                                    <div className="border rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 flex items-center mb-2">
                                        <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                                        Shipping Information
                                        </h4>
                                        <div className="text-sm">
                                        <p className="text-gray-600">{order.shipping_address}</p>
                                        <p className="text-gray-600">
                                            {order.shipping_city}, {order.shipping_state} {order.shipping_zip_code}
                                        </p>
                                        <p className="text-gray-600">{order.shipping_country}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Payment Information */}
                                    <div className="border rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 flex items-center mb-2">
                                        <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                                        Payment Information
                                        </h4>
                                        <div className="text-sm">
                                        <p className="text-gray-600 capitalize">
                                            Method: {order.payments[0].payment_method.replace('_', ' ')}
                                        </p>
                                        <p className="text-gray-600">
                                            Transaction: {order.payments[0].transaction_id}
                                        </p>
                                        <p className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-gray-900'}`}>
                                            Status: {order.payment_status.replace('_', ' ')}
                                        </p>
                                        </div>
                                    </div>
                                    </div>
                                    
                                    {/* Order Items */}
                                    <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Price
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Quantity
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {Array.isArray(order.items) && order.items.length > 0 ? (
                                            order.items.map((item) => (
                                                <tr key={item.id || `item-${Math.random()}`}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    {item.product_name || 'Unknown Product'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {formatCurrency(item.unit_price || 0)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {item.quantity || 0}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                    {formatCurrency(item.total_price || 0)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => updateOrderItem(item.id, { quantity: item.quantity + 1 })}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        Increase
                                                    </button>
                                                    <button
                                                        onClick={() => updateOrderItem(item.id, { quantity: item.quantity - 1 })}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Decrease
                                                    </button>
                                                </td>
                                                </tr>
                                            ))
                                            ) : (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-3 text-sm text-gray-500 text-center">
                                                No items found for this order
                                                </td>
                                            </tr>
                                            )}
                                        </tbody>
                                        </table>
                                    </div>
                                    </div>   
                                    {/* Order Summary */}
                                    <div className="mt-6 border-t pt-4">
                                    <div className="flex justify-end">
                                        <div className="w-full md:w-64 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Shipping:</span>
                                            <span className="font-medium text-gray-900">{formatCurrency(order.shipping_cost)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tax:</span>
                                            <span className="font-medium text-gray-900">{formatCurrency(order.tax_amount)}</span>
                                        </div>
                                        {order.discount_amount > 0 && (
                                            <div className="flex justify-between">
                                            <span className="text-gray-600">Discount:</span>
                                            <span className="font-medium text-red-600">-{formatCurrency(order.discount_amount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="font-medium text-gray-900">Total:</span>
                                            <span className="font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
                                        </div>
                                        </div>
                                    </div>
                                    </div>
                                    
                                    {/* Order Timeline or Notes */}
                                    {order.notes && order.notes.length > 0 && (
                                    <div className="mt-6 border-t pt-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Order Notes</h4>
                                        <div className="space-y-3">
                                        {order.notes.map((note, idx) => (
                                            <div key={idx} className="bg-gray-50 p-3 rounded-md text-sm">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium">{note.added_by}</span>
                                                <span className="text-gray-500 text-xs">{formatDate(note.created_at)}</span>
                                            </div>
                                            <p className="text-gray-700">{note.content}</p>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                    )}
                                    
                                    {/* Actions */}
                                    <div className="mt-6 border-t pt-4 flex justify-end">
                                    <div className="space-x-3">
                                        <button
                                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        onClick={() => {/* Add download invoice function */}}
                                        >
                                        Download Invoice
                                        </button>
                                        <button
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        onClick={() => {/* Add send email function */}}
                                        >
                                        Send Email
                                        </button>
                                    </div>
                                    </div>
                                </div>
                                </div>
                            </td>
                            </tr>
                        )}
                        </React.Fragment>
                    ))}
                    </tbody>
                </table>
                )}
            </div>
            
            {/* Pagination */}
            {!loading && orders.length > 0 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Previous
                    </button>
                    <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Next
                    </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">1</span> to <span className="font-medium">{orders.length}</span> of{' '}
                        <span className="font-medium">{orders.length}</span> results
                    </p>
                    </div>
                    <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span className="sr-only">Previous</span>
                        <ChevronUp className="h-5 w-5 rotate-90" />
                        </button>
                        <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        1
                        </button>
                        <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span className="sr-only">Next</span>
                        <ChevronDown className="h-5 w-5 rotate-90" />
                        </button>
                    </nav>
                    </div>
                </div>
                </div>
            )}
            </div>
        </div>
        </div>
    );
};

export default OrderManagement;