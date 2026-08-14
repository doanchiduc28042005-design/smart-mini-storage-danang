import React, { Suspense } from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/AdminLayout";

const RedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      navigate(redirect, { replace: true });
    }
  }, [location, navigate]);
  return null;
};

const AdminDashboard = React.lazy(() => import("@/pages/AdminDashboard"));
const OrdersManagement = React.lazy(() => import("@/pages/OrdersManagement"));
const CustomersManagement = React.lazy(() => import("@/pages/CustomersManagement"));
const ShippersManagement = React.lazy(() => import("@/pages/ShippersManagement"));
const EmployeesManagement = React.lazy(() => import("@/pages/EmployeesManagement"));
const ShipperApp = React.lazy(() => import("@/pages/ShipperApp"));
const ShipperRegister = React.lazy(() => import("@/pages/ShipperRegister"));
const ShipperLogin = React.lazy(() => import("@/pages/ShipperLogin"));
const ShipperSetupPassword = React.lazy(() => import("@/pages/ShipperSetupPassword"));
const ShipperForgotPassword = React.lazy(() => import("@/pages/ShipperForgotPassword"));
const TrackingPage = React.lazy(() => import("@/pages/TrackingPage"));
const CustomerHub = React.lazy(() => import("@/pages/CustomerHub"));
const CustomerRegister = React.lazy(() => import("@/pages/CustomerRegister"));
const CustomerLogin = React.lazy(() => import("@/pages/CustomerLogin"));
const CustomerDashboard = React.lazy(() => import("@/pages/CustomerDashboard"));
const TermsPage = React.lazy(() => import("@/pages/TermsPage"));
const AIChatbot = React.lazy(() => import("@/components/AIChatbot"));
const LandingPage = React.lazy(() => import("@/pages/LandingPage"));

const GlobalWidgets = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isInactive, setIsInactive] = React.useState(false);

  React.useEffect(() => {
    let timeoutId;
    const resetTimer = () => {
      setIsInactive(false);
      clearTimeout(timeoutId);
      // 15 minutes = 15 * 60 * 1000 = 900000 ms
      timeoutId = setTimeout(() => setIsInactive(true), 900000);
    };

    if (user && user.role === 'customer' && location.pathname.startsWith('/customer/dashboard')) {
      resetTimer();
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('scroll', resetTimer);
      window.addEventListener('click', resetTimer);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('mousemove', resetTimer);
        window.removeEventListener('keydown', resetTimer);
        window.removeEventListener('scroll', resetTimer);
        window.removeEventListener('click', resetTimer);
      };
    }
  }, [user, location.pathname]);
  
  // Chỉ hiển thị cho khách hàng đã đăng nhập và đang ở dashboard
  if (!user || user.role !== 'customer') return null;
  if (!location.pathname.startsWith('/customer/dashboard')) return null;
  if (isInactive) return null;
  
  return (
    <>
      {/* Facebook Messenger Bubble */}
      <a 
        href="https://www.facebook.com/profile.php?id=61591673590432" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-[100px] right-6 z-50 bg-[#1877F2] text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center"
        title="Chat với chúng tôi qua Facebook"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"></path>
        </svg>
      </a>

      <Suspense fallback={null}>
        <AIChatbot />
      </Suspense>
    </>
  );
};

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

function App() {
  return (
    <div className="App">
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <AuthProvider>
          <RedirectHandler />
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/shipper" element={<ShipperApp />} />
              <Route path="/shipper/register" element={<ShipperRegister />} />
              <Route path="/shipper/login" element={<ShipperLogin />} />
              <Route path="/shipper/setup-password" element={<ShipperSetupPassword />} />
              <Route path="/shipper/forgot-password" element={<ShipperForgotPassword />} />
              <Route path="/track" element={<TrackingPage />} />
              <Route path="/track/:orderId" element={<TrackingPage />} />

              {/* Customer auth */}
              <Route path="/customer" element={<CustomerHub />} />
              <Route path="/customer/register" element={<CustomerRegister />} />
              <Route path="/customer/login" element={<CustomerLogin />} />
              <Route path="/customer/dashboard" element={<RequireAuth><CustomerDashboard /></RequireAuth>} />

              {/* Admin */}
              <Route path="/doanh_nghiep" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
              <Route path="/doanh_nghiep/boxes" element={<AdminLayout><OrdersManagement /></AdminLayout>} />
              <Route path="/doanh_nghiep/customers" element={<AdminLayout><CustomersManagement /></AdminLayout>} />
              <Route path="/doanh_nghiep/shippers" element={<AdminLayout><ShippersManagement /></AdminLayout>} />
              <Route path="/doanh_nghiep/employees" element={<AdminLayout><EmployeesManagement /></AdminLayout>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <GlobalWidgets />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
