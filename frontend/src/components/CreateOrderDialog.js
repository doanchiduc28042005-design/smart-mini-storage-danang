import React, { useState } from 'react';
import { createMyOrder } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PROHIBITED_ITEMS = [
  'Vũ khí, vật liệu nổ',
  'Chất ma túy, tiền chất',
  'Hàng hóa nguy hiểm, dễ cháy nổ',
  'Hàng lậu, hàng giả',
  'Động vật, thực phẩm tươi sống, hàng dễ phân huỷ',
];

const BOX_SIZES = {
  'S': {
    name: 'Size S (Thùng nhỏ)',
    dimensions: '45 x 35 x 30 cm (~47 lít)',
    price: 4000,
    priceMonth: 120000,
    capacity: 'Khoảng 15 - 20 cuốn sách, tài liệu, 3 - 4 đôi giày dép, hoặc đồ trang điểm, phụ kiện cá nhân nhỏ.'
  },
  'M': {
    name: 'Size M (Thùng tiêu chuẩn)',
    dimensions: '60 x 40 x 35 cm (~84 lít)',
    price: 6000,
    priceMonth: 180000,
    capacity: 'Khoảng 25 - 30 bộ quần áo mùa hè, hoặc 2 chiếc chăn mền bông dày, đồ gia dụng nhà bếp quy mô nhỏ.'
  },
  'L': {
    name: 'Size L (Thùng lớn)',
    dimensions: '70 x 50 x 45 cm (~157 lít)',
    price: 9000,
    priceMonth: 270000,
    capacity: 'Đóng vừa 1 vali du lịch cỡ lớn (size 28), hoặc các thiết bị điện tử như màn hình máy tính, loa gia đình, hàng hóa cồng kềnh.'
  }
};

const CreateOrderDialog = ({ open, onOpenChange, defaultAddress, onCreated }) => {
  const [boxes, setBoxes] = useState([
    { id: Date.now(), size: 'M', item_description: '', notes: '' }
  ]);
  const [form, setForm] = useState({
    pickup_date: '',
    pickup_time: '',
    pickup_address: '',
  });
  const [acceptNoProhibited, setAcceptNoProhibited] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successBoxes, setSuccessBoxes] = useState(null);

  const resetForm = () => {
    setBoxes([{ id: Date.now(), size: 'M', item_description: '', notes: '' }]);
    setForm({ pickup_date: '', pickup_time: '', pickup_address: '' });
    setAcceptNoProhibited(false);
    setError('');
    setSuccessBoxes(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const handleBoxChange = (id, field, value) => {
    setBoxes(boxes.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const addBox = () => {
    setBoxes([...boxes, { id: Date.now(), size: 'M', item_description: '', notes: '' }]);
  };

  const removeBox = (id) => {
    if (boxes.length > 1) {
      setBoxes(boxes.filter(b => b.id !== id));
    }
  };

  const calculateTotal = () => {
    let totalDay = 0;
    let totalMonth = 0;
    boxes.forEach(b => {
      totalDay += BOX_SIZES[b.size].price;
      totalMonth += BOX_SIZES[b.size].priceMonth;
    });
    return { totalDay, totalMonth };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    for (let i = 0; i < boxes.length; i++) {
      if (!boxes[i].item_description.trim()) {
        setError(`Vui lòng mô tả hàng hóa cho Thùng ${i + 1}`);
        return;
      }
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
      const payload = {
        boxes: boxes.map(b => ({
          size: b.size,
          item_description: b.item_description,
          notes: b.notes
        })),
        pickup_time: pickupISO,
        pickup_address: form.pickup_address.trim() || undefined,
        accept_no_prohibited: true,
      };

      const { data } = await createMyOrder(payload);
      setSuccessBoxes(data.boxes);
      if (onCreated) {
        onCreated(data.boxes[0]); 
      }
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === 'string' ? d : (Array.isArray(d) ? d.map(x => x?.msg).join(', ') : 'Có lỗi xảy ra'));
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const { totalDay, totalMonth } = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📦 Tạo Đơn Lấy Hàng Mới</DialogTitle>
          <DialogDescription>Điền thông tin các thùng hàng để shipper đến lấy</DialogDescription>
        </DialogHeader>

        {successBoxes ? (
          <div className="space-y-4 py-2">
            <Alert className="border-green-500 bg-green-50">
              <AlertDescription className="text-green-800">
                ✅ <strong>Đã tạo {successBoxes.length} đơn thành công!</strong>
              </AlertDescription>
            </Alert>
            <div className="max-h-60 overflow-y-auto space-y-3 p-1">
              {successBoxes.map((box, idx) => (
                <div key={box.box_id} className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm border">
                  <p className="font-bold text-gray-700">Thùng {idx + 1} - Size {box.size}</p>
                  <p><span className="text-gray-500">Mã đơn:</span> <span className="font-mono font-bold text-base">{box.box_id}</span></p>
                  <p><span className="text-gray-500">Hàng hóa:</span> {box.item_description}</p>
                  {box.qr_code_data && (
                    <div className="mt-3 text-center">
                      <img src={box.qr_code_data} alt="QR" className="mx-auto w-32 h-32 border rounded bg-white p-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-gray-100 p-3 rounded-lg mt-2">
              <p className="text-sm text-gray-700">📍 Lấy tại: {successBoxes[0].pickup_address}</p>
              <p className="text-sm text-gray-700">🕒 Lịch hẹn: {new Date(successBoxes[0].pickup_time).toLocaleString('vi-VN')}</p>
            </div>
            <Button onClick={handleClose} className="w-full mt-2" data-testid="close-success-dialog">
              ✓ Đóng
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 py-2">
            {error && (
              <Alert className="border-red-500 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {boxes.map((box, index) => (
                <div key={box.id} className="p-4 border border-blue-200 rounded-lg bg-white relative shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-blue-900 bg-blue-100 px-3 py-1 rounded-full text-sm">
                      📦 Thùng {index + 1}
                    </h4>
                    {boxes.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeBox(box.id)} className="text-red-500 h-8 px-2 hover:bg-red-50 hover:text-red-600">
                        🗑️ Xóa thùng này
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700">Kích thước thùng *</Label>
                      <Select value={box.size} onValueChange={(val) => handleBoxChange(box.id, 'size', val)}>
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Chọn kích thước" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S">Size S (Thùng nhỏ)</SelectItem>
                          <SelectItem value="M">Size M (Thùng tiêu chuẩn)</SelectItem>
                          <SelectItem value="L">Size L (Thùng lớn)</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm space-y-1">
                        <p><strong>Kích thước: </strong> {BOX_SIZES[box.size].dimensions}</p>
                        <p><strong>Sức chứa: </strong> {BOX_SIZES[box.size].capacity}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700">Mô tả hàng hóa *</Label>
                      <Textarea
                        placeholder="VD: Quần áo mùa đông, sách vở cũ..."
                        value={box.item_description}
                        onChange={(e) => handleBoxChange(box.id, 'item_description', e.target.value)}
                        rows={2}
                        className="bg-white border-gray-300"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-700">Ghi chú (tùy chọn cho thùng này)</Label>
                      <Input
                        placeholder="VD: Hàng dễ vỡ..."
                        value={box.notes}
                        onChange={(e) => handleBoxChange(box.id, 'notes', e.target.value)}
                        className="bg-white border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addBox} className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50 py-6 font-medium">
                + Bấm vào đây để đặt thêm thùng hàng khác
              </Button>
            </div>

            <hr className="my-2 border-gray-200" />

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="pickup_date" className="text-gray-700">Ngày lấy hàng *</Label>
                <Input
                  id="pickup_date"
                  type="date"
                  min={today}
                  value={form.pickup_date}
                  onChange={(e) => setForm({ ...form, pickup_date: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup_time" className="text-gray-700">Giờ lấy *</Label>
                <Input
                  id="pickup_time"
                  type="time"
                  value={form.pickup_time}
                  onChange={(e) => setForm({ ...form, pickup_time: e.target.value })}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="pickup_address" className="text-gray-700">Địa chỉ lấy hàng</Label>
                <Input
                  id="pickup_address"
                  placeholder={defaultAddress || 'Nhập địa chỉ lấy hàng'}
                  value={form.pickup_address}
                  onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                  className="bg-white"
                />
                {defaultAddress && (
                  <p className="text-xs text-gray-500 mt-1">💡 Để trống sẽ dùng địa chỉ mặc định: {defaultAddress}</p>
                )}
              </div>
            </div>

            {/* Total estimation */}
            <div className="bg-orange-50 border border-orange-300 rounded-lg p-5 text-center shadow-sm">
              <p className="text-sm font-medium text-orange-800 mb-2">Tổng chi phí ước tính ({boxes.length} thùng):</p>
              <p className="text-3xl font-bold text-orange-600">
                {totalDay.toLocaleString()} VNĐ <span className="text-base font-normal text-orange-700">/ ngày</span>
              </p>
              <p className="text-sm font-medium text-orange-700 mt-2 bg-orange-100 inline-block px-3 py-1 rounded-full">
                (~{totalMonth.toLocaleString()} VNĐ / tháng)
              </p>
            </div>

            <div className={`p-4 rounded-lg border-2 transition-colors ${acceptNoProhibited ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-300 hover:border-gray-400'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptNoProhibited}
                  onChange={(e) => setAcceptNoProhibited(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  ✅ Tôi cam kết <strong>KHÔNG gửi hàng cấm</strong> theo quy định của pháp luật (Vũ khí, chất cấm, động vật...). Vi phạm sẽ bị phong toả tài sản và báo cáo cơ quan chức năng.
                </span>
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">Hủy</Button>
              <Button type="submit" disabled={submitting || !acceptNoProhibited} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                {submitting ? 'Đang xử lý...' : '✓ Xác nhận Đặt hàng'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderDialog;
