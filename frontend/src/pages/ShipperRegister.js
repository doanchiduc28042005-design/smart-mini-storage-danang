import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerShipper } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ShipperRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    cccd: '',
    license_photo: ''
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, license_photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email || !form.cccd || !form.license_photo) {
      alert("Vui lòng nhập đầy đủ thông tin và tải ảnh giấy phép lái xe!");
      return;
    }

    setLoading(true);
    try {
      await registerShipper(form);
      alert("Đăng ký thành công! Vui lòng chờ bộ phận quản lý duyệt và gửi Email cho bạn.");
      navigate('/shipper');
    } catch (error) {
      alert(error.response?.data?.detail || "Có lỗi xảy ra khi đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto text-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900">🚚 Đăng Ký Shipper</h2>
        <p className="mt-2 text-gray-600">Điền thông tin để trở thành đối tác giao hàng</p>
      </div>

      <div className="max-w-md w-full mx-auto bg-white py-8 px-6 shadow rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Họ và Tên *</Label>
            <Input 
              value={form.name} 
              onChange={(e) => setForm({...form, name: e.target.value})} 
              placeholder="VD: Nguyễn Văn A"
              required
            />
          </div>
          <div>
            <Label>Số Điện Thoại *</Label>
            <Input 
              value={form.phone} 
              onChange={(e) => setForm({...form, phone: e.target.value})} 
              placeholder="VD: 0912345678"
              required
            />
          </div>
          <div>
            <Label>Email (Dùng để nhận kết quả duyệt) *</Label>
            <Input 
              type="email"
              value={form.email} 
              onChange={(e) => setForm({...form, email: e.target.value})} 
              placeholder="VD: email@gmail.com"
              required
            />
          </div>
          <div>
            <Label>Căn Cước Công Dân *</Label>
            <Input 
              value={form.cccd} 
              onChange={(e) => setForm({...form, cccd: e.target.value})} 
              placeholder="Số CCCD của bạn"
              required
            />
          </div>
          <div>
            <Label>Ảnh Giấy Phép Lái Xe *</Label>
            <Input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload} 
              required
            />
            {form.license_photo && (
              <img src={form.license_photo} alt="Preview" className="mt-2 h-32 rounded object-cover border" />
            )}
          </div>

          <Button type="submit" className="w-full bg-blue-600" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu Đăng Ký'}
          </Button>

          <div className="text-center mt-4 text-sm text-gray-600">
            Đã có tài khoản? <Link to="/shipper/login" className="text-blue-600 font-medium hover:underline">Đăng nhập ngay</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipperRegister;
