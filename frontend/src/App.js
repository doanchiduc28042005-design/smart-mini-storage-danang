import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/AdminLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import BoxesManagement from "@/pages/BoxesManagement";
import CustomersManagement from "@/pages/CustomersManagement";
import ShippersManagement from "@/pages/ShippersManagement";
import ShipperApp from "@/pages/ShipperApp";
import TrackingPage from "@/pages/TrackingPage";
import CustomerRegister from "@/pages/CustomerRegister";
import CustomerLogin from "@/pages/CustomerLogin";
import CustomerDashboard from "@/pages/CustomerDashboard";
import TermsPage from "@/pages/TermsPage";

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/customer/login" replace />;
  return children;
};

const LandingPage = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4" data-testid="landing-page">
      <div className="max-w-6xl w-full mx-auto py-8">
        {/* Top bar for authenticated user */}
        {user && (
          <div className="mb-6 flex justify-end">
            <Link to="/customer/dashboard">
              <span className="inline-block bg-white border border-blue-200 rounded-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50">
                👤 {user.name} • Vào tài khoản
              </span>
            </Link>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            📦 Smart Mini Storage
          </h1>
          <p className="text-xl text-gray-600">
            Hệ thống quản lý kho thông minh với QR Code
          </p>
          <p className="text-sm text-gray-500 mt-2">
            🏙️ Phục vụ khu vực Thành phố Đà Nẵng
          </p>

          {!user && (
            <div className="flex flex-col md:flex-row gap-3 justify-center mt-6">
              <Link to="/customer/register">
                <button className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium shadow-md" data-testid="cta-register">
                  ✨ Đăng Ký Khách Hàng
                </button>
              </Link>
              <Link to="/customer/login">
                <button className="w-full md:w-auto bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-medium" data-testid="cta-login">
                  🔐 Đăng Nhập
                </button>
              </Link>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
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

          <Link to="/track" data-testid="goto-tracking">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-green-500">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tra Cứu Đơn Hàng</h2>
              <p className="text-gray-600 mb-4">
                Khách hàng nhập mã thùng để theo dõi vị trí và trạng thái giao hàng
              </p>
              <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium">
                Theo Dõi Đơn →
              </span>
            </div>
          </Link>
        </div>

        <div className="mt-10 text-center text-sm text-gray-500">
          <Link to="/terms" className="hover:underline" data-testid="footer-terms-link">📜 Điều khoản dịch vụ</Link>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/shipper" element={<ShipperApp />} />
            <Route path="/track" element={<TrackingPage />} />
            <Route path="/track/:boxId" element={<TrackingPage />} />

            {/* Customer auth */}
            <Route path="/customer/register" element={<CustomerRegister />} />
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/dashboard" element={<RequireAuth><CustomerDashboard /></RequireAuth>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
            <Route path="/admin/boxes" element={<AdminLayout><BoxesManagement /></AdminLayout>} />
            <Route path="/admin/customers" element={<AdminLayout><CustomersManagement /></AdminLayout>} />
            <Route path="/admin/shippers" element={<AdminLayout><ShippersManagement /></AdminLayout>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
