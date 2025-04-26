import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, Search, RefreshCw, Save, X, Filter, Package, AlertCircle } from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load categories. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add new category
  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    
    setIsAdding(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          description: newCategory.description.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add category');
      }
      
      const responseData = await response.json();
      
      if (!responseData.success && responseData.success !== undefined) {
        throw new Error(responseData.message || 'Failed to add category');
      }
      
      await fetchCategories();
      setNewCategory({ name: '', description: '' });
      showNotification(responseData.message || 'Category added successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to add category', 'error');
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  // Update category
  const updateCategory = async (id, updatedData) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }
      
      const responseData = await response.json();
      
      if (!responseData.success && responseData.success !== undefined) {
        throw new Error(responseData.message || 'Failed to update category');
      }
      
      await fetchCategories();
      setEditingCategory(null);
      showNotification(responseData.message || 'Category updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update category', 'error');
      console.error(err);
    }
  };

  // Delete category
  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/categories/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      
      const responseData = await response.json();
      
      if (!responseData.success && responseData.success !== undefined) {
        throw new Error(responseData.message || 'Failed to delete category');
      }
      
      await fetchCategories();
      showNotification(responseData.message || 'Category deleted successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete category', 'error');
      console.error(err);
    }
  };

  // Get specific category
  const getCategory = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/categories/${id}`);
      
      if (!response.ok) throw new Error('Failed to fetch category details');
      
      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Start editing a category
  const startEditing = async (category) => {
    const latestData = await getCategory(category.id);
    setEditingCategory(latestData || { ...category });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCategory(null);
  };

  // Save edited category
  const saveCategory = () => {
    if (!editingCategory.name.trim()) return;
    updateCategory(editingCategory.id, {
      name: editingCategory.name.trim(),
      description: editingCategory.description ? editingCategory.description.trim() : ''
    });
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Notification component
  const Notification = ({ message, type }) => (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg transition-all transform duration-300 ${
      type === 'success' ? 'bg-green-50 text-green-600 border-l-4 border-green-600' : 
      'bg-red-50 text-red-600 border-l-4 border-red-600'
    }`}>
      <div className="flex items-center">
        {type === 'success' ? (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        ) : (
          <AlertCircle size={20} className="mr-2" />
        )}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <Notification message={notification.message} type={notification.type} />
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Category Management</h1>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center md:justify-start"
          >
            <PlusCircle size={18} className="mr-1" />
            Add New Category
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-md flex items-center ${
                  showFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter size={18} className="mr-1" />
                Filters
              </button>
              
              <button
                onClick={fetchCategories}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex items-center"
              >
                <RefreshCw size={18} className={`mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="id">ID (Ascending)</option>
                    <option value="-id">ID (Descending)</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="-name">Name (Z-A)</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    className="px-4 py-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Add Category Form */}
          {isAdding && (
            <div className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-blue-900">Add New Category</h2>
                <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={addCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="Enter category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Enter category description (optional)"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding || !newCategory.name.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAdding ? 'Adding...' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-center">
              <AlertCircle size={20} className="mr-2" />
              {error}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-20 text-center">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-800 mb-1">No categories found</h3>
              <p className="text-gray-500">Try adjusting your search or add a new category</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.id}
                      </td>
                      
                      {editingCategory && editingCategory.id === category.id ? (
                        <>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <textarea
                              value={editingCategory.description || ''}
                              onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows="2"
                            />
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={saveCategory}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                                disabled={!editingCategory.name.trim()}
                              >
                                <Save size={16} className="mr-1" />
                                Save
                              </button>
                              <button 
                                onClick={cancelEditing}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <X size={16} className="mr-1" />
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {category.name}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {category.description || <span className="text-gray-400 italic">No description</span>}
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => startEditing(category)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                              >
                                <Edit size={16} className="mr-1" />
                                Edit
                              </button>
                              <button 
                                onClick={() => deleteCategory(category.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                              >
                                <Trash2 size={16} className="mr-1" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination placeholder - could be implemented if needed */}
          {filteredCategories.length > 0 && (
            <div className="flex justify-between items-center mt-6 text-sm">
              <div className="text-gray-600">
                Showing {filteredCategories.length} categories
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;