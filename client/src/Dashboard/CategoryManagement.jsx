import React, { useState, useEffect, useRef } from 'react';
import {
  PlusCircle, Trash2, Edit, Search, RefreshCw, Save, X, Image as ImageIcon, AlertCircle
} from 'lucide-react';

const API = "http://127.0.0.1:5000/categories";
const UPLOAD_API = "http://127.0.0.1:5000/upload";

const ICON_OPTIONS = [
  "📱", "👗", "🏠", "⚽", "📚", "💄", "🛒", "💻", "🎧", "🧸", "🍔", "⚡", "🚗", "🎮", "🧥"
];

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image: '', icon: ICON_OPTIONS[0] });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const fileInputRef = useRef(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Failed to add category");
      showNotification(data.message || "Category added!", "success");
      setIsAdding(false);
      setNewCategory({ name: '', description: '', image: '', icon: ICON_OPTIONS[0] });
      fetchCategories();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const updateCategory = async () => {
    if (!editingCategory.name.trim()) return;
    try {
      const res = await fetch(`${API}/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCategory)
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Failed to update category");
      showNotification(data.message || "Category updated!", "success");
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Failed to delete category");
      showNotification(data.message || "Category deleted!", "success");
      fetchCategories();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  // Icon picker
  const pickIcon = (icon, isEdit = false) => {
    setIconPickerOpen(false);
    if (isEdit && editingCategory) {
      setEditingCategory(ec => ({ ...ec, icon }));
    } else {
      setNewCategory(nc => ({ ...nc, icon }));
    }
  };

  // File upload handler
  const handleImageUpload = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(UPLOAD_API, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || "Upload failed");
      if (isEdit && editingCategory) {
        setEditingCategory(ec => ({ ...ec, image: data.url }));
      } else {
        setNewCategory(nc => ({ ...nc, image: data.url }));
      }
      showNotification("Image uploaded!", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 2500);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => { fetchCategories(); }, []);

  // UI
  const Notification = ({ message, type }) => (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded shadow transition-all ${
      type === 'success'
      ? 'bg-green-50 text-green-700 border-l-4 border-green-600'
      : 'bg-red-50 text-red-700 border-l-4 border-red-600'
    }`}>
      <div className="flex items-center">
        {type === 'success'
          ? <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          : <AlertCircle size={20} className="mr-2" />
        }
        <span>{message}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {notification.show && <Notification message={notification.message} type={notification.type} />}
      <div className="max-w-3xl mx-auto py-8 px-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Category Management</h2>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 flex items-center text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <PlusCircle size={18} className="mr-1" />
            Add Category
          </button>
        </div>

        {/* Add Category */}
        {isAdding && (
          <form onSubmit={addCategory} className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <input
                className="border px-2 py-1 rounded w-full md:w-auto"
                placeholder="Name"
                value={newCategory.name}
                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                required
              />
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setIconPickerOpen(iconPickerOpen === "add" ? false : "add")}
                  className="border px-2 py-1 rounded bg-white flex items-center"
                  tabIndex={-1}
                >
                  <span className="text-xl mr-1">{newCategory.icon}</span>
                  Pick Icon
                </button>
                {iconPickerOpen === "add" && (
                  <div className="absolute z-20 bg-white p-2 rounded shadow border top-10 left-0 flex flex-wrap w-64">
                    {ICON_OPTIONS.map(ico => (
                      <button key={ico} type="button" className="p-2 text-2xl hover:bg-blue-200 rounded"
                        onClick={() => pickIcon(ico)}
                      >{ico}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={e => handleImageUpload(e)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="border px-2 py-1 rounded bg-white flex items-center"
                >
                  <ImageIcon size={18} className="mr-1" /> Upload Image
                </button>
                {newCategory.image && (
                  <img src={newCategory.image} alt="" className="ml-2 w-10 h-8 object-cover rounded border" />
                )}
              </div>
            </div>
            <textarea
              className="border px-2 py-1 rounded w-full mb-2"
              placeholder="Description"
              value={newCategory.description}
              onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
              rows={2}
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Add</button>
              <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-200 px-3 py-1 rounded">Cancel</button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="flex items-center mb-4">
          <div className="relative flex-grow">
            <input
              className="border px-3 py-2 rounded w-full pl-9"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button onClick={fetchCategories} className="ml-2 p-2 bg-white border rounded hover:bg-gray-100">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2">ID</th>
                <th className="p-2">Icon</th>
                <th className="p-2">Name</th>
                <th className="p-2">Description</th>
                <th className="p-2">Image</th>
                <th className="p-2">Products</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center p-8">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="text-center text-red-600 p-8">{error}</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-500 p-8">No categories found.</td></tr>
              ) : filteredCategories.map(category => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="p-2">{category.id}</td>
                  <td className="p-2 text-xl">
                    {editingCategory && editingCategory.id === category.id ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIconPickerOpen(iconPickerOpen === category.id ? false : category.id)}
                          className="border px-2 py-1 rounded bg-white flex items-center"
                        >
                          <span className="text-xl">{editingCategory.icon}</span>
                        </button>
                        {iconPickerOpen === category.id && (
                          <div className="absolute z-20 bg-white p-2 rounded shadow border top-10 left-0 flex flex-wrap w-64">
                            {ICON_OPTIONS.map(ico => (
                              <button key={ico} type="button" className="p-2 text-2xl hover:bg-blue-200 rounded"
                                onClick={() => pickIcon(ico, true)}
                              >{ico}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (category.icon ? category.icon : <span className="text-gray-300">?</span>)}
                  </td>
                  <td className="p-2 font-bold">
                    {editingCategory && editingCategory.id === category.id ? (
                      <input className="border px-2 py-1 rounded w-full"
                        value={editingCategory.name}
                        onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      />
                    ) : category.name}
                  </td>
                  <td className="p-2">
                    {editingCategory && editingCategory.id === category.id ? (
                      <textarea className="border px-2 py-1 rounded w-full"
                        value={editingCategory.description}
                        onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                      />
                    ) : category.description}
                  </td>
                  <td className="p-2">
                    {editingCategory && editingCategory.id === category.id ? (
                      <div className="flex items-center">
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          id={`file-edit-${category.id}`}
                          onChange={e => handleImageUpload(e, true)}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`file-edit-${category.id}`).click()}
                          className="border px-2 py-1 rounded bg-white flex items-center"
                        >
                          <ImageIcon size={18} className="mr-1" /> Upload
                        </button>
                        {editingCategory.image && (
                          <img src={editingCategory.image} alt="" className="ml-2 w-10 h-8 object-cover rounded border" />
                        )}
                      </div>
                    ) : (category.image
                        ? <img src={category.image} alt="" className="w-12 h-8 object-cover rounded" />
                        : <span className="text-gray-300">No image</span>
                      )
                    }
                  </td>
                  <td className="p-2 text-center">{category.productCount}</td>
                  <td className="p-2 text-right">
                    {editingCategory && editingCategory.id === category.id ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={updateCategory} className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 flex items-center text-sm">
                          <Save size={15} className="mr-1" />Save
                        </button>
                        <button onClick={() => setEditingCategory(null)} className="bg-gray-200 px-2 py-1 rounded flex items-center text-sm">
                          <X size={15} className="mr-1" />Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditingCategory(category)} className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center text-sm">
                          <Edit size={15} className="mr-1" />Edit
                        </button>
                        <button onClick={() => deleteCategory(category.id)} className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex items-center text-sm">
                          <Trash2 size={15} className="mr-1" />Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;