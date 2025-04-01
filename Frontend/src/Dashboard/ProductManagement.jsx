import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Image, DollarSign, Tag, FileText, Edit, Eye } from 'lucide-react';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category_id: '',
    description: '',
    images: [],
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  // Fetch products and categories from the backend
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError('Failed to fetch products');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError('Failed to fetch categories');
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewProduct({ ...newProduct, images: files });
    
    // Generate preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  // Add a new product
  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category_id || !newProduct.description) {
      setError('All fields are required');
      return;
    }

    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('price', newProduct.price);
    formData.append('category_id', newProduct.category_id);
    formData.append('description', newProduct.description);
    newProduct.images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const response = await fetch('http://localhost:5000/products', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setNewProduct({ name: '', price: '', category_id: '', description: '', images: [] });
        setPreviewImages([]);
        fetchProducts(); // Refresh the list
        setError('');
      } else {
        setError('Failed to add product');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View product details - placeholder function
  const viewProduct = (id) => {
    // Implement view product functionality
    console.log('View product with ID:', id);
    // This would typically open a modal or navigate to a product detail page
  };

  // Edit product - placeholder function
  const editProduct = (id) => {
    // Implement edit product functionality
    console.log('Edit product with ID:', id);
    // This would typically open a form with the product data pre-filled
  };

  // Delete a product
  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`http://localhost:5000/products/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchProducts(); // Refresh the list
        } else {
          setError('Failed to delete product');
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
      }
    }
  };

  // Fetch products and categories on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      previewImages.forEach(URL.revokeObjectURL);
    };
  }, [previewImages]);

  return (
    <div className="min-h-screen bg-background font-primary text-text-dark">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-primary mb-8 border-b border-border-light pb-4">
          Product Management
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Product Form */}
          <div className="lg:col-span-1">
            <div className="bg-card-bg rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 text-primary flex items-center">
                <PlusCircle className="mr-2" size={20} />
                Add New Product
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center border border-border-light rounded-lg p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-30 transition-all">
                  <Tag className="text-text-light mx-2" size={18} />
                  <input
                    type="text"
                    placeholder="Product Name"
                    className="w-full p-1 focus:outline-none"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center border border-border-light rounded-lg p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-30 transition-all">
                  <DollarSign className="text-text-light mx-2" size={18} />
                  <input
                    type="number"
                    placeholder="Price"
                    className="w-full p-1 focus:outline-none"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center border border-border-light rounded-lg p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-30 transition-all">
                  <Tag className="text-text-light mx-2" size={18} />
                  <select
                    className="w-full p-1 focus:outline-none bg-transparent"
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-start border border-border-light rounded-lg p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-30 transition-all">
                  <FileText className="text-text-light mx-2 mt-1" size={18} />
                  <textarea
                    placeholder="Description"
                    className="w-full p-1 focus:outline-none min-h-32"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Image className="text-text-light" size={18} />
                    <span className="text-text-light">Upload Images</span>
                  </div>
                  
                  <label className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-border-light rounded-lg p-4 text-center hover:border-primary transition-all">
                      <span className="text-text-light">Click to select images</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </label>
                  
                  {previewImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {previewImages.map((url, index) => (
                        <div key={index} className="relative w-16 h-16">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-16 h-16 object-cover rounded border border-border-light"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={addProduct}
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all font-medium"
                >
                  {isSubmitting ? 'Adding...' : 'Add Product'}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-danger bg-opacity-10 border-l-4 border-danger text-danger rounded">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Product List */}
          <div className="lg:col-span-2">
            <div className="bg-card-bg rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 text-primary">Products</h2>
              
              {products.length === 0 ? (
                <div className="text-center p-8 text-text-light border border-dashed border-border-light rounded-lg">
                  No products found. Add your first product!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-light">
                        <th className="p-3 text-left font-semibold">Name</th>
                        <th className="p-3 text-left font-semibold">Price</th>
                        <th className="p-3 text-left font-semibold">Category</th>
                        <th className="p-3 text-left font-semibold">Images</th>
                        <th className="p-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-border-light hover:bg-background transition-all">
                          <td className="p-3 font-medium">{product.name}</td>
                          <td className="p-3 text-secondary font-medium">${product.price}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-primary bg-opacity-10 text-primary rounded-full text-sm">
                              {categories.find((cat) => cat.id === product.category_id)?.name || 'N/A'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-2">
                              {product.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={`http://localhost:5000/${image}`}
                                  alt={`Product ${index + 1}`}
                                  className="w-12 h-12 object-cover rounded-lg border border-border-light shadow-sm"
                                />
                              ))}
                              {product.images.length === 0 && (
                                <span className="text-text-light text-sm">No images</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => viewProduct(product.id)}
                                className="p-2 bg-primary bg-opacity-10 text-primary rounded hover:bg-opacity-20 transition-all"
                                title="View Product"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => editProduct(product.id)}
                                className="p-2 bg-secondary bg-opacity-10 text-secondary rounded hover:bg-opacity-20 transition-all"
                                title="Edit Product"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => deleteProduct(product.id)}
                                className="p-2 bg-danger bg-opacity-10 text-danger rounded hover:bg-opacity-20 transition-all"
                                title="Delete Product"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
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

export default ProductManagement;