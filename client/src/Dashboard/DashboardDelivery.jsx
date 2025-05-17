import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, Calendar, Clock, Search, Filter, ChevronDown, 
  ChevronUp, RefreshCcw, MapPin, AlertCircle, CheckCircle, 
  ExternalLink, Plus, X, Check
} from 'lucide-react';

const DeliveryDashboard = () => {
  // State for deliveries data and filtering
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    order_number: '',
    status: '',
    carrier: '',
    date_from: '',
    date_to: ''
  });
  const [expandedDelivery, setExpandedDelivery] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [formData, setFormData] = useState({
    carrier: '',
    tracking_number: '',
    estimated_delivery_date: '',
    status: 'pending',
    notes: '',
    location: 'Warehouse',
    order_number: '',
    customer_name: '',
    customer_email: ''
  });
  const [eventFormData, setEventFormData] = useState({
    status: 'processing',
    location: '',
    details: ''
  });
  
  // Status badge colors
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    in_transit: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    failed_delivery: 'bg-red-100 text-red-800', 
    cancelled: 'bg-red-100 text-red-800',
    returned: 'bg-gray-100 text-gray-800'
  };

  // Status icons
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'out_for_delivery': return <Truck className="w-4 h-4" />;
      case 'delivered': return <Check className="w-4 h-4" />;
      case 'failed': 
      case 'failed_delivery':
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Fetch deliveries based on current filters
  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`https://shopping-cart-5wj4.onrender.com/deliveries?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      
      const data = await response.json();
      setDeliveries(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDeliveries();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = (e) => {
    e.preventDefault();
    fetchDeliveries();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      order_number: '',
      status: '',
      carrier: '',
      date_from: '',
      date_to: ''
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Toggle delivery details
  const toggleDeliveryDetails = (id) => {
    setExpandedDelivery(expandedDelivery === id ? null : id);
  };

  // Handle create delivery form submission
  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://shopping-cart-5wj4.onrender.com/orders/${formData.order_number}/delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setShowAddForm(false);
        fetchDeliveries();
        setFormData({
          carrier: '',
          tracking_number: '',
          estimated_delivery_date: '',
          status: 'pending',
          notes: '',
          location: 'Warehouse',
          order_number: '',
          customer_name: '',
          customer_email: ''
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create delivery');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle add tracking event form submission
  const handleAddTrackingEvent = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://shopping-cart-5wj4.onrender.com/deliveries/${selectedDelivery.id}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventFormData),
      });
      
      if (response.ok) {
        setShowAddEventForm(false);
        fetchDeliveries();
        setEventFormData({
          status: 'processing',
          location: '',
          details: ''
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add tracking event');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle opening event form for a specific delivery
  const openAddEventForm = (delivery) => {
    setSelectedDelivery(delivery);
    setShowAddEventForm(true);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
            <p className="text-gray-600">Manage and track all shipments and deliveries</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={fetchDeliveries}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button 
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Truck className="h-4 w-4 mr-2" />
              New Delivery
            </button>
          </div>
        </div>

        {/* Create Delivery Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Delivery</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDelivery}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Number*</label>
                  <input
                    type="text"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.order_number}
                    onChange={(e) => setFormData({...formData, order_number: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carrier*</label>
                  <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.carrier}
                    onChange={(e) => setFormData({...formData, carrier: e.target.value})}
                    required
                  >
                    <option value="">Select a carrier</option>
                    <option value="USPS">USPS</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                    <option value="Amazon">Amazon Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number*</label>
                  <input
                    type="text"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery Date</label>
                  <input
                    type="date"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.estimated_delivery_date}
                    onChange={(e) => setFormData({...formData, estimated_delivery_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Location</label>
                  <input
                    type="text"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                >
                  {loading && <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Create Delivery
                </button>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <form onSubmit={applyFilters} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
              <div className="flex-1">
                <label htmlFor="order_number" className="block text-sm font-medium text-gray-700">
                  Order Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="order_number"
                    id="order_number"
                    value={filters.order_number}
                    onChange={handleFilterChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Order #"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out For Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed_delivery">Failed Delivery</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label htmlFor="carrier" className="block text-sm font-medium text-gray-700">
                  Carrier
                </label>
                <select
                  id="carrier"
                  name="carrier"
                  value={filters.carrier}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Carriers</option>
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="USPS">USPS</option>
                  <option value="DHL">DHL</option>
                  <option value="Amazon">Amazon Logistics</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
              <div className="flex-1">
                <label htmlFor="date_from" className="block text-sm font-medium text-gray-700">
                  Date From
                </label>
                <input
                  type="date"
                  name="date_from"
                  id="date_from"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex-1">
                <label htmlFor="date_to" className="block text-sm font-medium text-gray-700">
                  Date To
                </label>
                <input
                  type="date"
                  name="date_to"
                  id="date_to"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex-1 flex space-x-3">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full justify-center"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full justify-center"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Add Event Form */}
        {showAddEventForm && selectedDelivery && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add Tracking Event for Order #{selectedDelivery.order_number}
              </h3>
              <button 
                onClick={() => setShowAddEventForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddTrackingEvent}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status*</label>
                  <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={eventFormData.status}
                    onChange={(e) => setEventFormData({...eventFormData, status: e.target.value})}
                    required
                  >
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed_delivery">Failed Delivery</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location*</label>
                  <input
                    type="text"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={eventFormData.location}
                    onChange={(e) => setEventFormData({...eventFormData, location: e.target.value})}
                    required
                    placeholder="City, State or Facility"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                  <input
                    type="text"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={eventFormData.details}
                    onChange={(e) => setEventFormData({...eventFormData, details: e.target.value})}
                    placeholder="Additional information"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddEventForm(false)}
                  className="mr-3 px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                >
                  {loading && <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Add Event
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Deliveries List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading && !deliveries.length && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {error && !deliveries.length && (
            <div className="p-4 border-l-4 border-red-500 bg-red-50">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {!loading && !error && deliveries.length === 0 && (
            <div className="py-12 px-4 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No deliveries found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or create a new delivery.</p>
            </div>
          )}
          
          {deliveries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Info
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shipment Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveries.map((delivery) => (
                    <React.Fragment key={delivery.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">#{delivery.order_number}</div>
                          <div className="text-sm text-gray-500">ID: {delivery.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Truck className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{delivery.carrier}</div>
                              <div className="text-sm text-gray-500">{delivery.tracking_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{delivery.customer_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{delivery.customer_email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[delivery.status] || 'bg-gray-100 text-gray-800'}`}>
                            {delivery.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-1" />
                              <span>Created: {formatDate(delivery.created_at)}</span>
                            </div>
                            {delivery.estimated_delivery_date && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                <span>Est. Delivery: {formatDate(delivery.estimated_delivery_date)}</span>
                              </div>
                          )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => toggleDeliveryDetails(delivery.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {expandedDelivery === delivery.id ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => openAddEventForm(delivery)}
                              className="text-green-600 hover:text-green-900"
                              title="Add tracking event"
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded delivery details */}
                      {expandedDelivery === delivery.id && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Tracking Events</h4>
                                {delivery.events && delivery.events.length > 0 ? (
                                  <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                    <ul className="space-y-4">
                                      {delivery.events.map((event, index) => (
                                        <li key={index} className="relative pl-10">
                                          <div className="absolute left-0 top-1 bg-white p-1">
                                            {getStatusIcon(event.status)}
                                          </div>
                                          <div className={`p-3 rounded-lg ${statusColors[event.status] || 'bg-gray-100'}`}>
                                            <div className="flex justify-between">
                                              <span className="font-medium capitalize">{event.status.replace('_', ' ')}</span>
                                              <span className="text-xs text-gray-500">{formatDate(event.timestamp)}</span>
                                            </div>
                                            <div className="flex items-center mt-1 text-sm">
                                              <MapPin className="h-4 w-4 mr-1" />
                                              {event.location || 'Unknown location'}
                                            </div>
                                            {event.details && (
                                              <p className="mt-1 text-sm">{event.details}</p>
                                            )}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">No tracking events recorded yet.</p>
                                )}
                              </div>
                              
                              {delivery.notes && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
                                  <p className="text-sm text-gray-600">{delivery.notes}</p>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center pt-2">
                                <div>
                                  <a
                                    href={`/deliveries/${delivery.id}/details`}
                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                                  >
                                    View full details <ExternalLink className="ml-1 h-4 w-4" />
                                  </a>
                                </div>
                                
                                {delivery.tracking_url && (
                                  <a
                                    href={delivery.tracking_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
                                  >
                                    Track on {delivery.carrier} <ExternalLink className="ml-1 h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Pagination UI could be added here */}
        
        {/* Status summary cards could be added here */}
      </div>
    </div>
  );
};

export default DeliveryDashboard;