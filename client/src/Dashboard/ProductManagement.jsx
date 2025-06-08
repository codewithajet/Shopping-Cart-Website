import React, { useState, useEffect } from "react";
import {
  Search, Plus, Edit2, Trash2, Filter, Package, Grid, List, X, ChevronLeft, ChevronRight,
  Save, Upload, AlertCircle, User, XCircle
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, filters, products]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const responseData = await response.json();
      setCategories(responseData.data || []);
    } catch (err) {
      setError("Failed to load categories");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.minPrice) queryParams.append("min_price", filters.minPrice);
      if (filters.maxPrice) queryParams.append("max_price", filters.maxPrice);

      const url = `${API_BASE_URL}/products${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.data || data || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch products");
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ category: "", minPrice: "", maxPrice: "" });
    setSearchTerm("");
    setCurrentPage(1);
    fetchProducts();
  };

  // CRUD handlers
const handleCreateProduct = () => {
  setSelectedProduct({
    name: "",
    price: "",
    category_id: "", // changed from category
    description: "",
    full_description: "",
    stock_count: "",
    in_stock: true,
    rating: "",
    specifications: "",
    images: []
  });
  setIsEditing(true);
  setIsCreating(true);
};

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete product');
        setProducts(products.filter(p => p.id !== productId));
        showNotification('Product deleted successfully', 'success');
      } catch (err) {
        showNotification('Failed to delete product', 'error');
      }
    }
  };

const handleSaveProduct = async (productData) => {
  try {
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('price', productData.price);
    formData.append('category_id', productData.category_id); // changed here
    formData.append('description', productData.description);
    formData.append('full_description', productData.full_description || "");
    formData.append('stock_count', productData.stock_count || 0);
    formData.append('in_stock', productData.in_stock ? "1" : "0");
    formData.append('rating', productData.rating || "");
    if (productData.specifications) {
      formData.append('specifications', typeof productData.specifications === "string"
        ? productData.specifications
        : JSON.stringify(productData.specifications));
    }
    if (productData.imageFiles && productData.imageFiles.length > 0) {
      for (let i = 0; i < productData.imageFiles.length; i++) {
        formData.append('images', productData.imageFiles[i]);
      }
    }
    let response;
    if (isCreating) {
      response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        body: formData
      });
    } else {
      response = await fetch(`${API_BASE_URL}/products/${productData.id}`, {
        method: 'PUT',
        body: formData
      });
    }
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'Failed to save product');
    }
    fetchProducts();
    showNotification(isCreating ? 'Product created successfully' : 'Product updated successfully', 'success');
    setIsEditing(false);
    setIsCreating(false);
    setSelectedProduct(null);
  } catch (err) {
    showNotification(err.message || 'Failed to save product', 'error');
  }
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

  // Helper to get category name from category id
  const getCategoryName = (category_id) => {
    const cat = categories.find(c => c.id === Number(category_id));
    return cat ? cat.name : "Unknown";
  };

  // Product Image component
  const ProductImage = ({ product, className }) => {
    const [imageError, setImageError] = useState(false);
    const getImageUrl = () => {
      if (imageError || !product.images || product.images.length === 0) return null;
      const url = product.images[0];
      return url.startsWith("http") ? url : `${API_BASE_URL}/${url}`;
    };
    return (
      <>
        {!imageError && getImageUrl() ? (
          <img
            src={getImageUrl()}
            alt={product.name || "Product image"}
            className={className}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`${className} flex items-center justify-center bg-gray-200`}>
            <User size={className?.includes("w-12") ? 24 : 48} className="text-gray-400" />
          </div>
        )}
      </>
    );
  };

  // Product Card (Grid View)
  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 bg-gray-100">
        <ProductImage product={product} className="w-full h-full object-cover" />
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
          <span className="font-bold text-blue-600">#{parseFloat(product.price).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>{getCategoryName(product.category_id)}</span>
          <span>Stock: {product.stock_count}</span>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
        {product.images && product.images.length > 1 && (
          <div className="mt-2 text-xs text-blue-600">
            + {product.images.length - 1} more {product.images.length === 2 ? "image" : "images"}
          </div>
        )}
      </div>
    </div>
  );

  // Product Row (List View)
  const ProductRow = ({ product }) => (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-3 px-4 flex items-center">
        <div className="w-12 h-12 mr-3 flex-shrink-0">
          <ProductImage product={product} className="w-full h-full object-cover rounded" />
        </div>
        <span className="font-medium text-gray-800">{product.name}</span>
      </td>
      <td className="py-3 px-4 text-gray-600">{getCategoryName(product.category_id)}</td>
      <td className="py-3 px-4 font-medium text-blue-600">
        #{parseFloat(product.price).toFixed(2)}
      </td>
      <td className="py-3 px-4 text-gray-600">{product.stock_count}</td>
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

  // Product Form (Create/Edit)
  const ProductForm = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      ...product,
      replaceImages: false
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [previewErrors, setPreviewErrors] = useState([]);

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value
      });
    };

    const handleImageChange = (e) => {
      if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        setImageFiles(prev => [...prev, ...filesArray]);
        const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        setPreviewErrors(prev => [...prev, ...new Array(newPreviewUrls.length).fill(false)]);
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({
        ...formData,
        imageFiles: imageFiles
      });
    };

    const removeUploadedImage = (index) => {
      const newFiles = [...imageFiles];
      newFiles.splice(index, 1);
      setImageFiles(newFiles);

      const newUrls = [...previewUrls];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      setPreviewUrls(newUrls);

      const newErrors = [...previewErrors];
      newErrors.splice(index, 1);
      setPreviewErrors(newErrors);
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
                    name="category_id" // changed from category
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
                    Stock Count
                  </label>
                  <input
                    type="number"
                    name="stock_count"
                    value={formData.stock_count}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    In Stock
                  </label>
                  <input
                    type="checkbox"
                    name="in_stock"
                    checked={formData.in_stock}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating
                  </label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Description
                  </label>
                  <textarea
                    name="full_description"
                    value={formData.full_description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specifications (JSON)
                  </label>
                  <textarea
                    name="specifications"
                    value={typeof formData.specifications === "string" ? formData.specifications : JSON.stringify(formData.specifications || {}, null, 2)}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder='{"key1":"value1","key2":"value2"}'
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Product Images
                    </label>
                  </div>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center"
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
                  {previewUrls.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        New Images:
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {previewUrls.map((url, index) => (
                          <div key={`new-${index}`} className="relative h-24 rounded overflow-hidden border border-gray-200">
                            {previewErrors[index] ? (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <User size={32} className="text-gray-400" />
                              </div>
                            ) : (
                              <>
                                <img
                                  src={url}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeUploadedImage(index)}
                                  className="absolute top-1 right-1 p-1 bg-white bg-opacity-75 rounded-full text-red-500 hover:text-red-700 hover:bg-opacity-100 transition-colors"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
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
                  {isCreating ? "Create Product" : "Update Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const Notification = ({ message, type }) => {
    const bgColor =
      type === "success"
        ? "bg-green-500"
        : type === "error"
        ? "bg-red-500"
        : "bg-blue-500";
    return (
      <div
        className={`fixed top-4 right-4 ${bgColor} text-white py-2 px-4 rounded-md shadow-md flex items-center z-50 animate-fadeIn`}
      >
        {type === "error" && <AlertCircle size={16} className="mr-2" />}
        {message}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}
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
                  showFilters
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Filter size={18} className="mr-1" />
                Filters
              </button>
              <div className="border border-gray-300 rounded-md flex">
                <button
                  onClick={() => setView("grid")}
                  className={`px-3 py-2 ${
                    view === "grid"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-3 py-2 ${
                    view === "list"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
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
                      <option key={category.id} value={category.name}>
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
          ) : view === "grid" ? (
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
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
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
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
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
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
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