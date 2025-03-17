import React, { useState, useEffect } from 'react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  // Fetch categories from the backend
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError('Failed to fetch categories');
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
        fetchCategories(); // Refresh the list
      } else {
        setError('Failed to add category');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  // Delete a category
  const deleteCategory = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCategories(); // Refresh the list
      } else {
        setError('Failed to delete category');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Category Management</h1>

      {/* Add Category Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Enter category name"
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button
            onClick={addCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Category List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <ul className="space-y-3">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-gray-700">{category.name}</span>
              <button
                onClick={() => deleteCategory(category.id)}
                className="text-red-500 hover:text-red-700 focus:outline-none"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CategoryManagement;