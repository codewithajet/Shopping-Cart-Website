    import React, { useState, useEffect } from 'react';

    const SalesManagement = () => {
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [newSale, setNewSale] = useState({
        product_id: '',
        quantity: '',
        total_price: '',
    });
    const [error, setError] = useState('');

    // Fetch sales and products from the backend
    const fetchSales = async () => {
        try {
        const response = await fetch('http://localhost:5000/sales');
        const data = await response.json();
        setSales(data);
        } catch (err) {
        setError('Failed to fetch sales');
        }
    };

    const fetchProducts = async () => {
        try {
        const response = await fetch('http://localhost:5000/products');
        const data = await response.json();
        setProducts(data);
        } catch (err) {
        setError('Failed to fetch products');
        }
    };

    // Add a new sale
    const addSale = async () => {
        if (!newSale.product_id || !newSale.quantity || !newSale.total_price) {
        setError('All fields are required');
        return;
        }

        try {
        const response = await fetch('http://localhost:5000/sales', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(newSale),
        });

        if (response.ok) {
            setNewSale({ product_id: '', quantity: '', total_price: '' });
            fetchSales(); // Refresh the list
        } else {
            setError('Failed to add sale');
        }
        } catch (err) {
        setError('An error occurred. Please try again.');
        }
    };

    // Delete a sale
    const deleteSale = async (id) => {
        try {
        const response = await fetch(`http://localhost:5000/sales/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            fetchSales(); // Refresh the list
        } else {
            setError('Failed to delete sale');
        }
        } catch (err) {
        setError('An error occurred. Please try again.');
        }
    };

    // Fetch sales and products on component mount
    useEffect(() => {
        fetchSales();
        fetchProducts();
    }, []);

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Sales Management</h1>

        {/* Add Sale Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Sale</h2>
            <div className="space-y-4">
            <select
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newSale.product_id}
                onChange={(e) => setNewSale({ ...newSale, product_id: e.target.value })}
            >
                <option value="">Select Product</option>
                {products.map((product) => (
                <option key={product.id} value={product.id}>
                    {product.name}
                </option>
                ))}
            </select>
            <input
                type="number"
                placeholder="Quantity"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newSale.quantity}
                onChange={(e) => setNewSale({ ...newSale, quantity: e.target.value })}
            />
            <input
                type="number"
                placeholder="Total Price"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newSale.total_price}
                onChange={(e) => setNewSale({ ...newSale, total_price: e.target.value })}
            />
            <button
                onClick={addSale}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Add Sale
            </button>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        {/* Sales List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Sales</h2>
            <table className="w-full">
            <thead>
                <tr className="bg-gray-100">
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Quantity</th>
                <th className="p-3 text-left">Total Price</th>
                <th className="p-3 text-left">Actions</th>
                </tr>
            </thead>
            <tbody>
                {sales.map((sale) => (
                <tr key={sale.id} className="border-b">
                    <td className="p-3">
                    {products.find((product) => product.id === sale.product_id)?.name || 'N/A'}
                    </td>
                    <td className="p-3">{sale.quantity}</td>
                    <td className="p-3">${sale.total_price}</td>
                    <td className="p-3">
                    <button
                        onClick={() => deleteSale(sale.id)}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                    >
                        Delete
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    );
    };

    export default SalesManagement;