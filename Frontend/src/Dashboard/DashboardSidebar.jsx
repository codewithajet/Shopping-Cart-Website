    import React from 'react';
    import { Link } from 'react-router-dom';

    const DashboardSidebar = () => {
    return (
        <aside className="bg-gray-800 text-white w-64 min-h-screen p-4">
        <h2 className="text-xl font-bold mb-6">Dashboard</h2>
        <ul className="space-y-2">
            <li>
            <Link
                to="/dashboard"
                className="block py-2 px-4 hover:bg-gray-700 rounded-lg transition duration-200"
            >
                Home
            </Link>
            </li>
            <li>
            <Link
                to="/dashboard/categories"
                className="block py-2 px-4 hover:bg-gray-700 rounded-lg transition duration-200"
            >
                Categories
            </Link>
            </li>
            <li>
            <Link
                to="/dashboard/products"
                className="block py-2 px-4 hover:bg-gray-700 rounded-lg transition duration-200"
            >
                Products
            </Link>
            </li>
            <li>
            <Link
                to="/dashboard/users"
                className="block py-2 px-4 hover:bg-gray-700 rounded-lg transition duration-200"
            >
                Users
            </Link>
            </li>
            <li>
            <Link
                to="/dashboard/sale"
                className="block py-2 px-4 hover:bg-gray-700 rounded-lg transition duration-200"
            >
                Sale
            </Link>
            </li>
            <li>
            <Link
                to="/dashboard/role"
                className="block py-2 px-4 hover:bg-gray-700 rounded-lg transition duration-200"
            >
                Role
            </Link>
            </li>
            <li>
            <Link
                to="/dashboard/report"
                className="block py-2 px-4 hover:bg-gray-700 rounded-lg transition duration-200"
            >
                Report
            </Link>
            </li>
        </ul>
        </aside>
    );
    };

    export default DashboardSidebar;