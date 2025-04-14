import React, { useState } from 'react';
import { Search, Edit2, Trash2, UserPlus, ChevronDown, Filter, MoreHorizontal, ArrowUp, ArrowDown, Users, UserCheck, AlertCircle, Shield, X } from 'lucide-react';

const UserManagement = () => {
  // Sample user data
  const [users, setUsers] = useState([
    { id: 1, name: 'Sarah Johnson', email: 'sarah.j@example.com', role: 'Customer', status: 'Active', orders: 12, lastActive: '2h ago' },
    { id: 2, name: 'Michael Chen', email: 'michael.c@example.com', role: 'Admin', status: 'Active', orders: 0, lastActive: '1d ago' },
    { id: 3, name: 'Jessica Williams', email: 'jessica.w@example.com', role: 'Customer', status: 'Inactive', orders: 5, lastActive: '2w ago' },
    { id: 4, name: 'David Rodriguez', email: 'david.r@example.com', role: 'Customer', status: 'Active', orders: 8, lastActive: '4h ago' },
    { id: 5, name: 'Emma Thompson', email: 'emma.t@example.com', role: 'Manager', status: 'Active', orders: 0, lastActive: '1h ago' },
  ]);

  const [activeTab, setActiveTab] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Customer',
    status: 'Active',
  });

  // Form error state
  const [formErrors, setFormErrors] = useState({});

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!newUser.name.trim()) errors.name = 'Name is required';
    if (!newUser.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      errors.email = 'Email is invalid';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add new user
  const handleAddUser = () => {
    if (!validateForm()) return;
    
    const newId = Math.max(...users.map(u => u.id)) + 1;
    const userToAdd = {
      ...newUser,
      id: newId,
      orders: 0,
      lastActive: 'Just now'
    };
    
    setUsers([...users, userToAdd]);
    setNewUser({
      name: '',
      email: '',
      role: 'Customer',
      status: 'Active'
    });
    setShowAddModal(false);
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter users based on active tab and search term
  const filteredUsers = users.filter(user => {
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'customers' && user.role === 'Customer') ||
      (activeTab === 'admins' && (user.role === 'Admin' || user.role === 'Manager')) ||
      (activeTab === 'inactive' && user.status === 'Inactive');
    
    const matchesSearch = 
      searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // Sort users based on sort field and direction
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortField] > b[sortField] ? 1 : -1;
    } else {
      return a[sortField] < b[sortField] ? 1 : -1;
    }
  });

  // Generate random gradient backgrounds for user avatars
  const getGradient = (name) => {
    const colors = [
      'from-purple-500 to-indigo-500',
      'from-blue-500 to-teal-400',
      'from-green-400 to-cyan-500',
      'from-yellow-400 to-orange-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-purple-500',
      'from-teal-400 to-blue-500',
    ];
    
    // Use the first character of the name to select a gradient
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-[var(--background)] font-[var(--font-primary)]">
      {/* Header */}
      <div className="py-5 px-8 bg-white shadow-sm top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[var(--text-dark)]">User Management</h1>
          <button 
            className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md transition-all duration-300 hover:shadow-lg hover:bg-[var(--primary-dark)]"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={18} />
            <span className="font-semibold">Add New User</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--primary)] rounded-2xl shadow-md p-6 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-blue-100 font-medium">Total Users</h3>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Users size={24} className="text-white" />
              </div>
            </div>
            <p className="text-4xl font-bold mt-3 text-white">{users.length}</p>
            <p className="text-blue-100 text-sm mt-2 flex items-center">
              <ArrowUp size={14} className="mr-1" /> 12% this month
            </p>
          </div>
          
          <div className="bg-[var(--success)] rounded-2xl shadow-md p-6 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-green-100 font-medium">Active Users</h3>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <UserCheck size={24} className="text-white" />
              </div>
            </div>
            <p className="text-4xl font-bold mt-3 text-white">{users.filter(u => u.status === 'Active').length}</p>
            <p className="text-green-100 text-sm mt-2 flex items-center">
              <ArrowUp size={14} className="mr-1" /> 5% this month
            </p>
          </div>
          
          <div className="bg-[var(--secondary)] rounded-2xl shadow-md p-6 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-orange-100 font-medium">Inactive Users</h3>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <AlertCircle size={24} className="text-white" />
              </div>
            </div>
            <p className="text-4xl font-bold mt-3 text-white">{users.filter(u => u.status === 'Inactive').length}</p>
            <p className="text-orange-100 text-sm mt-2 flex items-center">
              <ArrowUp size={14} className="mr-1" /> 2% this month
            </p>
          </div>
          
          <div className="bg-[var(--accent)] rounded-2xl shadow-md p-6 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-purple-100 font-medium">Admins</h3>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Shield size={24} className="text-white" />
              </div>
            </div>
            <p className="text-4xl font-bold mt-3 text-white">{users.filter(u => u.role === 'Admin' || u.role === 'Manager').length}</p>
            <p className="text-purple-100 text-sm mt-2">No change this month</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-md p-5 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search size={18} className="absolute left-4 top-3.5 text-[var(--text-light)]" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-11 pr-4 py-3 bg-[var(--background)] border border-[var(--border-light)] rounded-full w-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--border-light)] hover:bg-[var(--background)] text-[var(--text-light)] transition-all">
                <Filter size={16} />
                <span>Filter</span>
                <ChevronDown size={16} />
              </button>
              
              <div className="flex bg-[var(--background)] rounded-full p-1">
                <button
                  className={`px-4 py-2 rounded-full transition-all ${activeTab === 'all' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-light)] hover:bg-[var(--border-light)]'}`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button
                  className={`px-4 py-2 rounded-full transition-all ${activeTab === 'customers' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-light)] hover:bg-[var(--border-light)]'}`}
                  onClick={() => setActiveTab('customers')}
                >
                  Customers
                </button>
                <button
                  className={`px-4 py-2 rounded-full transition-all ${activeTab === 'admins' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-light)] hover:bg-[var(--border-light)]'}`}
                  onClick={() => setActiveTab('admins')}
                >
                  Admins
                </button>
                <button
                  className={`px-4 py-2 rounded-full transition-all ${activeTab === 'inactive' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-light)] hover:bg-[var(--border-light)]'}`}
                  onClick={() => setActiveTab('inactive')}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--background)]">
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-light)] cursor-pointer hover:text-[var(--primary)] transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-light)]">Email</th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-light)] cursor-pointer hover:text-[var(--primary)] transition-colors"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center">
                      Role
                      {sortField === 'role' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-light)] cursor-pointer hover:text-[var(--primary)] transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-light)] cursor-pointer hover:text-[var(--primary)] transition-colors"
                    onClick={() => handleSort('orders')}
                  >
                    <div className="flex items-center">
                      Orders
                      {sortField === 'orders' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-light)]">Last Active</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-light)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {sortedUsers.length > 0 ? (
                  sortedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[var(--background)] transition-all group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient(user.name)} flex items-center justify-center text-white font-medium mr-4 shadow-md`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-dark)] group-hover:text-[var(--primary)] transition-colors">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[var(--text-light)]">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1.5 text-xs font-medium rounded-full ${
                          user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'Manager' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full ${
                          user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${
                            user.status === 'Active' ? 'bg-green-500' : 'bg-orange-500'
                          }`}></span>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-[var(--background)] text-[var(--text-dark)] px-3 py-1.5 rounded-full text-xs font-medium">
                          {user.orders}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[var(--text-light)]">{user.lastActive}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-center space-x-3">
                          <button className="text-blue-600 hover:text-blue-800 bg-blue-100 p-2 rounded-full hover:bg-blue-200 transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button className="text-[var(--danger)] hover:text-red-800 bg-red-100 p-2 rounded-full hover:bg-red-200 transition-all">
                            <Trash2 size={16} />
                          </button>
                          <button className="text-[var(--text-light)] hover:text-gray-800 bg-[var(--background)] p-2 rounded-full hover:bg-[var(--border-light)] transition-all">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-[var(--text-light)]">
                      No users found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-[var(--border-light)]">
            <div className="text-sm text-[var(--text-light)]">
              Showing <span className="font-medium">{sortedUsers.length}</span> of <span className="font-medium">{users.length}</span> users
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 rounded-full border border-[var(--border-light)] text-[var(--text-light)] hover:bg-[var(--background)] transition-all">
                Previous
              </button>
              <button className="px-4 py-2 rounded-full bg-[var(--primary)] text-white shadow-md hover:bg-[var(--primary-dark)] transition-all">1</button>
              <button className="px-4 py-2 rounded-full border border-[var(--border-light)] text-[var(--text-light)] hover:bg-[var(--background)] transition-all">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in transform transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-dark)]">Add New User</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[var(--text-light)] hover:text-[var(--text-dark)] p-2 rounded-full hover:bg-[var(--background)] transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border ${formErrors.name ? 'border-[var(--danger)]' : 'border-[var(--border-light)]'} focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]`}
                  placeholder="Enter full name"
                />
                {formErrors.name && <p className="mt-1 text-sm text-[var(--danger)]">{formErrors.name}</p>}
              </div>
              
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg border ${formErrors.email ? 'border-[var(--danger)]' : 'border-[var(--border-light)]'} focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]`}
                  placeholder="Enter email address"
                />
                {formErrors.email && <p className="mt-1 text-sm text-[var(--danger)]">{formErrors.email}</p>}
              </div>
              
              {/* Role Field */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Role</label>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                >
                  <option value="Customer">Customer</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              
              {/* Status Field */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={newUser.status === 'Active'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="ml-2 text-[var(--text-dark)]">Active</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Inactive"
                      checked={newUser.status === 'Inactive'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="ml-2 text-[var(--text-dark)]">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-[var(--border-light)] text-[var(--text-dark)] hover:bg-[var(--background)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-6 py-2 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-dark)] transition-all shadow-md"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;