import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const CustomerHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trackInput, setTrackInput] = useState('');

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackInput.trim()) {
      navigate(`/track/${trackInput.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4" data-testid="customer-hub">
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center mb-6">
          <Link to="/" className="text-sm text-blue-600 hover:underline">← Về trang chủ</Link>
          <div className="text-5xl mt-3">👤</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Khu Vực Khách Hàng</h1>
          <p className="text-sm text-gray-600 mt-1">🏙️ Smart Mini Storage • Đà Nẵng</p>
        </div>

        {/* If logged in - show dashboard shortcut */}
        {user && (
          <Card className="mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
            <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white/80">Chào mừng trở lại</p>
                <p className="text-lg font-bold">👋 {user.name}</p>
              </div>
              <Link to="/customer/dashboard">
                <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold" data-testid="goto-dashboard">
                  Vào Tài Khoản Của Tôi →
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Section 1: Quick track (public - no login needed) */}
        <Card className="mb-4 border-2 border-green-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-4xl">🔍</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tra Cứu Nhanh</h2>
                <p className="text-sm text-gray-600">Nhập mã thùng để xem trạng thái ngay (không cần đăng nhập)</p>
              </div>
            </div>
            <form onSubmit={handleTrack} className="flex gap-2">
              <Input
                placeholder="VD: BOX-8D765870"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value.toUpperCase())}
                className="flex-1 h-11"
                data-testid="hub-track-input"
              />
              <Button
                type="submit"
                className="h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                data-testid="hub-track-button"
              >
                🔍 Tra Cứu
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Divider */}
        {!user && (
          <div className="text-center text-xs text-gray-500 my-4">
            ─── HOẶC ĐĂNG NHẬP ĐỂ CÓ ĐẦY ĐỦ TÍNH NĂNG ───
          </div>
        )}

        {/* Section 2: Auth (register / login) - only if not logged in */}
        {!user && (
          <Card className="border-2 border-indigo-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-4xl">🔐</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tài Khoản Khách Hàng</h2>
                  <p className="text-sm text-gray-600">
                    Đăng nhập/đăng ký để tự tạo đơn lấy hàng, xem lịch sử tất cả đơn
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3 mt-4">
                <Link to="/customer/login" className="w-full">
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    data-testid="hub-login-button"
                  >
                    🔐 Đăng Nhập
                  </Button>
                </Link>
                <Link to="/customer/register" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                    data-testid="hub-register-button"
                  >
                    ✨ Đăng Ký Mới
                  </Button>
                </Link>
              </div>

              {/* Features listing */}
              <div className="mt-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-semibold text-indigo-900">🎁 Đăng ký để nhận:</p>
                <ul className="space-y-1 text-indigo-800">
                  <li>✓ Tự tạo đơn lấy hàng trực tuyến</li>
                  <li>✓ Xem tất cả đơn của bạn ở 1 chỗ</li>
                  <li>✓ Theo dõi lộ trình trên bản đồ real-time</li>
                  <li>✓ Lưu địa chỉ mặc định - tạo đơn siêu nhanh</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-gray-500 pt-6">
          <Link to="/terms" className="hover:underline">📜 Điều khoản dịch vụ</Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerHub;
