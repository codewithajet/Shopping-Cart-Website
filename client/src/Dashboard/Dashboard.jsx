import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ShoppingBag, Users, CreditCard, TrendingUp, Package, Calendar } from 'lucide-react';

const Dashboard = () => {
  // Sample data for sales chart
  const salesData = [
    { name: 'Jan', sales: 4000, profit: 2400 },
    { name: 'Feb', sales: 3000, profit: 1800 },
    { name: 'Mar', sales: 5000, profit: 3100 },
    { name: 'Apr', sales: 2780, profit: 1908 },
    { name: 'May', sales: 1890, profit: 1300 },
    { name: 'Jun', sales: 6390, profit: 4200 },
  ];

  // Sample data for product categories pie chart
  const categoryData = [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 25 },
    { name: 'Home', value: 20 },
    { name: 'Beauty', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const COLORS = ['#4a6fa5', '#ff9a3c', '#ff6b6b', '#4caf50', '#324a6d'];

  return (
    <div className="min-h-screen bg-[#f7f9fc] font-sans" style={{ fontFamily: 'var(--font-primary)' }}>
      {/* Top Navigation */}
    

      <div className="p-6 space-y-6">
        {/* Header with welcome message */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#2d3748] mb-1">Welcome back, Admin</h1>
            <p className="text-[#718096] flex items-center gap-2">
              <Calendar size={16} className="text-[#ff9a3c]" />
              <span>Sunday, March 30, 2025</span>
            </p>
          </div>
          <button className="bg-gradient-to-r from-[#4a6fa5] to-[#324a6d] text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2">
            <TrendingUp size={18} />
            <span>View Reports</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Products */}
          <div className="bg-gradient-to-br from-[#ffffff] to-[#f0f5ff] p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-[#4a6fa5]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#718096] font-medium">Total Products</p>
                <h2 className="text-3xl font-bold text-[#2d3748]">1,234</h2>
                <p className="text-[#4caf50] text-sm font-medium mt-1 flex items-center">
                  <span className="text-lg mr-1">↑</span> 12.5% from last month
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#4a6fa5] to-[#324a6d] p-3 rounded-full shadow-md">
                <Package size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-gradient-to-br from-[#ffffff] to-[#fff5ea] p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-[#ff9a3c]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#718096] font-medium">Total Orders</p>
                <h2 className="text-3xl font-bold text-[#2d3748]">567</h2>
                <p className="text-[#4caf50] text-sm font-medium mt-1 flex items-center">
                  <span className="text-lg mr-1">↑</span> 8.2% from last month
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#ff9a3c] to-[#ff8227] p-3 rounded-full shadow-md">
                <ShoppingBag size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* Card 3: Total Users */}
          <div className="bg-gradient-to-br from-[#ffffff] to-[#fff0f0] p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-[#ff6b6b]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#718096] font-medium">Total Users</p>
                <h2 className="text-3xl font-bold text-[#2d3748]">89</h2>
                <p className="text-[#4caf50] text-sm font-medium mt-1 flex items-center">
                  <span className="text-lg mr-1">↑</span> 5.7% from last month
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#ff6b6b] to-[#f44336] p-3 rounded-full shadow-md">
                <Users size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* Card 4: Revenue */}
          <div className="bg-gradient-to-br from-[#ffffff] to-[#f0fff5] p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-[#4caf50]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#718096] font-medium">Total Revenue</p>
                <h2 className="text-3xl font-bold text-[#2d3748]">$12,450</h2>
                <p className="text-[#4caf50] text-sm font-medium mt-1 flex items-center">
                  <span className="text-lg mr-1">↑</span> 10.3% from last month
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#4caf50] to-[#388e3c] p-3 rounded-full shadow-md">
                <CreditCard size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2 border border-[#e2e8f0] hover:shadow-lg transition-all duration-300">
            <h2 className="text-xl font-semibold text-[#2d3748] mb-4 flex items-center">
              <TrendingUp size={20} className="text-[#4a6fa5] mr-2" />
              Sales Overview
            </h2>
            <div className="bg-gradient-to-r from-[#f0f5ff] to-[#ffffff] p-4 rounded-lg">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#718096" />
                    <YAxis stroke="#718096" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        borderColor: '#e2e8f0',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-sm)'
                      }} 
                    />
                    <Line type="monotone" dataKey="sales" stroke="#4a6fa5" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="profit" stroke="#4caf50" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center mt-4 space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#4a6fa5] rounded-full mr-2"></div>
                  <span className="text-[#718096]">Sales</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#4caf50] rounded-full mr-2"></div>
                  <span className="text-[#718096]">Profit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-[#e2e8f0] hover:shadow-lg transition-all duration-300">
            <h2 className="text-xl font-semibold text-[#2d3748] mb-4 flex items-center">
              <Package size={20} className="text-[#ff9a3c] mr-2" />
              Product Categories
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-[#e2e8f0] hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#2d3748] flex items-center">
              <ShoppingBag size={20} className="text-[#ff6b6b] mr-2" />
              Top Products
            </h2>
            <button className="text-[#4a6fa5] hover:text-[#324a6d] font-medium transition-colors">
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-[#e2e8f0] rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-[#ffffff] to-[#f0f5ff]">
              <div className="w-full h-40 bg-[#4a6fa5] bg-opacity-10 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-5xl text-[#4a6fa5]">🎧</span>
              </div>
              <h3 className="font-medium text-[#2d3748]">Wireless Earbuds</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-[#4a6fa5]">$89.99</span>
                <span className="text-[#718096] text-sm">234 sold</span>
              </div>
            </div>
            <div className="border border-[#e2e8f0] rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-[#ffffff] to-[#fff5ea]">
              <div className="w-full h-40 bg-[#ff9a3c] bg-opacity-10 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-5xl text-[#ff9a3c]">⌚</span>
              </div>
              <h3 className="font-medium text-[#2d3748]">Smart Watch</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-[#ff9a3c]">$199.99</span>
                <span className="text-[#718096] text-sm">189 sold</span>
              </div>
            </div>
            <div className="border border-[#e2e8f0] rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-[#ffffff] to-[#fff0f0]">
              <div className="w-full h-40 bg-[#ff6b6b] bg-opacity-10 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-5xl text-[#ff6b6b]">🔊</span>
              </div>
              <h3 className="font-medium text-[#2d3748]">Bluetooth Speaker</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-[#ff6b6b]">$129.99</span>
                <span className="text-[#718096] text-sm">156 sold</span>
              </div>
            </div>
            <div className="border border-[#e2e8f0] rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-[#ffffff] to-[#f0fff5]">
              <div className="w-full h-40 bg-[#4caf50] bg-opacity-10 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-5xl text-[#4caf50]">📱</span>
              </div>
              <h3 className="font-medium text-[#2d3748]">Smartphone</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-[#4caf50]">$699.99</span>
                <span className="text-[#718096] text-sm">128 sold</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-[#e2e8f0] hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#2d3748] flex items-center">
              <ShoppingBag size={20} className="text-[#4caf50] mr-2" />
              Recent Orders
            </h2>
            <button className="bg-[#4a6fa5] hover:bg-[#324a6d] text-white px-3 py-1.5 rounded-lg transition-all duration-300 text-sm font-medium">
              View All Orders
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-3 text-left text-[#718096] font-semibold bg-[#f7f9fc] rounded-tl-lg">Order ID</th>
                  <th className="p-3 text-left text-[#718096] font-semibold bg-[#f7f9fc]">Customer</th>
                  <th className="p-3 text-left text-[#718096] font-semibold bg-[#f7f9fc]">Date</th>
                  <th className="p-3 text-left text-[#718096] font-semibold bg-[#f7f9fc]">Amount</th>
                  <th className="p-3 text-left text-[#718096] font-semibold bg-[#f7f9fc]">Payment</th>
                  <th className="p-3 text-left text-[#718096] font-semibold bg-[#f7f9fc] rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#e2e8f0] hover:bg-[#f7f9fc]">
                  <td className="p-3 font-medium">#12345</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#4a6fa5] text-white flex items-center justify-center font-bold text-xs">JD</div>
                      <span>John Doe</span>
                    </div>
                  </td>
                  <td className="p-3 text-[#718096]">Mar 28, 2025</td>
                  <td className="p-3 font-medium">$99.99</td>
                  <td className="p-3">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-[#4caf50] rounded-full"></span>
                      <span className="text-[#718096]">Credit Card</span>
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="bg-[#4caf50] bg-opacity-10 text-[#4caf50] px-3 py-1 rounded-full text-sm font-medium">
                      Delivered
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-[#e2e8f0] hover:bg-[#f7f9fc]">
                  <td className="p-3 font-medium">#12346</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#ff9a3c] text-white flex items-center justify-center font-bold text-xs">JS</div>
                      <span>Jane Smith</span>
                    </div>
                  </td>
                  <td className="p-3 text-[#718096]">Mar 27, 2025</td>
                  <td className="p-3 font-medium">$49.99</td>
                  <td className="p-3">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-[#ff9a3c] rounded-full"></span>
                      <span className="text-[#718096]">PayPal</span>
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="bg-[#ff9a3c] bg-opacity-10 text-[#ff9a3c] px-3 py-1 rounded-full text-sm font-medium">
                      Pending
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-[#e2e8f0] hover:bg-[#f7f9fc]">
                  <td className="p-3 font-medium">#12347</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#ff6b6b] text-white flex items-center justify-center font-bold text-xs">AJ</div>
                      <span>Alice Johnson</span>
                    </div>
                  </td>
                  <td className="p-3 text-[#718096]">Mar 26, 2025</td>
                  <td className="p-3 font-medium">$199.99</td>
                  <td className="p-3">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-[#4a6fa5] rounded-full"></span>
                      <span className="text-[#718096]">Credit Card</span>
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="bg-[#4a6fa5] bg-opacity-10 text-[#4a6fa5] px-3 py-1 rounded-full text-sm font-medium">
                      Shipped
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-[#e2e8f0] hover:bg-[#f7f9fc]">
                  <td className="p-3 font-medium">#12348</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#4caf50] text-white flex items-center justify-center font-bold text-xs">RB</div>
                      <span>Robert Brown</span>
                    </div>
                  </td>
                  <td className="p-3 text-[#718096]">Mar 25, 2025</td>
                  <td className="p-3 font-medium">$149.99</td>
                  <td className="p-3">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-[#f44336] rounded-full"></span>
                      <span className="text-[#718096]">Apple Pay</span>
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="bg-[#f44336] bg-opacity-10 text-[#f44336] px-3 py-1 rounded-full text-sm font-medium">
                      Cancelled
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;