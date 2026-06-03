import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin', label: '📊 Dashboard', testId: 'nav-dashboard' },
    { path: '/admin/boxes', label: '📦 Thùng Hàng', testId: 'nav-boxes' },
    { path: '/admin/customers', label: '👤 Khách Hàng', testId: 'nav-customers' },
    { path: '/admin/shippers', label: '🚚 Shippers', testId: 'nav-shippers' },
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin' || location.pathname === '/admin/';
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white shadow-md flex flex-col" data-testid="admin-sidebar">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">📦 Smart Storage</h2>
          <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              data-testid={item.testId}
              className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Link
            to="/shipper"
            data-testid="nav-shipper-app"
            className="block px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-center rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            📱 Mở App Shipper
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
