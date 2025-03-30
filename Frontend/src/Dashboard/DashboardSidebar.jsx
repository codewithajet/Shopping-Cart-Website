import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Users, Tag, UserCheck, PieChart, Layers } from 'lucide-react';

const DashboardSidebar = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { path: "/dashboard", label: "Home", icon: <Home size={20} /> },
        { path: "/dashboard/categories", label: "Categories", icon: <Layers size={20} /> },
        { path: "/dashboard/products", label: "Products", icon: <ShoppingBag size={20} /> },
        { path: "/dashboard/users", label: "Users", icon: <Users size={20} /> },
        { path: "/dashboard/sale", label: "Sale", icon: <Tag size={20} /> },
        { path: "/dashboard/role", label: "Role", icon: <UserCheck size={20} /> },
        { path: "/dashboard/report", label: "Report", icon: <PieChart size={20} /> },
    ];

    return (
        <aside className={`bg-gradient-to-b from-[#2c3e50] to-[#1a2533] text-white ${isCollapsed ? 'w-20' : 'w-64'} min-h-screen p-4 transition-all duration-300 shadow-lg fixed md:relative z-10`}>
        <div className="flex items-center justify-between mb-8">
            {!isCollapsed && (
            <h2 className="text-xl font-bold bg-gradient-to-r from-[#4a6fa5] to-[#ff9a3c] bg-clip-text text-transparent">
                EcoStore
            </h2>
            )}
            <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
            {isCollapsed ? "→" : "←"}
            </button>
        </div>
        
        <div className="space-y-1">
            {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
                <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                    ? 'bg-gradient-to-r from-[#4a6fa5] to-[#324a6d] text-white shadow-md' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                >
                <span className="mr-3">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
                </Link>
            );
            })}
        </div>
        
        {!isCollapsed && (
            <div className="absolute bottom-8 left-0 right-0 px-4">
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 text-center text-sm">
                <p className="text-gray-300">Need help?</p>
                <button className="mt-2 text-[#ff9a3c] hover:text-[#ffaf6d] font-medium">
                Support Center
                </button>
            </div>
            </div>
        )}
        </aside>
    );
};

export default DashboardSidebar;