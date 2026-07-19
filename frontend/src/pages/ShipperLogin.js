import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { loginShipper } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

const ShipperLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState({
    shipper_code: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shipper_code || !form.password) {
      alert("Vui lòng nhập mã Shipper và mật khẩu!");
      return;
    }

    setLoading(true);
    try {
      const response = await loginShipper(form);
      login(response.data.shipper, response.data.token);
      
      const from = location.state?.from?.pathname || "/shipper";
      navigate(from, { replace: true });
    } catch (error) {
      alert(error.response?.data?.detail || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-md w-full mx-auto text-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900">🚚 Đăng Nhập Shipper</h2>
        <p className="mt-2 text-gray-600">Truy cập hệ thống quản lý giao nhận</p>
      </div>

      <div className="max-w-md w-full mx-auto bg-white py-8 px-6 shadow rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Mã Shipper *</Label>
            <Input 
              value={form.shipper_code} 
              onChange={(e) => setForm({...form, shipper_code: e.target.value})} 
              placeholder="VD: SP0001"
              required
            />
          </div>
          
          <div>
            <Label>Mật Khẩu *</Label>
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

          <Button type="submit" className="w-full bg-blue-600" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </Button>
          
          <div className="mt-4 flex flex-col space-y-2 text-center text-sm text-gray-600">
            <div>
              Chưa có tài khoản? <Link to="/shipper/register" className="text-blue-600 font-medium hover:underline">Đăng ký đối tác</Link>
            </div>
            <div>
              Quên mật khẩu / Lần đầu đăng nhập? <Link to="/shipper/setup-password" className="text-blue-600 font-medium hover:underline">Thiết lập ngay</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipperLogin;
