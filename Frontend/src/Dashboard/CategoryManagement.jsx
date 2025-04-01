import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, X, AlertCircle, CheckCircle } from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from the backend
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/categories');
      const data = await response.json();
      setCategories(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new category
  const addCategory = async () => {
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategory }),
      });

      if (response.ok) {
        setNewCategory('');
        setSuccess('Category added successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchCategories(); // Refresh the list
      } else {
        setError('Failed to add category');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  // Start editing a category
  const startEditing = (category) => {
    setEditingCategory(category.id);
    setEditValue(category.name);
  };

  // Update a category
  const updateCategory = async (id) => {
    if (!editValue.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editValue }),
      });

      if (response.ok) {
        setEditingCategory(null);
        setSuccess('Category updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchCategories(); // Refresh the list
      } else {
        setError('Failed to update category');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  // Delete a category
  const deleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Category deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchCategories(); // Refresh the list
      } else {
        setError('Failed to delete category');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="p-6 bg-[#f7f9fc] min-h-screen font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-[#2d3748] mb-6">Category Management</h1>
        
        {/* Notification Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-[#f44336] p-4 rounded-md flex items-start shadow-sm">
            <AlertCircle className="text-[#f44336] mr-3 mt-0.5" size={20} />
            <div>
              <p className="text-[#f44336]">{error}</p>
            </div>
            <button 
              onClick={() => setError('')} 
              className="ml-auto text-[#f44336] hover:text-red-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-[#4caf50] p-4 rounded-md flex items-start shadow-sm">
            <CheckCircle className="text-[#4caf50] mr-3 mt-0.5" size={20} />
            <div>
              <p className="text-[#4caf50]">{success}</p>
            </div>
            <button 
              onClick={() => setSuccess('')} 
              className="ml-auto text-[#4caf50] hover:text-green-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Add Category Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 transition-all hover:shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-[#2d3748] flex items-center">
            <Plus size={20} className="mr-2 text-[#4a6fa5]" />
            Add New Category
          </h2>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Enter category name"
              className="flex-1 p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] transition-all"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button
              onClick={addCategory}
              className="bg-[#4a6fa5] text-white px-6 py-3 rounded-lg hover:bg-[#324a6d] focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:ring-offset-2 transition-all font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Category List */}
        <div className="bg-white p-6 rounded-lg shadow-md transition-all hover:shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#2d3748]">Categories</h2>
            
            {/* Search Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-[#718096]" />
              </div>
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-[#4a6fa5] transition-all"
              />
            </div>
          </div>

          {isLoading && categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-[#e2e8f0] rounded-full mb-4"></div>
                <div className="h-4 bg-[#e2e8f0] rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-[#e2e8f0] rounded w-1/4"></div>
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-10 bg-[#f7f9fc] rounded-lg border border-dashed border-[#cbd5e0]">
              <p className="text-[#718096]">No categories found. Create your first category!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredCategories.map((category) => (
                <li
                  key={category.id}
                  className="flex justify-between items-center p-4 bg-[#f7f9fc] rounded-lg border border-[#e2e8f0] hover:shadow-sm transition-all"
                >
                  {editingCategory === category.id ? (
                    <div className="flex-1 mr-4">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-2 border border-[#4a6fa5] rounded focus:outline-none focus:ring-2 focus:ring-[#4a6fa5]"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span className="text-[#2d3748] font-medium">{category.name}</span>
                  )}
                  
                  <div className="flex space-x-2">
                    {editingCategory === category.id ? (
                      <>
                        <button
                          onClick={() => updateCategory(category.id)}
                          className="bg-[#4caf50] text-white px-3 py-1 rounded hover:bg-green-600 transition-all"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(category)}
                          className="text-[#4a6fa5] hover:text-[#324a6d] focus:outline-none transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="text-[#f44336] hover:text-red-700 focus:outline-none transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;