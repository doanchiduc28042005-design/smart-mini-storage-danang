import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { scanQR, getOrder, getShipperOrders } from '@/services/api';
import QRScanner from '@/components/QRScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const statusLabels = {
  'WAITING_FOR_PICKUP': '⏳ Chờ Lấy',
  'PICKED_UP': '🚚 Đã Lấy',
  'IN_HUB': '🏢 Ở Hub',
  'DELIVERED': '✅ Đã Giao'
};

const ShipperApp = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'myorders'
  const [myorders, setMyorders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingorders, setLoadingorders] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scannedorderId, setScannedorderId] = useState('');
  const [orderInfo, setorderInfo] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationError, setLocationError] = useState('');
  const [showGpsHelp, setShowGpsHelp] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'shipper')) {
      navigate('/shipper/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && user.role === 'shipper') {
      checkLocationPermission();
      fetchMyorders();
    }
  }, [user]);

  const fetchMyorders = async () => {
    try {
      setLoadingorders(true);
      const res = await getShipperOrders(user.id);
      setMyorders(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingorders(false);
    }
  };

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Trình duyệt không hỗ trợ GPS');
      return;
    }
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'granted') {
          requestLocation();
        } else if (result.state === 'denied') {
          setLocationStatus('denied');
        }
      } catch (e) {}
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Trình duyệt không hỗ trợ GPS');
      return;
    }
    setLocationStatus('loading');
    setLocationError('');

    const onSuccess = (pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      });
      setLocationStatus('success');
    };

    const onError = (err) => {
      if (err.code === 1) {
        setLocationStatus('denied');
        setLocationError('Bạn đã từ chối quyền GPS. Vui lòng mở Cài đặt để bật lại.');
      } else if (err.code === 2) {
        setLocationStatus('error');
        setLocationError('Không xác định được vị trí. Hãy ra ngoài trời hoặc gần cửa sổ.');
      } else if (err.code === 3) {
        setLocationStatus('error');
        setLocationError('Lấy vị trí quá lâu. Vui lòng thử lại.');
      } else {
        setLocationStatus('error');
        setLocationError(err.message || 'Lỗi không xác định');
      }
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        if (err.code === 3) {
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            onError,
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
          );
        } else {
          onError(err);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleScan = async (orderId) => {
    setScannedorderId(orderId);
    setIsScanning(false);
    setAlert(null);
    
    try {
      const response = await getOrder(orderId);
      setorderInfo(response.data);
      setAlert({ type: 'success', message: `✓ Đã quét thành công thùng: ${orderId}` });
    } catch (error) {
      setorderInfo(null);
      setAlert({ type: 'error', message: `⚠️ Không tìm thấy thùng "${orderId}" trong hệ thống. Vui lòng kiểm tra lại!` });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scannedorderId || !status) {
      setAlert({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin!' });
      return;
    }

    setIsSubmitting(true);

    try {
      let currentLocation = location;
      if (navigator.geolocation && locationStatus !== 'error') {
        try {
          currentLocation = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              reject,
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
          });
          setLocation(currentLocation);
        } catch (e) {}
      }

      const response = await scanQR({
        order_id: scannedorderId,
        shipper_id: user.id,
        status: status,
        notes: notes,
        latitude: currentLocation?.lat,
        longitude: currentLocation?.lng
      });

      setAlert({ 
        type: 'success', 
        message: response.data.message || 'Cập nhật trạng thái thành công!' 
      });

      setTimeout(() => {
        handleReset();
      }, 2000);
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại!' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setScannedorderId('');
    setorderInfo(null);
    setStatus('');
    setNotes('');
    setAlert(null);
  };

  if (authLoading || !user || user.role !== 'shipper') {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 md:p-4" data-testid="shipper-app">
      <div className="max-w-2xl mx-auto space-y-4 py-4 md:py-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">📦 Shipper App</h1>
            <p className="text-sm text-gray-600">Xin chào, <strong>{user.name}</strong> ({user.shipper_code})</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/shipper/login'); }}>
            Đăng Xuất
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'scan' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('scan')}
          >
            🔍 Quét Mã / Cập Nhật
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'myorders' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('myorders')}
          >
            📦 Thùng Của Tôi ({myorders.length})
          </button>
        </div>

        {activeTab === 'scan' ? (
          <>
            {/* GPS Card */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4 pb-4">
            {/* GPS Status */}
            <div className="space-y-2">
              {locationStatus === 'idle' && (
                <Button 
                  type="button"
                  onClick={requestLocation} 
                  className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  data-testid="enable-gps-button"
                >
                  📍 Bật GPS Vị Trí
                </Button>
              )}

              {locationStatus === 'loading' && (
                <div className="flex items-center justify-center gap-2 py-2 bg-yellow-50 border border-yellow-300 rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                  <span className="text-sm text-yellow-800">Đang lấy vị trí GPS...</span>
                </div>
              )}

              {locationStatus === 'success' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-300 rounded-md" data-testid="gps-status">
                  <span className="text-green-700 text-sm">📍 GPS sẵn sàng</span>
                  <span className="text-xs text-green-600">(±{location?.accuracy?.toFixed(0)}m)</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={requestLocation} 
                    className="ml-auto h-6 text-xs"
                  >
                    🔄 Cập nhật
                  </Button>
                </div>
              )}

              {locationStatus === 'error' && (
                <div className="px-3 py-2 bg-red-50 border border-red-300 rounded-md">
                  <p className="text-sm text-red-800">⚠️ {locationError}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={requestLocation} 
                    className="mt-2 h-7 text-xs"
                  >
                    🔄 Thử Lại
                  </Button>
                </div>
              )}

              {locationStatus === 'denied' && (
                <div className="px-3 py-3 bg-orange-50 border-2 border-orange-300 rounded-md space-y-2">
                  <p className="text-sm font-semibold text-orange-900">
                    🚫 Quyền GPS đã bị từ chối
                  </p>
                  <p className="text-xs text-orange-800">
                    Trình duyệt không cho phép xin lại quyền. Bạn cần bật thủ công trong cài đặt:
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowGpsHelp(!showGpsHelp)}
                    className="h-7 text-xs"
                  >
                    {showGpsHelp ? '▲ Ẩn hướng dẫn' : '▼ Xem hướng dẫn bật GPS'}
                  </Button>
                  {showGpsHelp && (
                    <div className="bg-white p-3 rounded border border-orange-200 text-xs space-y-2">
                      <div>
                        <p className="font-semibold text-orange-900">📱 iPhone (Safari):</p>
                        <ol className="ml-4 list-decimal space-y-1 text-gray-700">
                          <li>Mở <strong>Cài đặt</strong> → <strong>Safari</strong></li>
                          <li>Cuộn xuống → <strong>Vị trí</strong> → chọn <strong>Hỏi</strong> hoặc <strong>Cho phép</strong></li>
                          <li>Quay lại Safari → Tải lại trang</li>
                        </ol>
                      </div>
                      <div>
                        <p className="font-semibold text-orange-900">📱 Android (Chrome):</p>
                        <ol className="ml-4 list-decimal space-y-1 text-gray-700">
                          <li>Nhấn biểu tượng <strong>🔒/ⓘ</strong> bên trái thanh địa chỉ</li>
                          <li>Chọn <strong>Quyền</strong> → <strong>Vị trí</strong> → <strong>Cho phép</strong></li>
                          <li>Tải lại trang</li>
                        </ol>
                      </div>
                      <div>
                        <p className="font-semibold text-orange-900">💬 Zalo Browser:</p>
                        <p className="text-gray-700 ml-4">Zalo browser thường <strong>không hỗ trợ GPS</strong>. Vui lòng nhấn <strong>"..."</strong> → <strong>Mở trong Safari/Chrome</strong></p>
                      </div>
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={requestLocation} 
                    className="h-7 text-xs"
                  >
                    🔄 Đã bật, thử lại
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alert Message */}
        {alert && (
          <Alert className={alert.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'} data-testid="alert-message">
            <AlertDescription className={`text-sm ${alert.type === 'error' ? 'text-red-800' : 'text-green-800'}`}>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        {/* QR Scanner (when no order scanned) */}
        {!scannedorderId && (
          <QRScanner 
            onScan={handleScan} 
            isScanning={isScanning}
            setIsScanning={setIsScanning}
          />
        )}

        {/* Update Status Form (when order scanned) */}
        {scannedorderId && (
          <Card data-testid="update-status-form" className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg">📦 Cập Nhật Trạng Thái</CardTitle>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-sm text-gray-600">Mã thùng:</span>
                <Badge variant="outline" className="font-mono text-base font-bold">{scannedorderId}</Badge>
              </div>
              {orderInfo && (
                <div className="text-sm text-gray-600 mt-1">
                  <p>👤 {orderInfo.customer_name}</p>
                  <p className="mt-1">Trạng thái hiện tại: <strong>{statusLabels[orderInfo.status] || orderInfo.status}</strong></p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">Trạng Thái Mới *</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger data-testid="status-select" className="h-12 text-base">
                      <SelectValue placeholder="Chọn trạng thái mới..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PICKED_UP" className="text-base py-3">🚚 Đã Lấy Hàng</SelectItem>
                      <SelectItem value="IN_HUB" className="text-base py-3">🏢 Đang Ở Hub</SelectItem>
                      <SelectItem value="DELIVERED" className="text-base py-3">✅ Đã Giao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi Chú (Tùy chọn)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ghi chú thêm..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    data-testid="notes-input"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                    disabled={isSubmitting || !orderInfo}
                    data-testid="submit-update-button"
                  >
                    {isSubmitting ? '⏳ Đang xử lý...' : '✓ Xác Nhận'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleReset}
                    className="h-12"
                    data-testid="reset-button"
                  >
                    ↻ Quét Lại
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Help info */}
        <div className="text-center text-xs text-gray-500 pt-4">
          <p>💡 Mẹo: Thêm trang này vào màn hình chính để dùng như app native</p>
        </div>
        </>
        ) : (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm mã thùng, nội dung..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loadingorders ? (
              <p className="text-center text-gray-500 py-6">Đang tải...</p>
            ) : myorders.length === 0 ? (
              <p className="text-center text-gray-500 py-6">Bạn chưa xử lý thùng hàng nào.</p>
            ) : (
              <div className="space-y-3">
                {myorders
                  .filter(o => {
                    const query = searchQuery.toLowerCase();
                    if (o.order_id.toLowerCase().includes(query)) return true;
                    if (o.items && o.items.some(i => i.item_description.toLowerCase().includes(query))) return true;
                    return false;
                  })
                  .map(order => (
                  <Card key={order.order_id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-mono">{order.order_id}</CardTitle>
                        <Badge className={statusLabels[order.status]?.color || ''}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p className="font-semibold mb-1">Gồm {order.items.length} thùng hàng:</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {order.items.map((item, idx) => (
                              <li key={idx}>Size {item.size}: {item.item_description}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 flex gap-2">
                      <Button size="sm" variant="outline" className="w-full" onClick={() => {
                        setScannedorderId(order.order_id);
                        setorderInfo(order);
                        setActiveTab('scan');
                      }}>Cập nhật trạng thái</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipperApp;

