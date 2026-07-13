import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyBoxes, setAuthToken } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CreateOrderDialog from '@/components/CreateOrderDialog';

const statusLabels = {
  'WAITING_FOR_PICKUP': { label: '⏳ Chờ Lấy', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  'PICKED_UP': { label: '🚚 Đã Lấy', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  'IN_HUB': { label: '🏢 Ở Hub', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  'DELIVERED': { label: '✅ Đã Giao', color: 'bg-green-100 text-green-800 border-green-300' },
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  useEffect(() => {
    loadBoxes();
  }, []);

  const loadBoxes = async () => {
    try {
      const { data } = await getMyBoxes();
      setBoxes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthToken(null);
    navigate('/', { replace: true });
    logout();
  };

  if (!user) return null;

  const activeBoxes = boxes.filter(b => b.status !== 'DELIVERED');
  const completedBoxes = boxes.filter(b => b.status === 'DELIVERED');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4" data-testid="customer-dashboard">
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <p className="text-sm text-gray-500">Xin chào 👋</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              📧 {user.email} • 📞 {user.phone}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
            Đăng xuất
          </Button>
        </div>

        {/* Create Order CTA */}
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">📦 Cần gửi đồ vào kho?</h2>
              <p className="text-white/90 text-sm mt-1">Đặt lịch shipper đến lấy hàng chỉ trong 30 giây</p>
            </div>
            <Button
              onClick={() => setShowCreateOrder(true)}
              className="bg-white text-indigo-600 hover:bg-indigo-50 h-12 px-6 font-semibold shadow-lg"
              data-testid="create-order-button"
            >
              + Tạo Đơn Mới
            </Button>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">👤 Thông tin tài khoản</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Họ tên</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Số điện thoại</p>
                <p className="font-medium">{user.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Địa chỉ lấy hàng mặc định</p>
                <p className="font-medium">📍 {user.default_pickup_address || '(chưa thiết lập)'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            🔄 Đơn đang xử lý ({activeBoxes.length})
          </h2>
          {loading ? (
            <p className="text-gray-500 text-center py-6">Đang tải...</p>
          ) : activeBoxes.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <div className="text-5xl mb-2">📭</div>
                <p>Bạn chưa có đơn nào đang xử lý</p>
                <Button onClick={() => setShowCreateOrder(true)} className="mt-3" variant="outline">
                  + Tạo Đơn Đầu Tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeBoxes.map((box) => (
                <Card key={box.box_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-base font-mono">{box.box_id}</CardTitle>
                      <Badge className={statusLabels[box.status]?.color}>
                        {statusLabels[box.status]?.label || box.status}
                      </Badge>
                    </div>
                    {box.item_description && (
                      <CardDescription className="text-xs mt-1">
                        📦 {box.item_description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {box.pickup_time && (
                      <p className="text-gray-600">
                        🕐 Hẹn: <strong>{new Date(box.pickup_time).toLocaleString('vi-VN')}</strong>
                      </p>
                    )}
                    {box.pickup_address && (
                      <p className="text-gray-600">📍 {box.pickup_address}</p>
                    )}
                    <p className="text-gray-500">
                      Cập nhật: {new Date(box.last_updated).toLocaleString('vi-VN')}
                    </p>
                    <Link to={`/track/${box.box_id}`}>
                      <Button size="sm" variant="outline" className="w-full mt-1" data-testid={`track-${box.box_id}`}>
                        🗺️ Xem chi tiết & bản đồ
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Orders */}
        {completedBoxes.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              ✅ Đơn đã hoàn thành ({completedBoxes.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedBoxes.map((box) => (
                <Card key={box.box_id} className="opacity-80">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-mono">{box.box_id}</CardTitle>
                      <Badge className={statusLabels[box.status]?.color}>
                        {statusLabels[box.status]?.label}
                      </Badge>
                    </div>
                    {box.item_description && (
                      <CardDescription className="text-xs mt-1">
                        📦 {box.item_description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Link to={`/track/${box.box_id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        🗺️ Xem lại lộ trình
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-500 pt-4">
          <Link to="/terms" className="hover:underline">Điều khoản dịch vụ</Link>
        </div>
      </div>

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={showCreateOrder}
        onOpenChange={setShowCreateOrder}
        defaultAddress={user.default_pickup_address}
        onCreated={() => loadBoxes()}
      />
    </div>
  );
};

export default CustomerDashboard;
