import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyBoxes } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    await logout();
    navigate('/');
  };

  if (!user) return null;

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

        {/* My Boxes */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">📦 Đơn hàng của tôi</h2>
          {loading ? (
            <p className="text-gray-500 text-center py-6">Đang tải...</p>
          ) : boxes.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <div className="text-5xl mb-2">📭</div>
                <p>Bạn chưa có đơn hàng nào</p>
                <p className="text-xs mt-1">Liên hệ admin để tạo đơn mới</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {boxes.map((box) => (
                <Card key={box.box_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-mono">{box.box_id}</CardTitle>
                      <Badge className={statusLabels[box.status]?.color}>
                        {statusLabels[box.status]?.label || box.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Cập nhật: {new Date(box.last_updated).toLocaleString('vi-VN')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/track/${box.box_id}`}>
                      <Button size="sm" variant="outline" className="w-full" data-testid={`track-${box.box_id}`}>
                        🗺️ Xem chi tiết & bản đồ
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-500 pt-4">
          <Link to="/terms" className="hover:underline">Điều khoản dịch vụ</Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
