import React, { useState } from 'react';
import DashboardNavbar from './DashboardNavbar';
import DashboardSidebar from './DashboardSidebar';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <DashboardNavbar onMenuClick={toggleMobileMenu} />
      <div className="flex flex-1 relative overflow-hidden">
        <div className={`md:block ${isMobileMenuOpen ? 'block' : 'hidden'} h-full overflow-y-auto`}>
          <DashboardSidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-6 md:ml-0 transition-all duration-300">
          <div className="max-w-7xl mx-auto pb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;