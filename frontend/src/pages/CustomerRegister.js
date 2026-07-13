import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCustomer } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TERMS_TITLE, TERMS_SECTIONS, TERMS_WARNING } from '@/constants/terms';

const CustomerRegister = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    default_pickup_address: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatError = (detail) => {
    if (!detail) return 'Có lỗi xảy ra, vui lòng thử lại';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(', ');
    return String(detail);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.password || !form.default_pickup_address.trim()) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!acceptTerms) {
      setError('Bạn phải đồng ý với điều khoản dịch vụ');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await registerCustomer({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        default_pickup_address: form.default_pickup_address,
        accept_terms: true,
      });
      login(data.user, data.token);
      navigate('/customer/dashboard');
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openTerms = () => {
    setShowTerms(true);
    // Mark as read once opened
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4" data-testid="register-page">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <Link to="/" className="text-sm text-blue-600 hover:underline">← Về trang chủ</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">📝 Đăng Ký Tài Khoản</h1>
          <p className="text-sm text-gray-600 mt-1">Smart Mini Storage • Đà Nẵng</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin đăng ký</CardTitle>
            <CardDescription>Các trường có dấu * là bắt buộc</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <Label htmlFor="name">Họ và tên *</Label>
                <Input
                  id="name"
                  placeholder="VD: Nguyễn Văn A"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="register-name"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone">Số điện thoại *</Label>
                <Input
                  id="phone"
                  placeholder="VD: 0912345678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  data-testid="register-phone"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="VD: email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="register-email"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Mật khẩu *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  data-testid="register-password"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  data-testid="register-confirm-password"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pickup">Địa chỉ lấy hàng mặc định *</Label>
                <Input
                  id="pickup"
                  placeholder="VD: 123 Bạch Đằng, Hải Châu, Đà Nẵng"
                  value={form.default_pickup_address}
                  onChange={(e) => setForm({ ...form, default_pickup_address: e.target.value })}
                  data-testid="register-address"
                />
                <p className="text-xs text-gray-500">🏙️ Hệ thống hiện chỉ phục vụ khu vực Đà Nẵng</p>
              </div>

              {/* Terms Checkbox */}
              <div className={`p-4 rounded-lg border-2 ${acceptTerms ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
                <div className="flex items-start gap-3">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    checked={acceptTerms}
                    disabled={!hasReadTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-gray-300"
                    data-testid="accept-terms-checkbox"
                  />
                  <div className="flex-1">
                    <label htmlFor="acceptTerms" className={`text-sm font-medium cursor-pointer ${!hasReadTerms ? 'text-gray-500' : 'text-gray-900'}`}>
                      Tôi đồng ý với tất cả điều khoản chính sách trong dịch vụ *
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      (Bắt buộc tích vào - sau khi đã đọc điều khoản)
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => { setShowTerms(true); setHasReadTerms(true); }}
                      className="text-xs h-auto p-0 mt-2 text-blue-600"
                      data-testid="read-terms-button"
                    >
                      {hasReadTerms ? '✓ Đã đọc - Xem lại điều khoản' : '📖 Đọc Điều Khoản Dịch Vụ →'}
                    </Button>
                  </div>
                </div>
                {!hasReadTerms && (
                  <p className="text-xs text-orange-700 mt-2">
                    ⚠️ Bạn cần đọc điều khoản trước khi có thể tick đồng ý
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={submitting || !acceptTerms}
                data-testid="submit-register"
              >
                {submitting ? 'Đang xử lý...' : '✓ Đăng Ký'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <Link to="/customer/login" className="text-blue-600 hover:underline font-medium">
                  Đăng nhập
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Terms Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📜 Điều Khoản Dịch Vụ</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <p className="text-center text-lg font-semibold text-gray-800">{TERMS_TITLE}</p>
            {TERMS_SECTIONS.map((section, idx) => (
              <section key={idx}>
                <h3 className="font-bold text-gray-900 border-l-4 border-blue-500 pl-3 mb-2">
                  {section.title}
                </h3>
                {section.intro && <p className="text-sm text-gray-700 mb-2">{section.intro}</p>}
                <ul className="space-y-2">
                  {section.points.map((p, pi) => (
                    <li key={pi} className="bg-gray-50 rounded p-2 text-sm">
                      <span className="font-semibold">{p.heading}:</span> {p.body}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <div className="bg-red-50 border-2 border-red-300 rounded p-4">
              <p className="font-bold text-red-900 mb-1">⚠️ Cảnh báo quan trọng:</p>
              <p className="text-sm text-red-800 italic">"{TERMS_WARNING}"</p>
            </div>
            <Button onClick={() => setShowTerms(false)} className="w-full" data-testid="close-terms-dialog">
              ✓ Đã đọc, đóng lại
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerRegister;
