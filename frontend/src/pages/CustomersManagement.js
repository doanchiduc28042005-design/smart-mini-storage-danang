import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert('Vui lòng nhập tên và số điện thoại!');
      return;
    }

    try {
      await createCustomer(form);
      setShowDialog(false);
      setForm({ name: '', phone: '', email: '', address: '' });
      loadCustomers();
    } catch (error) {
      alert('Lỗi khi tạo khách hàng');
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="customers-management">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👤 Quản Lý Khách Hàng</h1>
          <p className="text-gray-600 mt-1">Tổng số: {customers.length} khách hàng</p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="create-customer-button">
          + Thêm Khách Hàng
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="customers-list">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{customer.name}</CardTitle>
              <CardDescription>📞 {customer.phone}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {customer.email && <p className="text-sm">📧 {customer.email}</p>}
              {customer.address && <p className="text-sm">📍 {customer.address}</p>}
              <p className="text-xs text-gray-500 mt-2">
                Tham gia: {new Date(customer.created_at).toLocaleDateString('vi-VN')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {customers.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Chưa có khách hàng nào
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Khách Hàng Mới</DialogTitle>
            <DialogDescription>Điền thông tin khách hàng</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Họ và Tên *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="VD: Nguyễn Văn A"
                data-testid="customer-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Số Điện Thoại *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                placeholder="VD: 0912345678"
                data-testid="customer-phone-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                placeholder="VD: email@example.com"
                data-testid="customer-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Địa Chỉ</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
                placeholder="VD: 123 Đường ABC, Q1, HCM"
                data-testid="customer-address-input"
              />
            </div>
            <DialogFooter>
              <Button type="submit" data-testid="submit-customer">Thêm</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersManagement;
