import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginCustomer } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CustomerLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatError = (detail) => {
    if (!detail) return 'Có lỗi xảy ra, vui lòng thử lại';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((e) => e?.msg || '').join(', ');
    return String(detail);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Vui lòng nhập email/SĐT và mật khẩu');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await loginCustomer({ identifier, password });
      login(data.user, data.token);
      navigate('/customer/dashboard');
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-8 px-4" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="text-sm text-blue-600 hover:underline">← Về trang chủ</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">🔐 Đăng Nhập</h1>
          <p className="text-sm text-gray-600 mt-1">Smart Mini Storage • Đà Nẵng</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chào mừng trở lại</CardTitle>
            <CardDescription>Đăng nhập bằng email hoặc số điện thoại</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <Label htmlFor="identifier">Email / Số điện thoại</Label>
                <Input
                  id="identifier"
                  placeholder="VD: email@example.com hoặc 0912345678"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  data-testid="login-identifier"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={submitting}
                data-testid="submit-login"
              >
                {submitting ? 'Đang xử lý...' : 'Đăng Nhập →'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <Link to="/customer/register" className="text-blue-600 hover:underline font-medium">
                  Đăng ký ngay
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerLogin;
