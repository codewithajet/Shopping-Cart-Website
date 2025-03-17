    import React from 'react';

    const DashboardNavbar = () => {
    return (
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="text-xl font-bold text-blue-600">Shopping Cart</div>
        <div className="flex items-center space-x-4">
            <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Profile
            </button>
        </div>
        </nav>
    );
    };

    export default DashboardNavbar;