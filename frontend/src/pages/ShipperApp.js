import React, { useState, useEffect } from 'react';
import { getShippers, scanQR, getBox } from '@/services/api';
import QRScanner from '@/components/QRScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBoxId, setScannedBoxId] = useState('');
  const [boxInfo, setBoxInfo] = useState(null);
  const [shippers, setShippers] = useState([]);
  const [selectedShipper, setSelectedShipper] = useState(() => localStorage.getItem('selectedShipper') || '');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error, denied
  const [locationError, setLocationError] = useState('');
  const [showGpsHelp, setShowGpsHelp] = useState(false);

  useEffect(() => {
    loadShippers();
    // Check permission state without prompting
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Trình duyệt không hỗ trợ GPS');
      return;
    }
    // Try Permissions API to check state
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'granted') {
          // Already granted, can request silently
          requestLocation();
        } else if (result.state === 'denied') {
          setLocationStatus('denied');
        }
        // 'prompt' state -> show button, user must click to grant
      } catch (e) {
        // Permissions API not available, just leave idle
      }
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
      console.warn('Geolocation error:', err);
      // err.code 1 = PERMISSION_DENIED
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

    // Try with high accuracy first, fallback to low if fails
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        if (err.code === 3) {
          // Timeout - try again with lower accuracy
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

  useEffect(() => {
    if (selectedShipper) {
      localStorage.setItem('selectedShipper', selectedShipper);
    }
  }, [selectedShipper]);

  const loadShippers = async () => {
    try {
      const response = await getShippers();
      setShippers(response.data);
    } catch (error) {
      console.error('Error loading shippers:', error);
    }
  };

  const handleScan = async (boxId) => {
    setScannedBoxId(boxId);
    setIsScanning(false);
    setAlert(null);
    
    // Try to load box info
    try {
      const response = await getBox(boxId);
      setBoxInfo(response.data);
      setAlert({ type: 'success', message: `✓ Đã quét thành công thùng: ${boxId}` });
    } catch (error) {
      setBoxInfo(null);
      setAlert({ type: 'error', message: `⚠️ Không tìm thấy thùng "${boxId}" trong hệ thống. Vui lòng kiểm tra lại!` });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scannedBoxId || !selectedShipper || !status) {
      setAlert({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin!' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Re-get location at submit time (more accurate)
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
        } catch (e) {
          // Use previously captured location if available
        }
      }

      const response = await scanQR({
        box_id: scannedBoxId,
        shipper_id: selectedShipper,
        status: status,
        notes: notes,
        latitude: currentLocation?.lat,
        longitude: currentLocation?.lng
      });

      setAlert({ 
        type: 'success', 
        message: response.data.message || 'Cập nhật trạng thái thành công!' 
      });

      // Reset form (keep shipper selection)
      setTimeout(() => {
        setScannedBoxId('');
        setBoxInfo(null);
        setStatus('');
        setNotes('');
        setAlert(null);
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
    setScannedBoxId('');
    setBoxInfo(null);
    setStatus('');
    setNotes('');
    setAlert(null);
  };

  const selectedShipperInfo = shippers.find(s => s.id === selectedShipper);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 md:p-4" data-testid="shipper-app">
      <div className="max-w-2xl mx-auto space-y-4 py-4 md:py-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">📦 Shipper App</h1>
          <p className="text-sm md:text-base text-gray-600">Quét QR & cập nhật trạng thái</p>
        </div>

        {/* Shipper Selection (Always Visible) */}
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4 pb-4">
            <Label className="text-sm font-medium mb-2 block">👤 Shipper hiện tại</Label>
            <Select value={selectedShipper} onValueChange={setSelectedShipper}>
              <SelectTrigger data-testid="shipper-select" className="h-12 text-base bg-white">
                <SelectValue placeholder="Chọn tên của bạn..." />
              </SelectTrigger>
              <SelectContent>
                {shippers.map((shipper) => (
                  <SelectItem key={shipper.id} value={shipper.id}>
                    {shipper.name} - {shipper.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedShipperInfo && (
              <p className="text-xs text-blue-700 mt-1">
                ✓ Đã lưu, lần sau không cần chọn lại
              </p>
            )}

            {/* GPS Status */}
            <div className="mt-3 space-y-2">
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

        {/* QR Scanner (when no box scanned) */}
        {!scannedBoxId && (
          <QRScanner 
            onScan={handleScan} 
            isScanning={isScanning}
            setIsScanning={setIsScanning}
          />
        )}

        {/* Update Status Form (when box scanned) */}
        {scannedBoxId && (
          <Card data-testid="update-status-form" className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg">📦 Cập Nhật Trạng Thái</CardTitle>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-sm text-gray-600">Mã thùng:</span>
                <Badge variant="outline" className="font-mono text-base font-bold">{scannedBoxId}</Badge>
              </div>
              {boxInfo && (
                <div className="text-sm text-gray-600 mt-1">
                  <p>👤 {boxInfo.customer_name}</p>
                  <p className="mt-1">Trạng thái hiện tại: <strong>{statusLabels[boxInfo.status] || boxInfo.status}</strong></p>
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
                    disabled={isSubmitting || !boxInfo}
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
      </div>
    </div>
  );
};

export default ShipperApp;
