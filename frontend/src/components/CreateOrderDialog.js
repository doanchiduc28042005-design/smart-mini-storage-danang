import React, { useState, useMemo } from 'react';
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

// Shipping fee constants (mirror backend)
const SHIPPING_BASE_FEE = 20000;
const SHIPPING_EXTRA_KM_FEE = 5000;
const SHIPPING_MAX_FREE_KM = 5;
const SHIPPING_STAIR_FEE = 15000;
const SHIPPING_BULK_FEE = 5000;

const calculateShippingFee = (deliveryMethod, distanceKm, floorNumber, hasElevator, rentalMonths, numBoxes) => {
  if (deliveryMethod === 'self_pickup') {
    return {
      outboundFee: 0, returnFee: 0, totalShippingFee: 0,
      distanceSurcharge: 0, stairFee: 0, bulkDiscount: 0,
      outboundDiscount: 0, returnDiscount: 0,
      notes: ['Tự mang đến trạm - Miễn phí hoàn toàn']
    };
  }

  const baseFee = SHIPPING_BASE_FEE;
  let distanceSurcharge = 0;
  if (distanceKm > SHIPPING_MAX_FREE_KM) {
    const extraKm = Math.ceil(distanceKm - SHIPPING_MAX_FREE_KM);
    distanceSurcharge = extraKm * SHIPPING_EXTRA_KM_FEE;
  }

  let stairFee = 0;
  if (floorNumber >= 3 && !hasElevator) {
    stairFee = SHIPPING_STAIR_FEE;
  }

  let bulkDiscount = 0;
  if (numBoxes > 1) {
    bulkDiscount = (numBoxes - 1) * (baseFee - SHIPPING_BULK_FEE);
  }

  let singleTripFee = (baseFee * numBoxes) - bulkDiscount + distanceSurcharge + stairFee;
  if (singleTripFee < 0) singleTripFee = 0;

  let outboundFee = singleTripFee;
  let returnFee = singleTripFee;
  let outboundDiscount = 0;
  let returnDiscount = 0;
  const notes = [];

  if (distanceSurcharge > 0) notes.push(`Phí vượt khoảng cách: +${distanceSurcharge.toLocaleString()} VND`);
  if (stairFee > 0) notes.push(`Phí bê vác cầu thang bộ (tầng ${floorNumber}): +${stairFee.toLocaleString()} VND`);
  if (bulkDiscount > 0) notes.push(`Giảm giá gom ${numBoxes} thùng: -${bulkDiscount.toLocaleString()} VND/lượt`);

  if (rentalMonths >= 6) {
    outboundDiscount = outboundFee;
    returnDiscount = returnFee;
    outboundFee = 0;
    returnFee = 0;
    notes.push(`Thuê ${rentalMonths} tháng: Miễn phí ship CẢ 2 CHIỀU 🎉`);
  } else if (rentalMonths >= 3) {
    outboundDiscount = outboundFee;
    outboundFee = 0;
    notes.push(`Thuê ${rentalMonths} tháng: Miễn phí ship chiều GỬI 🎁`);
  }

  return {
    outboundFee, returnFee,
    totalShippingFee: outboundFee + returnFee,
    distanceSurcharge, stairFee, bulkDiscount,
    outboundDiscount, returnDiscount, notes
  };
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
  const [shipping, setShipping] = useState({
    delivery_method: 'standard',
    distance_km: 3,
    floor_number: 0,
    has_elevator: true,
    rental_months: 1,
  });
  const [acceptNoProhibited, setAcceptNoProhibited] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const resetForm = () => {
    setBoxes([{ id: Date.now(), size: 'M', item_description: '', notes: '' }]);
    setForm({ pickup_date: '', pickup_time: '', pickup_address: '' });
    setShipping({ delivery_method: 'standard', distance_km: 3, floor_number: 0, has_elevator: true, rental_months: 1 });
    setAcceptNoProhibited(false);
    setError('');
    setSuccessData(null);
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

  // Storage cost
  const storageCost = useMemo(() => {
    let totalDay = 0;
    let totalMonth = 0;
    boxes.forEach(b => {
      totalDay += BOX_SIZES[b.size].price;
      totalMonth += BOX_SIZES[b.size].priceMonth;
    });
    return { totalDay, totalMonth };
  }, [boxes]);

  // Shipping cost (real-time)
  const shippingCost = useMemo(() => {
    return calculateShippingFee(
      shipping.delivery_method,
      shipping.distance_km,
      shipping.floor_number,
      shipping.has_elevator,
      shipping.rental_months,
      boxes.length
    );
  }, [shipping, boxes.length]);

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
        // Shipping options
        delivery_method: shipping.delivery_method,
        distance_km: parseFloat(shipping.distance_km) || 3,
        floor_number: parseInt(shipping.floor_number) || 0,
        has_elevator: shipping.has_elevator,
        rental_months: parseInt(shipping.rental_months) || 1,
      };

      const { data } = await createMyOrder(payload);
      setSuccessData(data);
      if (onCreated) {
        onCreated(data); 
      }
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === 'string' ? d : (Array.isArray(d) ? d.map(x => x?.msg).join(', ') : 'Có lỗi xảy ra'));
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📦 Tạo Đơn Lấy Hàng Mới</DialogTitle>
          <DialogDescription>Điền thông tin các thùng hàng để shipper đến lấy</DialogDescription>
        </DialogHeader>

        {successData ? (
          <div className="space-y-4 py-2">
            <Alert className="border-green-500 bg-green-50">
              <AlertDescription className="text-green-800 text-base font-semibold">
                ✅ Đã tạo đơn hàng thành công!
              </AlertDescription>
            </Alert>
            <div className="bg-white p-4 rounded-lg border text-center space-y-2">
              <p className="text-gray-500">Mã đơn của bạn:</p>
              <p className="font-mono font-bold text-2xl text-blue-600">{successData.order_id}</p>
              {successData.shipping_info && (
                <div className="mt-3 text-left bg-blue-50 p-3 rounded-lg text-sm space-y-1">
                  <p className="font-semibold text-blue-800">🚚 Phí ship:</p>
                  <p>Lượt gửi: <strong>{successData.shipping_info.outbound_fee?.toLocaleString() || 0} VND</strong></p>
                  <p>Lượt trả: <strong>{successData.shipping_info.return_fee?.toLocaleString() || 0} VND</strong></p>
                  <p className="font-bold text-blue-700 pt-1 border-t">
                    Tổng phí ship: {successData.shipping_info.total_shipping_fee?.toLocaleString() || 0} VND
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">Vui lòng kiểm tra lại đơn trong danh sách bên dưới.</p>
            </div>
            <Button onClick={handleClose} className="w-full mt-2 bg-green-600 hover:bg-green-700" data-testid="close-success-dialog">
              ✓ Đóng & Xem Danh Sách
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 py-2">
            {error && (
              <Alert className="border-red-500 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* === BOXES SECTION === */}
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

            {/* === PICKUP INFO === */}
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

            <hr className="my-2 border-gray-200" />

            {/* === SHIPPING OPTIONS === */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                🚚 Phương thức giao nhận
              </h3>

              {/* Delivery method */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      shipping.delivery_method === 'standard'
                        ? 'border-indigo-500 bg-indigo-100 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_method"
                      value="standard"
                      checked={shipping.delivery_method === 'standard'}
                      onChange={() => setShipping({ ...shipping, delivery_method: 'standard' })}
                      className="accent-indigo-600"
                    />
                    <div>
                      <p className="text-sm font-medium">🏍️ Shipper giao tận nơi</p>
                      <p className="text-xs text-gray-500">Từ 20.000 VND/lượt</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      shipping.delivery_method === 'self_pickup'
                        ? 'border-green-500 bg-green-100 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_method"
                      value="self_pickup"
                      checked={shipping.delivery_method === 'self_pickup'}
                      onChange={() => setShipping({ ...shipping, delivery_method: 'self_pickup' })}
                      className="accent-green-600"
                    />
                    <div>
                      <p className="text-sm font-medium">🏪 Tự mang đến trạm</p>
                      <p className="text-xs text-green-600 font-semibold">Miễn phí 100%</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Standard delivery options */}
              {shipping.delivery_method === 'standard' && (
                <div className="space-y-3 pl-1">
                  {/* Distance */}
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-700">📍 Khoảng cách từ trạm gần nhất (km)</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={shipping.distance_km}
                        onChange={(e) => setShipping({ ...shipping, distance_km: parseFloat(e.target.value) })}
                        className="flex-1 accent-indigo-600"
                      />
                      <span className="text-sm font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded min-w-[50px] text-center">
                        {shipping.distance_km} km
                      </span>
                    </div>
                    {shipping.distance_km > 5 && (
                      <p className="text-xs text-orange-600">⚠️ Phí vượt khoảng cách: +{((Math.ceil(shipping.distance_km - 5)) * 5000).toLocaleString()} VND</p>
                    )}
                  </div>

                  {/* Floor */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm text-gray-700">🏢 Tầng nhà</Label>
                      <Select
                        value={String(shipping.floor_number)}
                        onValueChange={(val) => setShipping({ ...shipping, floor_number: parseInt(val), has_elevator: parseInt(val) < 3 ? true : shipping.has_elevator })}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Tầng trệt</SelectItem>
                          <SelectItem value="1">Tầng 1</SelectItem>
                          <SelectItem value="2">Tầng 2</SelectItem>
                          <SelectItem value="3">Tầng 3</SelectItem>
                          <SelectItem value="4">Tầng 4</SelectItem>
                          <SelectItem value="5">Tầng 5</SelectItem>
                          <SelectItem value="6">Tầng 6+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {shipping.floor_number >= 3 && (
                      <div className="space-y-1">
                        <Label className="text-sm text-gray-700">🛗 Có thang máy?</Label>
                        <div className="flex gap-2 mt-1">
                          <label className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-md border-2 cursor-pointer text-sm transition-all ${
                            shipping.has_elevator ? 'border-green-400 bg-green-50 font-medium' : 'border-gray-200 bg-white'
                          }`}>
                            <input type="radio" name="elevator" checked={shipping.has_elevator} onChange={() => setShipping({ ...shipping, has_elevator: true })} className="sr-only" />
                            ✅ Có
                          </label>
                          <label className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-md border-2 cursor-pointer text-sm transition-all ${
                            !shipping.has_elevator ? 'border-orange-400 bg-orange-50 font-medium' : 'border-gray-200 bg-white'
                          }`}>
                            <input type="radio" name="elevator" checked={!shipping.has_elevator} onChange={() => setShipping({ ...shipping, has_elevator: false })} className="sr-only" />
                            ❌ Không
                          </label>
                        </div>
                        {!shipping.has_elevator && (
                          <p className="text-xs text-orange-600 mt-1">⚠️ Phụ phí bê vác: +15.000 VND</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rental duration */}
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">📅 Thời hạn thuê dự kiến</Label>
                <Select
                  value={String(shipping.rental_months)}
                  onValueChange={(val) => setShipping({ ...shipping, rental_months: parseInt(val) })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 tháng</SelectItem>
                    <SelectItem value="2">2 tháng</SelectItem>
                    <SelectItem value="3">3 tháng ⭐ Miễn phí ship chiều gửi</SelectItem>
                    <SelectItem value="6">6 tháng 🎉 Miễn phí ship 2 chiều</SelectItem>
                    <SelectItem value="12">12 tháng 🎉 Miễn phí ship 2 chiều</SelectItem>
                  </SelectContent>
                </Select>
                {shipping.rental_months >= 3 && shipping.rental_months < 6 && (
                  <p className="text-xs text-green-600 font-medium mt-1">🎁 Ưu đãi: Miễn phí ship chiều gửi (lượt 1)</p>
                )}
                {shipping.rental_months >= 6 && (
                  <p className="text-xs text-green-600 font-medium mt-1">🎉 Ưu đãi: Miễn phí ship CẢ 2 CHIỀU!</p>
                )}
              </div>
            </div>

            {/* === COST BREAKDOWN === */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-300 rounded-lg p-5 shadow-sm space-y-3">
              <p className="text-sm font-semibold text-orange-900">💰 Chi tiết chi phí ({boxes.length} thùng):</p>
              
              {/* Storage cost */}
              <div className="bg-white/70 rounded-md p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">📦 Phí lưu kho:</span>
                  <span className="font-medium">{storageCost.totalDay.toLocaleString()} VND/ngày</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span></span>
                  <span>(~{storageCost.totalMonth.toLocaleString()} VND/tháng)</span>
                </div>
              </div>

              {/* Shipping cost */}
              <div className="bg-white/70 rounded-md p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">🚚 Ship lượt GỬI (thùng rỗng → nhận hàng → về kho):</span>
                  <span className={`font-medium ${shippingCost.outboundFee === 0 && shipping.delivery_method === 'standard' && shipping.rental_months >= 3 ? 'text-green-600' : ''}`}>
                    {shippingCost.outboundFee === 0 && shipping.delivery_method === 'standard' && shipping.rental_months >= 3
                      ? 'Miễn phí ✓'
                      : `${shippingCost.outboundFee.toLocaleString()} VND`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">🚚 Ship lượt TRẢ (kho → giao tận cửa):</span>
                  <span className={`font-medium ${shippingCost.returnFee === 0 && shipping.delivery_method === 'standard' && shipping.rental_months >= 6 ? 'text-green-600' : ''}`}>
                    {shippingCost.returnFee === 0 && shipping.delivery_method === 'standard' && shipping.rental_months >= 6
                      ? 'Miễn phí ✓'
                      : `${shippingCost.returnFee.toLocaleString()} VND`
                    }
                  </span>
                </div>
                {shippingCost.distanceSurcharge > 0 && (
                  <div className="flex justify-between text-xs text-orange-600">
                    <span>↳ Phí vượt khoảng cách:</span>
                    <span>+{shippingCost.distanceSurcharge.toLocaleString()} VND</span>
                  </div>
                )}
                {shippingCost.stairFee > 0 && (
                  <div className="flex justify-between text-xs text-orange-600">
                    <span>↳ Phí bê vác cầu thang:</span>
                    <span>+{shippingCost.stairFee.toLocaleString()} VND</span>
                  </div>
                )}
                {shippingCost.bulkDiscount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>↳ Giảm giá gom thùng:</span>
                    <span>-{shippingCost.bulkDiscount.toLocaleString()} VND/lượt</span>
                  </div>
                )}
                {(shippingCost.outboundDiscount > 0 || shippingCost.returnDiscount > 0) && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>↳ Ưu đãi thuê dài hạn:</span>
                    <span>-{(shippingCost.outboundDiscount + shippingCost.returnDiscount).toLocaleString()} VND</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {shippingCost.notes.length > 0 && (
                <div className="text-xs text-indigo-700 space-y-0.5 px-1">
                  {shippingCost.notes.map((note, i) => (
                    <p key={i}>💡 {note}</p>
                  ))}
                </div>
              )}

              {/* Grand total */}
              <div className="border-t-2 border-orange-300 pt-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-orange-900">Tổng phí ship (2 lượt):</span>
                  <span className="text-xl font-bold text-orange-600">
                    {shippingCost.totalShippingFee.toLocaleString()} VND
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-orange-900">Tổng cộng (ship + lưu kho tháng đầu):</span>
                  <span className="text-2xl font-bold text-orange-700">
                    {(shippingCost.totalShippingFee + storageCost.totalMonth).toLocaleString()} VND
                  </span>
                </div>
              </div>
            </div>

            {/* Prohibited items checkbox */}
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
