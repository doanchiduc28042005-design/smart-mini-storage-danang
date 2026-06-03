import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import BoxesManagement from "@/pages/BoxesManagement";
import CustomersManagement from "@/pages/CustomersManagement";
import ShippersManagement from "@/pages/ShippersManagement";
import ShipperApp from "@/pages/ShipperApp";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4" data-testid="landing-page">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            📦 Smart Mini Storage
          </h1>
          <p className="text-xl text-gray-600">
            Hệ thống quản lý kho thông minh với QR Code
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/admin" data-testid="goto-admin">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-blue-500">
              <div className="text-6xl mb-4">💼</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
              <p className="text-gray-600 mb-4">
                Quản lý thùng hàng, khách hàng, shippers và theo dõi thống kê tổng quan
              </p>
              <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                Truy cập Admin →
              </span>
            </div>
          </Link>

          <Link to="/shipper" data-testid="goto-shipper">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-pink-500">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">App Shipper</h2>
              <p className="text-gray-600 mb-4">
                Quét mã QR và cập nhật trạng thái giao hàng nhanh chóng
              </p>
              <span className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium">
                Mở App Shipper →
              </span>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>✨ Tính năng: QR Scanner • Tracking Real-time • Quản lý đa kênh</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/shipper" element={<ShipperApp />} />
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/boxes" element={<AdminLayout><BoxesManagement /></AdminLayout>} />
          <Route path="/admin/customers" element={<AdminLayout><CustomersManagement /></AdminLayout>} />
          <Route path="/admin/shippers" element={<AdminLayout><ShippersManagement /></AdminLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
