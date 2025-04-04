import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, Search, RefreshCw, Save, X } from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [editingCategory, setEditingCategory] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      // Update to match the backend response structure
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
      
      // Check for success flag from backend
      if (!responseData.success && responseData.success !== undefined) {
        throw new Error(responseData.message || 'Failed to add category');
      }
      
      // Add to local state or refetch
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
      
      // Check for success flag from backend
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
      
      // Check for success flag from backend
      if (!responseData.success && responseData.success !== undefined) {
        throw new Error(responseData.message || 'Failed to delete category');
      }
      
      // Update local state or refetch
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
    // Optionally fetch the latest data from the server
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

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen font-primary">
      {/* Header */}
      <div className="pt-10 pb-6 px-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-900 mb-3 tracking-tight">Category Management</h1>
        <p className="text-blue-600 text-lg">Organize and manage your store categories</p>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* Notification */}
        {notification.show && (
          <div className={`p-4 mb-8 rounded-xl shadow-lg transform transition-all duration-300 animate-fade-in ${
            notification.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Add Category */}
          <div className="lg:w-1/3">
            <form onSubmit={addCategory} className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
              <h3 className="font-semibold text-xl text-blue-900 mb-4">Add New Category</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    className="px-4 py-3 w-full border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Description</label>
                  <textarea
                    placeholder="Category description (optional)"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    className="px-4 py-3 w-full border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows="3"
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => fetchCategories()}
                    className="flex items-center justify-center p-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all"
                    disabled={loading}
                  >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding || !newCategory.name.trim()}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    <PlusCircle size={20} />
                    <span className="font-medium">Add Category</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Search Box */}
            <div className="mt-6 bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
              <h3 className="font-semibold text-xl text-blue-900 mb-4">Search Categories</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 w-full border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Categories List */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100">
              <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
                <h2 className="text-2xl font-semibold text-blue-900">Categories</h2>
              </div>

              {loading ? (
                <div className="p-12 flex justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-12 text-center text-blue-600">
                  <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <PlusCircle size={32} className="text-blue-500" />
                  </div>
                  <p className="text-lg font-medium">
                    {searchTerm ? 'No categories match your search' : 'No categories available. Add your first category!'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-blue-900 font-semibold">ID</th>
                        <th className="px-6 py-4 text-left text-blue-900 font-semibold">Name</th>
                        <th className="px-6 py-4 text-left text-blue-900 font-semibold">Description</th>
                        <th className="px-6 py-4 text-right text-blue-900 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories.map((category) => (
                        <tr 
                          key={category.id} 
                          className="border-b border-blue-100 hover:bg-blue-50 transition-all"
                        >
                          <td className="px-6 py-4 text-blue-900 font-medium">{category.id}</td>
                          
                          {editingCategory && editingCategory.id === category.id ? (
                            <>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  value={editingCategory.name}
                                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                                  className="px-3 py-2 w-full border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <textarea
                                  value={editingCategory.description || ''}
                                  onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                                  className="px-3 py-2 w-full border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows="2"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={saveCategory}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-all"
                                    disabled={!editingCategory.name.trim()}
                                  >
                                    <Save size={20} />
                                  </button>
                                  <button 
                                    onClick={cancelEditing}
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                                  >
                                    <X size={20} />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 text-blue-900 font-medium">{category.name}</td>
                              <td className="px-6 py-4 text-gray-600">{category.description || <span className="text-gray-400 italic">No description</span>}</td>
                              <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => startEditing(category)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                  >
                                    <Edit size={20} />
                                  </button>
                                  <button 
                                    onClick={() => deleteCategory(category.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all"
                                  >
                                    <Trash2 size={20} />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;