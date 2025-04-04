import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserManagement from './Dashboard/UserManagement';
import ProductManagement from './Dashboard/ProductManagement';
import CategoryManagement from './Dashboard/CategoryManagement';
import DashboardLayout from './Dashboard/DashboardLayout';
import Dashboard from './Dashboard/Dashboard';
import Cart from './Page/Cart';
import Login from './components/Login';
import SalesManagement from './Dashboard/SalesManagement';
import RoleManagement from './Dashboard/RoleManagement';
import Report from './Dashboard/Report';
import Checkout from './components/Checkout';
import OrderManagement from './Dashboard/OrderMangement';
import OrderDataFetcher from './Dashboard/OrderDataFetcher';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  return (
    <Router>
      <Routes>
        {/* Default Route (Cart Page) */}
        <Route path="/" element={<Cart />} />

        {/* Login Route */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login onLogin={() => setIsLoggedIn(true)} />
            )
          }
        />

        {/* Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              <DashboardLayout />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="sale" element={<SalesManagement />} />
          <Route path="role" element={<RoleManagement />} />
          <Route path="report" element={<Report />} />
          <Route path="orders" element={<OrderDataFetcher />} />
        </Route>
        <Route path="checkout" element={<Checkout />} />
        {/* Redirect to Login if Route Not Found */}
        {/* <Route path="*" element={<Navigate to="/login" />} /> */}
      </Routes>
    </Router>
  );
};

export default App;