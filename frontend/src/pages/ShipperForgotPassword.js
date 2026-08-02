import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotShipperPassword } from '@/services/api';
import { sendShipperForgotPasswordEmail } from '@/services/emailService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ShipperForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await forgotShipperPassword({ email });
      
      const { shipper } = response.data;
      const isGithubPages = window.location.hostname.includes('github.io');
      const basePath = isGithubPages ? '/smart-mini-storage-danang' : '';
      const setupLink = `${window.location.origin}${basePath}/?redirect=/shipper/setup-password`;
      
      await sendShipperForgotPasswordEmail(shipper.email, shipper.shipper_code, setupLink);

      setSuccess(true);
    } catch (error) {
      alert(error.response?.data?.detail || "Không tìm thấy tài khoản hoặc có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto text-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900">Quên mật khẩu</h2>
        <p className="mt-2 text-gray-600">Nhập email của bạn để nhận liên kết khôi phục</p>
      </div>

      <div className="max-w-md w-full mx-auto bg-white py-8 px-6 shadow rounded-xl">
        {success ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 text-green-800 p-4 rounded-lg">
              Yêu cầu thành công! Chúng tôi đã gửi một liên kết đổi mật khẩu đến email <strong>{email}</strong>. Vui lòng kiểm tra hộp thư (kể cả mục Spam).
            </div>
            <Link to="/shipper/login">
              <Button className="w-full mt-4 bg-blue-600">Quay lại Đăng nhập</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Địa chỉ Email *</Label>
              <Input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Ví dụ: nguyenvan@gmail.com"
                required
              />
            </div>
            
            <Button type="submit" className="w-full bg-blue-600" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
            </Button>

            <div className="mt-4 text-center text-sm text-gray-600">
              <Link to="/shipper/login" className="text-blue-600 font-medium hover:underline">Quay lại Đăng nhập</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShipperForgotPassword;
