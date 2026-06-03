import React, { useState, useEffect } from 'react';
import { getShippers, createShipper } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const ShippersManagement = () => {
  const [shippers, setShippers] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', status: 'active' });

  useEffect(() => {
    loadShippers();
  }, []);

  const loadShippers = async () => {
    try {
      const response = await getShippers();
      setShippers(response.data);
    } catch (error) {
      console.error('Error loading shippers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert('Vui lòng nhập tên và số điện thoại!');
      return;
    }

    try {
      await createShipper(form);
      setShowDialog(false);
      setForm({ name: '', phone: '', status: 'active' });
      loadShippers();
    } catch (error) {
      alert('Lỗi khi tạo shipper');
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="shippers-management">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🚚 Quản Lý Shippers</h1>
          <p className="text-gray-600 mt-1">Tổng số: {shippers.length} shipper</p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="create-shipper-button">
          + Thêm Shipper
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="shippers-list">
        {shippers.map((shipper) => (
          <Card key={shipper.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{shipper.name}</CardTitle>
                  <CardDescription>📞 {shipper.phone}</CardDescription>
                </div>
                <Badge className={shipper.status === 'active' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-800 border-gray-300'}>
                  {shipper.status === 'active' ? '✓ Hoạt Động' : '✗ Tạm Dừng'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                Tham gia: {new Date(shipper.created_at).toLocaleDateString('vi-VN')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {shippers.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Chưa có shipper nào
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Shipper Mới</DialogTitle>
            <DialogDescription>Điền thông tin shipper</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Họ và Tên *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="VD: Shipper Minh"
                data-testid="shipper-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Số Điện Thoại *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                placeholder="VD: 0987654321"
                data-testid="shipper-phone-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng Thái</Label>
              <Select value={form.status} onValueChange={(value) => setForm({...form, status: value})}>
                <SelectTrigger data-testid="shipper-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt Động</SelectItem>
                  <SelectItem value="inactive">Tạm Dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" data-testid="submit-shipper">Thêm</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShippersManagement;
