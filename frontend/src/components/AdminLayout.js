import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/doanh_nghiep', label: '📊 Dashboard', testId: 'nav-dashboard' },
    { path: '/doanh_nghiep/boxes', label: '📦 Thùng Hàng', testId: 'nav-boxes' },
    { path: '/doanh_nghiep/customers', label: '👤 Khách Hàng', testId: 'nav-customers' },
    { path: '/doanh_nghiep/shippers', label: '🚚 Shippers', testId: 'nav-shippers' },
    { path: '/doanh_nghiep/employees', label: '💼 Nhân Viên', testId: 'nav-employees' },
  ];

  const isActive = (path) => {
    if (path === '/doanh_nghiep') return location.pathname === '/doanh_nghiep' || location.pathname === '/doanh_nghiep/';
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white shadow-md flex flex-col" data-testid="admin-sidebar">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">📦 Smart Storage</h2>
          <p className="text-xs text-gray-500 mt-1">Admin Panel • Đà Nẵng</p>
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
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
