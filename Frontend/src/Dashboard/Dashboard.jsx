import React from 'react';

const Dashboard = () => {
  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome to the Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Total Products */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold">Total Products</h2>
            <p className="text-3xl font-bold text-blue-600">1,234</p>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold">Total Orders</h2>
            <p className="text-3xl font-bold text-green-600">567</p>
          </div>

          {/* Card 3: Total Users */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold">Total Users</h2>
            <p className="text-3xl font-bold text-purple-600">89</p>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Order ID</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3">#12345</td>
                <td className="p-3">John Doe</td>
                <td className="p-3">$99.99</td>
                <td className="p-3">
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    Delivered
                  </span>
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-3">#12346</td>
                <td className="p-3">Jane Smith</td>
                <td className="p-3">$49.99</td>
                <td className="p-3">
                  <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
                    Pending
                  </span>
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-3">#12347</td>
                <td className="p-3">Alice Johnson</td>
                <td className="p-3">$199.99</td>
                <td className="p-3">
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    Shipped
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  );
};

export default Dashboard;