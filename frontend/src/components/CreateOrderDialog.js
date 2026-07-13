import React, { useState } from 'react';
import { createMyOrder } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PROHIBITED_ITEMS = [
  'Vũ khí, vật liệu nổ',
  'Chất ma túy, tiền chất',
  'Hàng hóa nguy hiểm, dễ cháy nổ',
  'Hàng lậu, hàng giả',
  'Động vật, thực phẩm tươi sống, hàng dễ phân huỷ',
];

const CreateOrderDialog = ({ open, onOpenChange, defaultAddress, onCreated }) => {
  const [form, setForm] = useState({
    item_description: '',
    pickup_date: '',
    pickup_time: '',
    pickup_address: '',
    notes: '',
  });
  const [acceptNoProhibited, setAcceptNoProhibited] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successBox, setSuccessBox] = useState(null);

  const resetForm = () => {
    setForm({ item_description: '', pickup_date: '', pickup_time: '', pickup_address: '', notes: '' });
    setAcceptNoProhibited(false);
    setError('');
    setSuccessBox(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.item_description.trim()) {
      setError('Vui lòng mô tả hàng hóa');
      return;
    }
    if (!form.pickup_date || !form.pickup_time) {
      setError('Vui lòng chọn ngày và giờ lấy hàng');
      return;
    }
    if (!acceptNoProhibited) {
      setError('Bạn phải xác nhận không gửi hàng cấm');
      return;
    }

    const pickupISO = `${form.pickup_date}T${form.pickup_time}:00`;

    setSubmitting(true);
    try {
      const { data } = await createMyOrder({
        item_description: form.item_description,
        pickup_time: pickupISO,
        pickup_address: form.pickup_address.trim() || undefined,
        notes: form.notes,
        accept_no_prohibited: true,
      });
      setSuccessBox(data.box);
      if (onCreated) onCreated(data.box);
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === 'string' ? d : (Array.isArray(d) ? d.map(x => x?.msg).join(', ') : 'Có lỗi xảy ra'));
    } finally {
      setSubmitting(false);
    }
  };

  // Min date = today
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📦 Tạo Đơn Lấy Hàng Mới</DialogTitle>
          <DialogDescription>Điền thông tin để shipper đến lấy hàng của bạn</DialogDescription>
        </DialogHeader>

        {successBox ? (
          <div className="space-y-4 py-2">
            <Alert className="border-green-500 bg-green-50">
              <AlertDescription className="text-green-800">
                ✅ <strong>Đã tạo đơn thành công!</strong>
              </AlertDescription>
            </Alert>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p><span className="text-gray-500">Mã đơn:</span> <span className="font-mono font-bold text-lg">{successBox.box_id}</span></p>
              <p><span className="text-gray-500">Hàng hóa:</span> {successBox.item_description}</p>
              <p><span className="text-gray-500">Lịch hẹn:</span> {new Date(successBox.pickup_time).toLocaleString('vi-VN')}</p>
              <p><span className="text-gray-500">Địa chỉ:</span> 📍 {successBox.pickup_address}</p>
            </div>
            {successBox.qr_code_data && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Mã QR đơn hàng:</p>
                <img src={successBox.qr_code_data} alt="QR" className="mx-auto w-40 h-40 border rounded" />
                <p className="text-xs text-gray-500 mt-2">Shipper sẽ quét mã này khi đến lấy hàng</p>
              </div>
            )}
            <Button onClick={handleClose} className="w-full" data-testid="close-success-dialog">
              ✓ Đóng
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <Alert className="border-red-500 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <Label htmlFor="item_description">Mô tả hàng hóa *</Label>
              <Textarea
                id="item_description"
                placeholder="VD: 2 thùng sách, 1 laptop cũ, đồ dùng cá nhân..."
                value={form.item_description}
                onChange={(e) => setForm({ ...form, item_description: e.target.value })}
                rows={3}
                data-testid="order-item-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pickup_date">Ngày lấy hàng *</Label>
                <Input
                  id="pickup_date"
                  type="date"
                  min={today}
                  value={form.pickup_date}
                  onChange={(e) => setForm({ ...form, pickup_date: e.target.value })}
                  data-testid="order-pickup-date"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pickup_time">Giờ *</Label>
                <Input
                  id="pickup_time"
                  type="time"
                  value={form.pickup_time}
                  onChange={(e) => setForm({ ...form, pickup_time: e.target.value })}
                  data-testid="order-pickup-time"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pickup_address">Địa chỉ lấy hàng</Label>
              <Input
                id="pickup_address"
                placeholder={defaultAddress || 'Nhập địa chỉ lấy hàng'}
                value={form.pickup_address}
                onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                data-testid="order-pickup-address"
              />
              {defaultAddress && (
                <p className="text-xs text-gray-500">💡 Để trống sẽ dùng địa chỉ mặc định: {defaultAddress}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="notes"
                placeholder="VD: Gọi trước khi đến, tầng 3..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                data-testid="order-notes"
              />
            </div>

            {/* Prohibited items reminder */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-xs space-y-2">
              <p className="font-bold text-red-900">⛔ Các mặt hàng CẤM gửi:</p>
              <ul className="list-disc list-inside space-y-0.5 text-red-800">
                {PROHIBITED_ITEMS.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="text-red-700 mt-2 italic">
                Vi phạm sẽ bị phong toả tài sản, tịch thu cọc và bàn giao cơ quan chức năng.
              </p>
            </div>

            <div className={`p-3 rounded-lg border-2 ${acceptNoProhibited ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptNoProhibited}
                  onChange={(e) => setAcceptNoProhibited(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-300"
                  data-testid="order-accept-no-prohibited"
                />
                <span className="text-sm text-gray-800">
                  ✅ Tôi cam kết <strong>KHÔNG gửi hàng cấm</strong> và chịu trách nhiệm pháp lý về nội dung hàng hoá đã khai báo.
                </span>
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Hủy</Button>
              <Button type="submit" disabled={submitting || !acceptNoProhibited} data-testid="submit-order">
                {submitting ? 'Đang tạo...' : '✓ Tạo Đơn'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderDialog;
