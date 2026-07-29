import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders, setAuthToken, getNotifications, markNotificationRead, renewOrder } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CreateOrderDialog from '@/components/CreateOrderDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const statusLabels = {
  'WAITING_FOR_PICKUP': { label: '⏳ Chờ Lấy', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  'PICKED_UP': { label: '🚚 Đã Lấy', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  'IN_HUB': { label: '🏢 Ở Hub', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  'DELIVERED': { label: '✅ Đã Giao', color: 'bg-green-100 text-green-800 border-green-300' },
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDialog, setShowNotifDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [renewingOrder, setRenewingOrder] = useState(null);
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewLoading, setRenewLoading] = useState(false);

  useEffect(() => {
    loadOrders();
    loadNotifications();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await getMyOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data } = await getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
  };

  const handleReadNotification = async (notif) => {
    if (notif.is_read) return;
    try {
      await markNotificationRead(notif.id);
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    setAuthToken(null);
    navigate('/', { replace: true });
    logout();
  };

  if (!user) return null;

  const getDaysRemaining = (order) => {
    if (!order.storage_expiry_date) return null;
    const expiry = new Date(order.storage_expiry_date);
    const now = new Date();
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (order) => {
    const days = getDaysRemaining(order);
    if (days === null) return null;
    if (days <= 0) return { text: '❌ Đã hết hạn', color: 'bg-red-100 text-red-800 border-red-300' };
    if (days <= 3) return { text: `🔴 Còn ${days} ngày`, color: 'bg-red-100 text-red-700 border-red-300' };
    if (days <= 7) return { text: `🟡 Còn ${days} ngày`, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    if (days <= 10) return { text: `🟡 Còn ${days} ngày`, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    return { text: `📅 Còn ${days} ngày`, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  };

  const handleRenew = async () => {
    if (!renewingOrder) return;
    setRenewLoading(true);
    try {
      await renewOrder(renewingOrder.order_id, renewMonths);
      alert(`Đã gia hạn thêm ${renewMonths} tháng cho đơn ${renewingOrder.order_id}!`);
      setShowRenewDialog(false);
      setRenewingOrder(null);
      setRenewMonths(1);
      loadOrders();
    } catch (e) {
      alert(e.response?.data?.detail || 'Lỗi khi gia hạn');
    } finally {
      setRenewLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const query = searchQuery.toLowerCase();
    if (o.order_id.toLowerCase().includes(query)) return true;
    if (o.items && o.items.some(i => i.item_description.toLowerCase().includes(query))) return true;
    return false;
  });

  const activeOrders = filteredOrders.filter(o => o.status !== 'DELIVERED');
  const completedOrders = filteredOrders.filter(o => o.status === 'DELIVERED');

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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="relative" 
              onClick={() => setShowNotifDialog(true)}
            >
              🔔
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
              Đăng xuất
            </Button>
          </div>
        </div>

        {/* Create Order CTA */}
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">📦 Cần gửi đồ vào kho?</h2>
              <p className="text-white/90 text-sm mt-1">Đặt lịch shipper đến lấy hàng chỉ trong vài phút</p>
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

        {/* Search Bar */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm theo mã thùng, nội dung gửi..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Active Orders */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            🔄 Đơn đang xử lý ({activeOrders.length})
          </h2>
          {loading ? (
            <p className="text-gray-500 text-center py-6">Đang tải...</p>
          ) : activeOrders.length === 0 ? (
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
              {activeOrders.map((order) => (
                <Card key={order.order_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-base font-mono">{order.order_id}</CardTitle>
                      <Badge className={statusLabels[order.status]?.color}>
                        {statusLabels[order.status]?.label || order.status}
                      </Badge>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-gray-700">Gồm {order.items.length} thùng hàng:</p>
                        <div className="flex flex-wrap gap-1">
                          {order.items.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">
                              Size {item.size}: {item.item_description}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {/* Expiry Badge */}
                    {getExpiryBadge(order) && (
                      <div className="flex items-center justify-between">
                        <Badge className={getExpiryBadge(order).color}>
                          {getExpiryBadge(order).text}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                          onClick={() => {
                            setRenewingOrder(order);
                            setRenewMonths(1);
                            setShowRenewDialog(true);
                          }}
                        >
                          🔄 Gia hạn
                        </Button>
                      </div>
                    )}
                    {order.pickup_time && (
                      <p className="text-gray-600">
                        🕐 Hẹn: <strong>{new Date(order.pickup_time).toLocaleString('vi-VN')}</strong>
                      </p>
                    )}
                    {order.pickup_address && (
                      <p className="text-gray-600">📍 {order.pickup_address}</p>
                    )}
                    {order.delivery_method && (
                      <div className="bg-indigo-50 rounded p-2 mt-1 space-y-0.5">
                        <p className="text-indigo-800 font-medium">
                          🚚 {order.delivery_method === 'self_pickup' ? 'Tự mang đến trạm' : 'Shipper giao tận nơi'}
                        </p>
                        {order.shipping_fee != null && (
                          <p className="text-indigo-700">
                            Phí ship: <strong>{order.shipping_fee === 0 ? 'Miễn phí' : `${order.shipping_fee.toLocaleString()} VND`}</strong>
                            {order.rental_months && order.rental_months >= 3 && (
                              <span className="ml-1 text-green-600">(Ưu đãi thuê {order.rental_months} tháng)</span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-gray-500">
                      Cập nhật: {new Date(order.last_updated).toLocaleString('vi-VN')}
                    </p>
                    <Link to={`/track/${order.order_id}`}>
                      <Button size="sm" variant="outline" className="w-full mt-1" data-testid={`track-${order.order_id}`}>
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
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              ✅ Đơn đã hoàn thành ({completedOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedOrders.map((order) => (
                <Card key={order.order_id} className="opacity-80">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-mono">{order.order_id}</CardTitle>
                      <Badge className={statusLabels[order.status]?.color}>
                        {statusLabels[order.status]?.label}
                      </Badge>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-gray-700">Gồm {order.items.length} thùng hàng</p>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Link to={`/track/${order.order_id}`}>
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

      <CreateOrderDialog
        open={showCreateOrder}
        onOpenChange={setShowCreateOrder}
        defaultAddress={user.default_pickup_address}
        onCreated={() => loadOrders()}
      />

      {/* Notifications Dialog */}
      <Dialog open={showNotifDialog} onOpenChange={setShowNotifDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔔 Thông báo của bạn</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Bạn chưa có thông báo nào.</p>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 rounded-lg border ${notif.is_read ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100'}`}
                  onClick={() => handleReadNotification(notif)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-semibold ${notif.is_read ? 'text-gray-700' : 'text-blue-900'}`}>
                      {notif.title}
                    </h4>
                    {!notif.is_read && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1"></span>}
                  </div>
                  <p className={`text-sm ${notif.is_read ? 'text-gray-500' : 'text-blue-800'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Renewal Dialog */}
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>🔄 Gia hạn đơn hàng</DialogTitle>
          </DialogHeader>
          {renewingOrder && (
            <div className="space-y-4 mt-3">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="font-mono font-bold">{renewingOrder.order_id}</p>
                {renewingOrder.storage_expiry_date && (
                  <p className="text-sm text-gray-600 mt-1">
                    Hạn hiện tại: {new Date(renewingOrder.storage_expiry_date).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gia hạn thêm (tháng)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        renewMonths === m 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setRenewMonths(m)}
                    >
                      {m} th
                    </button>
                  ))}
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleRenew} 
                disabled={renewLoading}
              >
                {renewLoading ? 'Đang xử lý...' : `✅ Xác nhận gia hạn ${renewMonths} tháng`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDashboard;
