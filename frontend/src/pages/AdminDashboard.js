import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getOrders } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MapView from '@/components/MapView';

const StatCard = ({ title, value, description, color = 'blue', testId }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  return (
    <Card className="overflow-hidden" data-testid={testId}>
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-6 text-white`}>
        <CardDescription className="text-white/80 text-sm">{title}</CardDescription>
        <CardTitle className="text-4xl mt-2">{value}</CardTitle>
        {description && <p className="text-white/90 text-sm mt-2">{description}</p>}
      </div>
    </Card>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [orders, setorders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        getDashboardStats(),
        getOrders()
      ]);
      setStats(statsRes.data);
      setorders(ordersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const ordersWithGPS = orders.filter(b => b.last_latitude && b.last_longitude);

  return (
    <div className="p-6 space-y-6" data-testid="admin-dashboard">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard Tổng Quan</h1>
          <p className="text-gray-600 mt-1">Theo dõi hoạt động hệ thống tại Đà Nẵng theo thời gian thực 🏙️</p>
        </div>
        <Button onClick={loadAll} variant="outline" data-testid="refresh-stats">
          ↻ Làm Mới
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📦 Thống Kê Thùng Hàng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Tổng Thùng" value={stats?.orders?.total || 0} color="indigo" testId="stat-total-orders" />
          <StatCard title="Chờ Lấy" value={stats?.orders?.waiting_pickup || 0} color="yellow" testId="stat-waiting-pickup" />
          <StatCard title="Đã Lấy" value={stats?.orders?.picked_up || 0} color="blue" testId="stat-picked-up" />
          <StatCard title="Ở Hub" value={stats?.orders?.in_hub || 0} color="purple" testId="stat-in-hub" />
          <StatCard title="Đã Giao" value={stats?.orders?.delivered || 0} color="green" testId="stat-delivered" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">👥 Thống Kê Tổng Thể</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Khách Hàng" value={stats?.customers?.total || 0} description="Tổng khách hàng đã đăng ký" color="blue" testId="stat-customers" />
          <StatCard title="Shippers" value={`${stats?.shippers?.active || 0}/${stats?.shippers?.total || 0}`} description="Đang hoạt động / Tổng số" color="green" testId="stat-shippers" />
          <StatCard title="Sự Kiện Tracking" value={stats?.tracking_events || 0} description="Tổng lượt quét QR" color="purple" testId="stat-tracking" />
        </div>
      </div>

      {/* Live Map */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🗺️ Bản Đồ Live - Vị Trí Thùng Hàng Tại Đà Nẵng</h2>
        <Card>
          <CardContent className="pt-6">
            <MapView
              height="500px"
              testId="admin-map"
              markers={ordersWithGPS.map(b => ({
                id: b.order_id,
                lat: b.last_latitude,
                lng: b.last_longitude,
                status: b.status,
                title: `📦 ${b.order_id}`,
                description: `KH: ${b.customer_name}`,
                time: new Date(b.last_updated).toLocaleString('vi-VN')
              }))}
            />
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span> Chờ Lấy</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span> Đã Lấy</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span> Ở Hub</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500"></span> Đã Giao</span>
              <span className="ml-auto text-gray-500">Hiển thị {ordersWithGPS.length}/{orders.length} thùng có GPS</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Thao Tác Nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid="link-orders">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="text-4xl mb-2">📦</div>
                <p className="font-medium">Quản Lý Thùng</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/customers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid="link-customers">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="text-4xl mb-2">👤</div>
                <p className="font-medium">Khách Hàng</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/shippers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid="link-shippers">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="text-4xl mb-2">🚚</div>
                <p className="font-medium">Shippers</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/shipper">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full bg-gradient-to-br from-orange-100 to-pink-100" data-testid="link-shipper-app">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="text-4xl mb-2">📱</div>
                <p className="font-medium">App Shipper</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

