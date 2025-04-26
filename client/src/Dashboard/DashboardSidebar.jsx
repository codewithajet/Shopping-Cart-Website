import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Users, Tag, UserCheck, PieChart, Layers, ShoppingCart, Headphones, Award, ChevronLeft, ChevronRight } from 'lucide-react';

const DashboardSidebar = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const menuItems = [
        { path: "/dashboard", label: "Home", icon: <Home size={20} /> },
        { path: "/dashboard/categories", label: "Categories", icon: <Layers size={20} /> },
        { path: "/dashboard/products", label: "Products", icon: <ShoppingBag size={20} /> },
        { path: "/dashboard/orders", label: "Orders", icon: <ShoppingCart size={20} /> },
        { path: "/dashboard/users", label: "Users", icon: <Users size={20} /> },
        { path: "/dashboard/delivery", label: "Delivery", icon: <Tag size={20} /> },
        { path: "/dashboard/sale", label: "Sale", icon: <Tag size={20} /> },
        { path: "/dashboard/brands", label: "Brands", icon: <Award size={20} /> },
        { path: "/dashboard/role", label: "Role", icon: <UserCheck size={20} /> },
        { path: "/dashboard/support", label: "Support", icon: <Headphones size={20} /> },
        { path: "/dashboard/report", label: "Report", icon: <PieChart size={20} /> },
    ];
    
    return (
        <aside 
            className={`bg-gradient-to-b from-[#2c3e50] to-[#1a2533] text-white 
                ${isCollapsed ? 'w-20' : 'w-64'} 
                min-h-screen transition-all duration-300 
                shadow-xl border-r border-gray-800 
                fixed md:relative z-10 flex flex-col`}
        >
            {/* Header/Logo Area */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 mb-6">
                {!isCollapsed && (
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#4a6fa5] to-[#ff9a3c] bg-clip-text text-transparent">
                    EcoStore
                </h2>
                )}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors ml-auto flex items-center justify-center"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>
            
            {/* Menu Items */}
            <nav className="flex-grow px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center group
                                ${isCollapsed ? 'justify-center' : 'justify-start'} 
                                px-4 py-3 rounded-lg transition-all duration-200
                                ${isActive
                                    ? 'bg-gradient-to-r from-[#4a6fa5] to-[#324a6d] text-white shadow-md'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }
                                ${isActive && isCollapsed ? 'border-l-4 border-[#ff9a3c]' : ''}
                            `}
                            title={isCollapsed ? item.label : ""}
                        >
                            <span className={`${isActive ? 'text-white' : 'text-gray-400'} ${isCollapsed ? '' : 'mr-3'} transition-colors`}>
                                {item.icon}
                            </span>
                            {!isCollapsed && (
                                <span className="font-medium tracking-wide">{item.label}</span>
                            )}
                            {isCollapsed && (
                                <span className="absolute left-full ml-2 bg-gray-800 text-white px-2 py-1 rounded text-xs
                                    opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
            
            {/* Support Section */}
            <div className={`mt-auto p-4 ${isCollapsed ? 'hidden' : 'block'}`}>
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-4 shadow-inner text-center">
                    <p className="text-gray-300 text-sm mb-2">Need help?</p>
                    <button className="w-full py-2 px-3 bg-[#ff9a3c] hover:bg-[#ffaf6d] text-white rounded-md text-sm font-medium transition-colors">
                        Support Center
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default DashboardSidebar;