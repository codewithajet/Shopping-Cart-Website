import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, Package, Grid, List, X, ChevronLeft, ChevronRight, Save, Upload, AlertCircle } from 'lucide-react';

// Product Management Dashboard Main Component
const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const API_BASE_URL = 'http://localhost:5000'; // Update with your actual API URL

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Filter products when search term or filters change
  useEffect(() => {
    filterProducts();
  }, [searchTerm, filters, products]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      
      const responseData = await response.json();
      if (responseData.data) {
        setCategories(responseData.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      showNotification('Failed to load categories', 'error');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Build query parameters for filters
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category_id', filters.category);
      if (filters.minPrice) queryParams.append('min_price', filters.minPrice);
      if (filters.maxPrice) queryParams.append('max_price', filters.maxPrice);
      
      const url = `${API_BASE_URL}/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Apply search term filter (client-side)
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
    
    // Fetch all products again
    fetchProducts();
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, { 
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete product');
        
        // Update UI immediately
        setProducts(products.filter(p => p.id !== productId));
        showNotification('Product deleted successfully', 'success');
      } catch (err) {
        console.error('Error deleting product:', err);
        showNotification('Failed to delete product', 'error');
      }
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      const formData = new FormData();
      
      // Add form fields to FormData
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && key !== 'category_name') {
          formData.append(key, productData[key]);
        }
      });
      
      // Handle images if they exist
      if (productData.imageFiles && productData.imageFiles.length > 0) {
        for (let i = 0; i < productData.imageFiles.length; i++) {
          formData.append('images', productData.imageFiles[i]);
        }
        
        if (isEditing && !isCreating) {
          formData.append('replace_images', 'true');
        }
      }
      
      let response;
      if (isCreating) {
        // Create new product
        response = await fetch(`${API_BASE_URL}/products`, { 
          method: 'POST',
          body: formData
        });
      } else {
        // Update existing product
        response = await fetch(`${API_BASE_URL}/products/${productData.id}`, { 
          method: 'PUT',
          body: formData 
        });
      }
      
      if (!response.ok) throw new Error('Failed to save product');
      
      const result = await response.json();
      
      // Refresh products list
      fetchProducts();
      
      showNotification(isCreating ? 'Product created successfully' : 'Product updated successfully', 'success');
      setIsEditing(false);
      setIsCreating(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Error saving product:', err);
      showNotification('Failed to save product', 'error');
    }
  };

  const handleCreateProduct = () => {
    setSelectedProduct({
      name: '',
      price: '',
      category_id: '',
      description: '',
      stock_quantity: '',
      images: []
    });
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsEditing(true);
    setIsCreating(false);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Component to display each individual product
  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 bg-gray-100">
        <img 
          src={product.images && product.images.length > 0 
            ? `${API_BASE_URL}${product.images[0]}` 
            : '/api/placeholder/800/600'} 
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/api/placeholder/800/600';
          }}
        />
        <div className="absolute top-2 right-2 flex space-x-1">
          <button 
            onClick={() => handleEditProduct(product)}
            className="p-1 rounded-full bg-white text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDeleteProduct(product.id)}
            className="p-1 rounded-full bg-white text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-800 line-clamp-1">{product.name}</h3>
          <span className="font-bold text-blue-600">${parseFloat(product.price).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>{product.category_name}</span>
          <span>Stock: {product.stock_quantity}</span>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
      </div>
    </div>
  );

  // Component to display each product in list view
  const ProductRow = ({ product }) => (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-3 px-4 flex items-center">
        <div className="w-12 h-12 mr-3 flex-shrink-0">
          <img 
            src={product.images && product.images.length > 0 
              ? `${API_BASE_URL}${product.images[0]}` 
              : '/api/placeholder/800/600'} 
            alt={product.name}
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              e.target.src = '/api/placeholder/800/600';
            }}
          />
        </div>
        <span className="font-medium text-gray-800">{product.name}</span>
      </td>
      <td className="py-3 px-4 text-gray-600">{product.category_name}</td>
      <td className="py-3 px-4 font-medium text-blue-600">${parseFloat(product.price).toFixed(2)}</td>
      <td className="py-3 px-4 text-gray-600">{product.stock_quantity}</td>
      <td className="py-3 px-4">
        <div className="flex space-x-2">
          <button 
            onClick={() => handleEditProduct(product)}
            className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDeleteProduct(product.id)}
            className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  // Product form component for editing and creating products
  const ProductForm = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      ...product
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState(product.images || []);
    
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value
      });
    };
    
    const handleImageChange = (e) => {
      if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        setImageFiles(filesArray);
        
        // Create preview URLs
        const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
        setPreviewUrls(newPreviewUrls);
      }
    };
    
    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({
        ...formData,
        imageFiles: imageFiles
      });
    };
    
    const handleDragOver = (e) => {
      e.preventDefault();
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      if (e.dataTransfer.files) {
        const filesArray = Array.from(e.dataTransfer.files);
        setImageFiles(filesArray);
        
        // Create preview URLs
        const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
        setPreviewUrls(newPreviewUrls);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-screen overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {isCreating ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  ></textarea>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Images
                  </label>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      Drag & drop product images here, or click to select files
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="product-images"
                      accept="image/*"
                    />
                    <label
                      htmlFor="product-images"
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      Browse Files
                    </label>
                  </div>
                  
                  {/* Image Previews */}
                  {previewUrls.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Image Previews:</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative h-24 rounded overflow-hidden">
                            <img 
                              src={url.startsWith('blob:') ? url : `${API_BASE_URL}${url}`}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/api/placeholder/200/150';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Save size={16} className="mr-1" />
                  {isCreating ? 'Create Product' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Notification component
  const Notification = ({ message, type }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    return (
      <div className={`fixed top-4 right-4 ${bgColor} text-white py-2 px-4 rounded-md shadow-md flex items-center z-50 animate-fadeIn`}>
        {type === 'error' && <AlertCircle size={16} className="mr-2" />}
        {message}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}
      
      {/* Product form modal */}
      {isEditing && (
        <ProductForm 
          product={selectedProduct} 
          onSave={handleSaveProduct}
          onCancel={() => {
            setIsEditing(false);
            setIsCreating(false);
            setSelectedProduct(null);
          }}
        />
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Product Management
          </h1>
          <button
            onClick={handleCreateProduct}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center md:justify-start"
          >
            <Plus size={18} className="mr-1" />
            Add New Product
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
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
              
              <div className="border border-gray-300 rounded-md flex">
                <button
                  onClick={() => setView('grid')}
                  className={`px-3 py-2 ${
                    view === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-2 ${
                    view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Price
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    min="0"
                    placeholder="$"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    min="0"
                    placeholder="$"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
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
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-800 mb-1">No products found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : view === 'grid' ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentItems.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(product => (
                    <ProductRow key={product.id} product={product} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="flex justify-between items-center mt-6 text-sm">
              <div className="text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${
                    currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${
                        currentPage === pageNumber 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  export default ProductManagement;