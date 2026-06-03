import React, { useState, useEffect } from 'react';
import { getShippers, scanQR } from '@/services/api';
import QRScanner from '@/components/QRScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ShipperApp = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBoxId, setScannedBoxId] = useState('');
  const [shippers, setShippers] = useState([]);
  const [selectedShipper, setSelectedShipper] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadShippers();
  }, []);

  const loadShippers = async () => {
    try {
      const response = await getShippers();
      setShippers(response.data);
    } catch (error) {
      console.error('Error loading shippers:', error);
    }
  };

  const handleScan = (boxId) => {
    setScannedBoxId(boxId);
    setIsScanning(false);
    setAlert({ type: 'success', message: `Đã quét thành công: ${boxId}` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scannedBoxId || !selectedShipper || !status) {
      setAlert({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin!' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await scanQR({
        box_id: scannedBoxId,
        shipper_id: selectedShipper,
        status: status,
        notes: notes
      });

      setAlert({ 
        type: 'success', 
        message: response.data.message || 'Cập nhật trạng thái thành công!' 
      });

      // Reset form
      setScannedBoxId('');
      setStatus('');
      setNotes('');
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
    setStatus('');
    setNotes('');
    setAlert(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" data-testid="shipper-app">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📦 Shipper App</h1>
          <p className="text-gray-600">Quét mã QR và cập nhật trạng thái thùng hàng</p>
        </div>

        {alert && (
          <Alert className={alert.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'} data-testid="alert-message">
            <AlertDescription className={alert.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        {!scannedBoxId && (
          <QRScanner 
            onScan={handleScan} 
            isScanning={isScanning}
            setIsScanning={setIsScanning}
          />
        )}

        {scannedBoxId && (
          <Card data-testid="update-status-form">
            <CardHeader>
              <CardTitle>Cập Nhật Trạng Thái</CardTitle>
              <CardDescription>Thùng hàng: <strong>{scannedBoxId}</strong></CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shipper">Chọn Shipper</Label>
                  <Select value={selectedShipper} onValueChange={setSelectedShipper} data-testid="shipper-select">
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn shipper..." />
                    </SelectTrigger>
                    <SelectContent>
                      {shippers.map((shipper) => (
                        <SelectItem key={shipper.id} value={shipper.id}>
                          {shipper.name} - {shipper.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Trạng Thái Mới</Label>
                  <Select value={status} onValueChange={setStatus} data-testid="status-select">
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PICKED_UP">🚚 Đã Lấy Hàng (PICKED_UP)</SelectItem>
                      <SelectItem value="IN_HUB">🏢 Đang Ở Hub (IN_HUB)</SelectItem>
                      <SelectItem value="DELIVERED">✅ Đã Giao (DELIVERED)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi Chú (Tùy Chọn)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Nhập ghi chú về lần cập nhật này..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    data-testid="notes-input"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={isSubmitting}
                    data-testid="submit-update-button"
                  >
                    {isSubmitting ? 'Đang xử lý...' : '✓ Xác Nhận Cập Nhật'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleReset}
                    data-testid="reset-button"
                  >
                    ↺ Quét Lại
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShipperApp;
