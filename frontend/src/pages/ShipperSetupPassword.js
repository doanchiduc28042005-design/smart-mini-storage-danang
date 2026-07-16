import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { setupShipperPassword } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

const ShipperSetupPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [form, setForm] = useState({
    shipper_code: '',
    password: '',
    confirm_password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      await setupShipperPassword({ 
        shipper_code: form.shipper_code, 
        password: form.password 
      });
      alert("Thiết lập mật khẩu thành công! Bây giờ bạn có thể đăng nhập.");
      navigate('/shipper/login');
    } catch (error) {
      alert(error.response?.data?.detail || "Có lỗi xảy ra khi tạo mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto text-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900">🚚 Thiết Lập Mật Khẩu</h2>
        <p className="mt-2 text-gray-600">Dành cho Shipper đã được phê duyệt</p>
      </div>

      <div className="max-w-md w-full mx-auto bg-white py-8 px-6 shadow rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Mã Shipper (Xem trong Email) *</Label>
            <Input 
              value={form.shipper_code} 
              onChange={(e) => setForm({...form, shipper_code: e.target.value})} 
              placeholder="VD: SP0001"
              required
            />
          </div>
          
          <div>
            <Label>Mật Khẩu Mới *</Label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"}
                value={form.password} 
                onChange={(e) => setForm({...form, password: e.target.value})} 
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div>
            <Label>Xác Nhận Mật Khẩu *</Label>
            <div className="relative">
              <Input 
                type={showConfirm ? "text" : "password"}
                value={form.confirm_password} 
                onChange={(e) => setForm({...form, confirm_password: e.target.value})} 
                placeholder="Nhập lại mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Tạo Mật Khẩu'}
          </Button>
          
          <div className="text-center mt-4 text-sm text-gray-600">
            <Link to="/shipper/login" className="text-blue-600 font-medium hover:underline">Quay lại đăng nhập</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipperSetupPassword;
