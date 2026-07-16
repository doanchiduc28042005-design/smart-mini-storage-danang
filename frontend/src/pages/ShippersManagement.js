import React, { useState, useEffect } from 'react';
import { getShippers, approveShipper } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ShippersManagement = () => {
  const [shippers, setShippers] = useState([]);
  const [selectedShipper, setSelectedShipper] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

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

  const handleApprove = async () => {
    if (!selectedShipper) return;
    setIsApproving(true);
    try {
      await approveShipper(selectedShipper.id);
      alert('Đã duyệt thành công! Email đã được gửi cho Shipper.');
      setShowReview(false);
      loadShippers();
    } catch (error) {
      alert(error.response?.data?.detail || 'Lỗi khi duyệt hồ sơ');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="shippers-management">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🚚 Quản Lý Shippers</h1>
          <p className="text-gray-600 mt-1">Tổng số: {shippers.length} shipper</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shippers.map((shipper) => (
          <Card key={shipper.id} className="hover:shadow-lg transition-shadow border-2" style={{ borderColor: shipper.registration_status === 'pending' ? '#f59e0b' : '#e5e7eb' }}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{shipper.name}</CardTitle>
                  <CardDescription className="font-semibold text-blue-600 mt-1">
                    {shipper.shipper_code || 'Chưa cấp mã'}
                  </CardDescription>
                </div>
                {shipper.registration_status === 'pending' ? (
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chờ Duyệt</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Đã Duyệt</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>📞 {shipper.phone}</p>
                <p>✉️ {shipper.email}</p>
                <p>🆔 CCCD: {shipper.cccd}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => {
                  setSelectedShipper(shipper);
                  setShowReview(true);
                }}>
                  Xem Chi Tiết
                </Button>
                {shipper.registration_status === 'pending' && (
                  <Button className="w-full bg-blue-600" onClick={() => {
                    setSelectedShipper(shipper);
                    setShowReview(true);
                  }}>
                    Duyệt Ngay
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {shippers.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Chưa có hồ sơ shipper nào.
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi Tiết Hồ Sơ Shipper</DialogTitle>
          </DialogHeader>
          
          {selectedShipper && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Họ và Tên</span>
                  <p className="font-medium text-lg">{selectedShipper.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Trạng Thái</span>
                  <p className="font-medium">
                    {selectedShipper.registration_status === 'pending' ? '⏳ Chờ Duyệt' : '✅ Đã Duyệt'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Số Điện Thoại</span>
                  <p className="font-medium">{selectedShipper.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email</span>
                  <p className="font-medium">{selectedShipper.email}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Căn Cước Công Dân</span>
                  <p className="font-medium">{selectedShipper.cccd}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-gray-500 text-sm">Giấy phép lái xe:</span>
                {selectedShipper.license_photo ? (
                  <img src={selectedShipper.license_photo} alt="GPLX" className="w-full rounded-lg border object-cover max-h-48" />
                ) : (
                  <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">Không có ảnh</div>
                )}
              </div>

              {selectedShipper.registration_status === 'pending' && (
                <div className="pt-4 border-t">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg" onClick={handleApprove} disabled={isApproving}>
                    {isApproving ? 'Đang gửi Email...' : 'Phê Duyệt & Cấp Mã (Gửi Email)'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShippersManagement;

