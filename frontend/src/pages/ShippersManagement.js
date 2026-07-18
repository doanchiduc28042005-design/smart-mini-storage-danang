import React, { useState, useEffect } from 'react';
import { getShippers, approveShipper, rejectShipper } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const ShippersManagement = () => {
  const [shippers, setShippers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipper, setSelectedShipper] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

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

  const handleReject = async () => {
    if (!selectedShipper || !rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối!');
      return;
    }
    setIsRejecting(true);
    try {
      await rejectShipper(selectedShipper.id, { reason: rejectReason });
      alert('Đã từ chối hồ sơ và gửi email thông báo.');
      setShowRejectDialog(false);
      setShowReview(false);
      setRejectReason('');
      loadShippers();
    } catch (error) {
      alert(error.response?.data?.detail || 'Lỗi khi từ chối hồ sơ');
    } finally {
      setIsRejecting(false);
    }
  };

  const getBorderColor = (status) => {
    if (status === 'pending') return '#f59e0b'; // orange
    if (status === 'rejected') return '#ef4444'; // red
    return '#e5e7eb'; // default gray
  };

  return (
    <div className="p-6 space-y-6" data-testid="shippers-management">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🚚 Quản Lý Shippers</h1>
          <p className="text-gray-600 mt-1">Tổng số: {shippers.length} shipper</p>
        </div>
        <div className="flex-1 max-w-sm flex justify-end">
          <input 
            type="text" 
            placeholder="Tìm theo Tên, SĐT, hoặc Email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shippers
          .filter(shipper => 
            shipper.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            shipper.phone?.includes(searchTerm) || 
            shipper.email?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((shipper) => (
          <Card key={shipper.id} className="hover:shadow-lg transition-shadow border-2" style={{ borderColor: getBorderColor(shipper.registration_status) }}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{shipper.name}</CardTitle>
                  <CardDescription className="font-semibold text-blue-600 mt-1">
                    {shipper.shipper_code || (shipper.registration_status === 'rejected' ? 'Bị Từ Chối' : 'Chưa cấp mã')}
                  </CardDescription>
                </div>
                {shipper.registration_status === 'pending' ? (
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chờ Duyệt</Badge>
                ) : shipper.registration_status === 'rejected' ? (
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Bị Từ Chối</Badge>
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
                {shipper.rejection_reason && (
                  <p className="text-xs text-red-600 italic">Lý do từ chối: {shipper.rejection_reason}</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => {
                  setSelectedShipper(shipper);
                  setShowReview(true);
                }}>
                  Chi Tiết
                </Button>
                {shipper.registration_status === 'pending' && (
                  <>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => {
                      setSelectedShipper(shipper);
                      setShowReview(true);
                    }}>
                      Duyệt
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={() => {
                      setSelectedShipper(shipper);
                      setShowRejectDialog(true);
                    }}>
                      Từ Chối
                    </Button>
                  </>
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
                  <p className="font-medium text-base">
                    {selectedShipper.registration_status === 'pending' ? '⏳ Chờ Duyệt' : 
                     selectedShipper.registration_status === 'rejected' ? '❌ Bị Từ Chối' : '✅ Đã Duyệt'}
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
                {selectedShipper.rejection_reason && (
                  <div className="col-span-2 bg-red-50 p-2 rounded text-red-700 text-xs border border-red-150">
                    <span className="font-semibold block mb-0.5">Lý do từ chối:</span>
                    {selectedShipper.rejection_reason}
                  </div>
                )}
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
                <div className="pt-4 border-t flex gap-2">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg" onClick={handleApprove} disabled={isApproving}>
                    {isApproving ? 'Đang gửi...' : 'Duyệt & Gửi Mã'}
                  </Button>
                  <Button variant="destructive" className="w-full" size="lg" onClick={() => setShowRejectDialog(true)}>
                    Từ Chối
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Từ Chối Hồ Sơ Shipper</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Nhập lý do từ chối hồ sơ của **{selectedShipper?.name}**. Lý do này sẽ được đính kèm trong email thông báo gửi cho Shipper.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Lý do từ chối *</label>
              <Textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Ảnh giấy phép lái xe bị mờ, không rõ thông tin."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="w-full" onClick={() => setShowRejectDialog(false)} disabled={isRejecting}>
              Thoát
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleReject} disabled={isRejecting || !rejectReason.trim()}>
              {isRejecting ? 'Đang từ chối...' : 'Xác Nhận Từ Chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShippersManagement;

