import React, { useState, useEffect } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';

const EmployeesManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  
  const [form, setForm] = useState({ employee_code: '', name: '', email: '', phone: '', address: '', role: 'Nhân Viên' });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredEmployees(
        employees.filter(emp => 
          emp.name.toLowerCase().includes(lowerQuery) || 
          emp.employee_code.toLowerCase().includes(lowerQuery) ||
          emp.email.toLowerCase().includes(lowerQuery) ||
          emp.phone.includes(lowerQuery)
        )
      );
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchQuery, employees]);

  const loadEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setForm({ employee_code: '', name: '', email: '', phone: '', address: '', role: 'Nhân Viên' });
    setShowAddEditDialog(true);
  };

  const handleOpenEdit = (emp) => {
    setIsEditing(true);
    setCurrentEmployeeId(emp.id);
    setForm({ 
      employee_code: emp.employee_code, 
      name: emp.name, 
      email: emp.email, 
      phone: emp.phone, 
      address: emp.address,
      role: emp.role || 'Nhân Viên'
    });
    setShowAddEditDialog(true);
  };

  const handleOpenDelete = (id) => {
    setCurrentEmployeeId(id);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_code || !form.name || !form.phone) {
      alert('Vui lòng nhập Mã nhân viên, Tên và Số điện thoại!');
      return;
    }

    try {
      if (isEditing) {
        await updateEmployee(currentEmployeeId, form);
      } else {
        await createEmployee(form);
      }
      setShowAddEditDialog(false);
      loadEmployees();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || 'Lỗi khi lưu thông tin nhân viên');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEmployee(currentEmployeeId);
      setShowDeleteDialog(false);
      loadEmployees();
    } catch (error) {
      alert('Lỗi khi xoá nhân viên');
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="employees-management">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💼 Quản Lý Nhân Viên</h1>
          <p className="text-gray-600 mt-1">Tổng số: {employees.length} nhân viên</p>
        </div>
        <Button onClick={handleOpenAdd} data-testid="create-employee-button" className="flex items-center gap-2">
          <Plus size={16} /> Thêm Nhân Viên
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Danh sách tài khoản</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Tìm theo Tên, Mã NV, Email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Mã NV</TableHead>
                  <TableHead className="font-semibold">Họ và Tên</TableHead>
                  <TableHead className="font-semibold">Vai Trò</TableHead>
                  <TableHead className="font-semibold">Email (Gmail)</TableHead>
                  <TableHead className="font-semibold">Số Điện Thoại</TableHead>
                  <TableHead className="font-semibold">Địa Chỉ Nhà</TableHead>
                  <TableHead className="font-semibold text-right">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.employee_code}</TableCell>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          emp.role === 'Admin' ? 'bg-red-50 text-red-700 border-red-200' :
                          emp.role === 'Quản Lý' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }>
                          {emp.role || 'Nhân Viên'}
                        </Badge>
                      </TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>{emp.phone}</TableCell>
                      <TableCell>{emp.address}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(emp)}>
                            <Edit size={14} className="mr-1" /> Sửa
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleOpenDelete(emp.id)}>
                            <Trash2 size={14} className="mr-1" /> Xoá
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                      Không tìm thấy nhân viên nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Sửa Thông Tin Nhân Viên' : 'Thêm Nhân Viên Mới'}</DialogTitle>
            <DialogDescription>
              Điền thông tin tài khoản nhân viên doanh nghiệp
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã Nhân Viên *</Label>
                <Input
                  value={form.employee_code}
                  onChange={(e) => setForm({...form, employee_code: e.target.value})}
                  placeholder="VD: NV001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Số Điện Thoại *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  placeholder="VD: 0912345678"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Họ và Tên *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="VD: Nguyễn Văn A"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email (Gmail) *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                placeholder="VD: nv.a@gmail.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Địa Chỉ Nhà</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
                placeholder="VD: 123 Đường ABC, Q1, HCM"
              />
            </div>
            <div className="space-y-2">
              <Label>Vai Trò *</Label>
              <Select value={form.role} onValueChange={(value) => setForm({...form, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Quản Lý">Quản Lý</SelectItem>
                  <SelectItem value="Nhân Viên">Nhân Viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowAddEditDialog(false)}>
                Hủy
              </Button>
              <Button type="submit">{isEditing ? 'Cập Nhật' : 'Thêm Mới'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận Xoá</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xoá nhân viên này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xác Nhận Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesManagement;
