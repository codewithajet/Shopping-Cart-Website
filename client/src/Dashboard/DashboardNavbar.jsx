import { Bell, Menu, Search, Settings, HelpCircle, LogOut } from 'lucide-react';
import React, { useState } from 'react';

const DashboardNavbar = ({ onMenuClick }) => {
    // State to control tooltips
    const [activeTooltip, setActiveTooltip] = useState(null);
    
    // Show tooltip handler
    const showTooltip = (id) => {
        setActiveTooltip(id);
    };
    
    // Hide tooltip handler
    const hideTooltip = () => {
        setActiveTooltip(null);
    };

    return (
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
            <button 
                onClick={onMenuClick}
                className="p-2 rounded-full hover:bg-gray-100 md:hidden transition-colors"
            >
                <Menu size={22} className="text-[#4a6fa5]" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#4a6fa5] to-[#ff9a3c] bg-clip-text text-transparent">
                Eco<span>Store</span>
            </h1>
            </div>
            
            <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
                <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent w-60 text-sm"
                />
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            </div>
            
            <div className="flex items-center gap-4">
                <div className="relative">
                    <button 
                        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                        onMouseEnter={() => showTooltip('notifications')}
                        onMouseLeave={hideTooltip}
                    >
                        <Bell size={22} className="text-gray-500" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff6b6b] rounded-full text-white text-xs flex items-center justify-center">3</span>
                    </button>
                    {activeTooltip === 'notifications' && (
                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                            Notifications
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                        </div>
                    )}
                </div>
                
                <div className="relative hidden md:block">
                    <button 
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        onMouseEnter={() => showTooltip('help')}
                        onMouseLeave={hideTooltip}
                    >
                        <HelpCircle size={22} className="text-gray-500" />
                    </button>
                    {activeTooltip === 'help' && (
                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                            Help Center
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                        </div>
                    )}
                </div>
                
                <div className="relative hidden md:block">
                    <button 
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        onMouseEnter={() => showTooltip('settings')}
                        onMouseLeave={hideTooltip}
                    >
                        <Settings size={22} className="text-gray-500" />
                    </button>
                    {activeTooltip === 'settings' && (
                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                            Settings
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                        </div>
                    )}
                </div>
                
                <div className="relative hidden md:block">
                    <button 
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-500"
                        onMouseEnter={() => showTooltip('logout')}
                        onMouseLeave={hideTooltip}
                    >
                        <LogOut size={22} />
                    </button>
                    {activeTooltip === 'logout' && (
                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                            Logout
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                        </div>
                    )}
                </div>
                
                <div className="h-10 flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                <span className="text-sm font-medium text-gray-700 hidden md:block">John Doe</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#4a6fa5] to-[#324a6d] text-white flex items-center justify-center font-medium text-sm">
                    JD
                </div>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
};

export default DashboardNavbar;