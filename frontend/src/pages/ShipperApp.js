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
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error

  useEffect(() => {
    loadShippers();
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setLocationStatus('success');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
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
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {locationStatus === 'loading' && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  📍 Đang lấy vị trí...
                </Badge>
              )}
              {locationStatus === 'success' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300" data-testid="gps-status">
                  📍 GPS sẵn sàng ({location?.accuracy?.toFixed(0)}m)
                </Badge>
              )}
              {locationStatus === 'error' && (
                <>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                    📍 Chưa có GPS
                  </Badge>
                  <Button size="sm" variant="outline" onClick={requestLocation} className="h-7 text-xs">
                    🔄 Thử lại
                  </Button>
                </>
              )}
              {locationStatus === 'idle' && (
                <Button size="sm" variant="outline" onClick={requestLocation} className="h-7 text-xs">
                  📍 Bật GPS
                </Button>
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
