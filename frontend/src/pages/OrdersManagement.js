import React, { useState, useEffect } from 'react';
import { getOrders, createOrder, deleteOrder, getCustomers, getOrderHistory, updateOrderLocation } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MapView from '@/components/MapView';
import LocationPicker from '@/components/LocationPicker';

const statusColors = {
  'WAITING_FOR_PICKUP': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'PICKED_UP': 'bg-blue-100 text-blue-800 border-blue-300',
  'IN_HUB': 'bg-purple-100 text-purple-800 border-purple-300',
  'DELIVERED': 'bg-green-100 text-green-800 border-green-300'
};

const statusLabels = {
  'WAITING_FOR_PICKUP': '⏳ Chờ Lấy',
  'PICKED_UP': '🚚 Đã Lấy',
  'IN_HUB': '🏢 Ở Hub',
  'DELIVERED': '✅ Đã Giao'
};

const OrdersManagement = () => {
  const [orders, setorders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedorder, setSelectedorder] = useState(null);
  const [orderHistory, setorderHistory] = useState([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customorderId, setCustomorderId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadorders();
    loadCustomers();
  }, []);

  const loadorders = async () => {
    try {
      const response = await getOrders();
      setorders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handlecreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Vui lòng chọn khách hàng!');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomer);
    
    try {
      await createOrder({
        customer_id: customer.id,
        customer_name: customer.name,
        order_id: customorderId || undefined
      });
      
      setShowCreateDialog(false);
      setSelectedCustomer('');
      setCustomorderId('');
      loadorders();
    } catch (error) {
      alert(error.response?.data?.detail || 'Lỗi khi tạo thùng hàng');
    }
  };

  const handledeleteOrder = async (orderId) => {
    const reason = window.prompt(`Bạn có chắc muốn xóa thùng ${orderId}?\nVui lòng nhập lý do xóa:`);
    if (reason === null) return;
    if (reason.trim() === '') {
      alert('Vui lòng nhập lý do xóa!');
      return;
    }
    
    try {
      await deleteOrder(orderId, reason.trim());
      loadorders();
      alert(`✓ Đã xóa thùng hàng ${orderId} thành công.`);
    } catch (error) {
      alert('Lỗi khi xóa thùng hàng: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleViewHistory = async (order) => {
    setSelectedorder(order);
    try {
      const response = await getOrderHistory(order.order_id);
      setorderHistory(response.data);
      setShowHistoryDialog(true);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleViewQR = (order) => {
    setSelectedorder(order);
    setShowQRDialog(true);
  };

  const handleViewDetails = (order) => {
    setSelectedorder(order);
    setShowDetailsDialog(true);
  };

  const handleOpenLocation = (order) => {
    setSelectedorder(order);
    setShowLocationDialog(true);
  };

  const handleSaveLocation = async (data) => {
    try {
      await updateOrderLocation(selectedorder.order_id, data);
      setShowLocationDialog(false);
      loadorders();
      alert(`✓ Đã cập nhật vị trí thùng ${selectedorder.order_id}`);
    } catch (error) {
      alert('Lỗi khi cập nhật vị trí: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${selectedorder.order_id}</title></head>
        <body style="text-align: center; padding: 50px;">
          <h1>${selectedorder.order_id}</h1>
          <p>Khách hàng: ${selectedorder.customer_name}</p>
          <img src="${selectedorder.qr_code_data}" style="width: 300px;" />
          <p style="margin-top: 20px;">Quét mã để cập nhật trạng thái</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredorders = orders.filter(order => {
    const statusMatch = filterStatus === 'all' || order.status === filterStatus;
    const searchMatch = order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  // Group orders by status for tabs
  const waitingorders = filteredorders.filter(b => b.status === 'WAITING_FOR_PICKUP');
  const pickedUporders = filteredorders.filter(b => b.status === 'PICKED_UP');
  const inHuborders = filteredorders.filter(b => b.status === 'IN_HUB');
  const deliveredorders = filteredorders.filter(b => b.status === 'DELIVERED');

  // Render single order card (reusable)
  const renderorderCard = (order) => (
    <Card key={order.order_id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{order.order_id}</CardTitle>
            <CardDescription>{order.customer_name}</CardDescription>
            {order.created_by === 'customer' && (
              <Badge className="mt-1 bg-indigo-100 text-indigo-800 border-indigo-300 text-xs">
                🆕 KH tự tạo
              </Badge>
            )}
          </div>
          <Badge className={statusColors[order.status]}>
            {statusLabels[order.status] || order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {order.items && order.items.length > 0 && (
          <div className="space-y-1 mb-2 bg-gray-50 p-2 rounded">
            <p className="text-xs font-semibold text-gray-700">Gồm {order.items.length} thùng hàng:</p>
            <div className="flex flex-wrap gap-1">
              {order.items.map((item, idx) => (
                <Badge key={idx} variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">
                  Size {item.size}: {item.item_description}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {order.pickup_time && (
          <p className="text-xs text-indigo-600">
            🕐 Hẹn lấy: {new Date(order.pickup_time).toLocaleString('vi-VN')}
          </p>
        )}
        {order.pickup_address && (
          <p className="text-xs text-gray-600">📍 {order.pickup_address}</p>
        )}
        <p className="text-xs text-gray-500">
          Cập nhật: {new Date(order.last_updated).toLocaleString('vi-VN')}
        </p>
        {order.last_latitude && (
          <p className="text-xs text-blue-600">
            📍 {order.last_latitude.toFixed(4)}, {order.last_longitude.toFixed(4)}
          </p>
        )}
        <div className="flex gap-2 flex-wrap mt-2">
          <Button size="sm" variant="default" onClick={() => handleViewDetails(order)} data-testid={`view-details-${order.order_id}`}>
            ℹ️ Chi Tiết
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleViewQR(order)} data-testid={`view-qr-${order.order_id}`}>
            🔲 QR
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleViewHistory(order)} data-testid={`view-history-${order.order_id}`}>
            📜 Lịch Sử
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleOpenLocation(order)} 
            data-testid={`update-location-${order.order_id}`}
            className={order.last_latitude ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'}
          >
            📍 {order.last_latitude ? 'Đổi VT' : 'Set VT'}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              const link = `${window.location.origin}/track/${order.order_id}`;
              navigator.clipboard.writeText(link);
              alert(`Đã copy link cho khách hàng:\n${link}`);
            }} 
            data-testid={`copy-track-link-${order.order_id}`}
          >
            🔗 Link KH
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handledeleteOrder(order.order_id)} data-testid={`delete-${order.order_id}`}>
            Xóa
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Empty state for tab
  const renderEmpty = (message) => (
    <Card>
      <CardContent className="pt-6 text-center text-gray-500">
        <div className="text-4xl mb-2">📭</div>
        <p>{message}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6" data-testid="orders-management">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📦 Quản Lý Thùng Hàng</h1>
          <p className="text-gray-600 mt-1">Tổng số: {filteredorders.length} thùng • 🏙️ Đà Nẵng</p>
        </div>
        <div className="flex gap-4 items-center flex-1 justify-end">
          <Input 
            placeholder="Tìm theo ID, Khách hàng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => setShowCreateDialog(true)} data-testid="create-order-button">
            + Tạo Thùng Mới
          </Button>
        </div>
      </div>

      {/* Tabs by Status - 4 sections */}
      <Tabs defaultValue="WAITING_FOR_PICKUP" className="w-full" data-testid="status-tabs">
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-gray-100 p-2">
          <TabsTrigger 
            value="WAITING_FOR_PICKUP" 
            className="flex-1 min-w-[140px] py-3 data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-900 data-[state=active]:border-yellow-400 data-[state=active]:border-2"
            data-testid="tab-waiting"
          >
            <span className="flex flex-col items-center">
              <span className="text-xl">⏳</span>
              <span className="text-xs mt-1">Chờ Lấy</span>
              <span className="text-lg font-bold">{waitingorders.length}</span>
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="PICKED_UP" 
            className="flex-1 min-w-[140px] py-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:border-blue-400 data-[state=active]:border-2"
            data-testid="tab-picked-up"
          >
            <span className="flex flex-col items-center">
              <span className="text-xl">🚚</span>
              <span className="text-xs mt-1">Đã Lấy</span>
              <span className="text-lg font-bold">{pickedUporders.length}</span>
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="IN_HUB" 
            className="flex-1 min-w-[140px] py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 data-[state=active]:border-purple-400 data-[state=active]:border-2"
            data-testid="tab-in-hub"
          >
            <span className="flex flex-col items-center">
              <span className="text-xl">🏢</span>
              <span className="text-xs mt-1">Đang Ở Hub</span>
              <span className="text-lg font-bold">{inHuborders.length}</span>
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="DELIVERED" 
            className="flex-1 min-w-[140px] py-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-900 data-[state=active]:border-green-400 data-[state=active]:border-2"
            data-testid="tab-delivered"
          >
            <span className="flex flex-col items-center">
              <span className="text-xl">✅</span>
              <span className="text-xs mt-1">Đã Giao</span>
              <span className="text-lg font-bold">{deliveredorders.length}</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="WAITING_FOR_PICKUP" className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">⏳ Chờ Lấy</Badge>
            <span className="text-sm text-gray-600">{waitingorders.length} thùng đang chờ shipper đến lấy</span>
          </div>
          {waitingorders.length === 0 ? renderEmpty('Không có thùng nào đang chờ lấy') : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="orders-list-waiting">
              {waitingorders.map(renderorderCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="PICKED_UP" className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">🚚 Đã Lấy</Badge>
            <span className="text-sm text-gray-600">{pickedUporders.length} thùng đã được shipper lấy, đang trên đường</span>
          </div>
          {pickedUporders.length === 0 ? renderEmpty('Không có thùng nào đã lấy') : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="orders-list-picked-up">
              {pickedUporders.map(renderorderCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="IN_HUB" className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-800 border-purple-300">🏢 Đang Ở Hub</Badge>
            <span className="text-sm text-gray-600">{inHuborders.length} thùng đang tập kết tại hub</span>
          </div>
          {inHuborders.length === 0 ? renderEmpty('Không có thùng nào đang ở hub') : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="orders-list-in-hub">
              {inHuborders.map(renderorderCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="DELIVERED" className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-green-300">✅ Đã Giao</Badge>
            <span className="text-sm text-gray-600">{deliveredorders.length} thùng đã giao thành công</span>
          </div>
          {deliveredorders.length === 0 ? renderEmpty('Chưa có thùng nào được giao') : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="orders-list-delivered">
              {deliveredorders.map(renderorderCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Thùng Hàng Mới</DialogTitle>
            <DialogDescription>Mã QR sẽ được tự động tạo</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlecreateOrder} className="space-y-4">
            <div className="space-y-2">
              <Label>Khách Hàng *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger data-testid="create-order-customer-select">
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mã Thùng (Tùy chọn)</Label>
              <Input
                placeholder="Để trống sẽ tự động tạo"
                value={customorderId}
                onChange={(e) => setCustomorderId(e.target.value)}
                data-testid="create-order-id-input"
              />
            </div>
            <DialogFooter>
              <Button type="submit" data-testid="submit-create-order">Tạo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mã QR: {selectedorder?.order_id}</DialogTitle>
            <DialogDescription>Khách hàng: {selectedorder?.customer_name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {selectedorder?.qr_code_data && (
              <img src={selectedorder.qr_code_data} alt="QR Code" className="w-64 h-64" />
            )}
            <Button onClick={handlePrintQR} data-testid="print-qr-button">
              🖨️ In Mã QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📍 Cập Nhật Vị Trí: {selectedorder?.order_id}</DialogTitle>
            <DialogDescription>
              Khách hàng: {selectedorder?.customer_name}
              {selectedorder?.last_latitude && (
                <span className="block text-xs mt-1">
                  Vị trí hiện tại: {selectedorder.last_latitude.toFixed(6)}, {selectedorder.last_longitude.toFixed(6)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedorder && showLocationDialog && (
            <LocationPicker
              initialLat={selectedorder.last_latitude}
              initialLng={selectedorder.last_longitude}
              onSave={handleSaveLocation}
              onCancel={() => setShowLocationDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📋 Chi Tiết Thùng Hàng: {selectedorder?.order_id}</DialogTitle>
          </DialogHeader>
          {selectedorder && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm font-semibold text-gray-500 mb-1">Khách hàng</p>
                  <p className="font-medium text-gray-900">{selectedorder.customer_name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm font-semibold text-gray-500 mb-1">Trạng thái</p>
                  <Badge className={statusColors[selectedorder.status]}>
                    {statusLabels[selectedorder.status] || selectedorder.status}
                  </Badge>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm font-semibold text-gray-500 mb-1">Thời gian tạo</p>
                  <p className="font-medium text-gray-900">{new Date(selectedorder.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm font-semibold text-gray-500 mb-1">Cập nhật cuối</p>
                  <p className="font-medium text-gray-900">{new Date(selectedorder.last_updated).toLocaleString('vi-VN')}</p>
                </div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-3">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                  <span>📦</span> Thông tin hàng hóa & Lấy hàng
                </h4>
                
                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-indigo-800">Danh sách Thùng hàng ({selectedorder.items?.length || 0}):</p>
                  <div className="bg-white p-3 rounded border border-indigo-200 mt-1 min-h-[60px] space-y-2 max-h-40 overflow-y-auto">
                    {selectedorder.items && selectedorder.items.length > 0 ? (
                      selectedorder.items.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start border-b border-indigo-50 pb-2 last:border-0 last:pb-0">
                          <Badge variant="outline" className="shrink-0 bg-blue-50 text-blue-700 border-blue-200">
                            Size {item.size}
                          </Badge>
                          <div>
                            <p className="text-sm text-gray-800">{item.item_description}</p>
                            {item.notes && <p className="text-xs text-gray-500 italic mt-0.5">Ghi chú: {item.notes}</p>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="italic text-gray-400 text-sm">Không có thông tin</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-indigo-800">Thời gian hẹn lấy:</p>
                    <p className="text-gray-800 mt-1">{selectedorder.pickup_time ? new Date(selectedorder.pickup_time).toLocaleString('vi-VN') : <span className="italic text-gray-400">Không hẹn giờ</span>}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-800">Địa chỉ lấy hàng:</p>
                    <p className="text-gray-800 mt-1">{selectedorder.pickup_address || <span className="italic text-gray-400">Sử dụng địa chỉ mặc định của KH</span>}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-indigo-800">Ghi chú của khách hàng:</p>
                  <div className="bg-white p-3 rounded border border-indigo-200 mt-1 min-h-[60px]">
                    {selectedorder.notes ? (
                      <p className="text-gray-800 whitespace-pre-wrap">{selectedorder.notes}</p>
                    ) : (
                      <p className="italic text-gray-400 text-sm">Không có ghi chú thêm</p>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Đóng</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lịch Sử Tracking: {selectedorder?.order_id}</DialogTitle>
            <DialogDescription>Khách hàng: {selectedorder?.customer_name}</DialogDescription>
          </DialogHeader>

          {/* Map of route */}
          {orderHistory.filter(h => h.latitude && h.longitude).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">🗺️ Bản đồ lộ trình</h4>
              <MapView
                height="300px"
                testId="order-history-map"
                showPath={true}
                markers={orderHistory
                  .filter(h => h.latitude && h.longitude)
                  .slice().reverse()
                  .map(h => ({
                    id: h.id,
                    lat: h.latitude,
                    lng: h.longitude,
                    status: h.status,
                    title: statusLabels[h.status] || h.status,
                    description: `Shipper: ${h.shipper_name}`,
                    time: new Date(h.timestamp).toLocaleString('vi-VN')
                  }))
                }
              />
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {orderHistory.length === 0 ? (
              <p className="text-center text-gray-500">Chưa có lịch sử</p>
            ) : (
              orderHistory.map((record) => (
                <div key={record.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statusColors[record.status]}>
                      {statusLabels[record.status] || record.status}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {new Date(record.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm"><strong>Shipper:</strong> {record.shipper_name}</p>
                  {record.latitude && record.longitude && (
                    <p className="text-xs text-blue-600 mt-1">📍 {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}</p>
                  )}
                  {record.notes && <p className="text-sm text-gray-600 mt-1"><strong>Ghi chú:</strong> {record.notes}</p>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;


