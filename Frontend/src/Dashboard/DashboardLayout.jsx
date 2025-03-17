import React from 'react';
import DashboardNavbar from './DashboardNavbar';
import DashboardSidebar from './DashboardSidebar';
import { Outlet } from 'react-router-dom';


const DashboardLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNavbar />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-6 bg-gray-100">
        <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;