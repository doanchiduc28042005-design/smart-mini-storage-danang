import React, { useState, useEffect } from 'react';
import { getBoxes, createBox, deleteBox, getCustomers, getBoxHistory, updateBoxLocation } from '@/services/api';
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

const BoxesManagement = () => {
  const [boxes, setBoxes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [boxHistory, setBoxHistory] = useState([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customBoxId, setCustomBoxId] = useState('');

  useEffect(() => {
    loadBoxes();
    loadCustomers();
  }, []);

  const loadBoxes = async () => {
    try {
      const response = await getBoxes();
      setBoxes(response.data);
    } catch (error) {
      console.error('Error loading boxes:', error);
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

  const handleCreateBox = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Vui lòng chọn khách hàng!');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomer);
    
    try {
      await createBox({
        customer_id: customer.id,
        customer_name: customer.name,
        box_id: customBoxId || undefined
      });
      
      setShowCreateDialog(false);
      setSelectedCustomer('');
      setCustomBoxId('');
      loadBoxes();
    } catch (error) {
      alert(error.response?.data?.detail || 'Lỗi khi tạo thùng hàng');
    }
  };

  const handleDeleteBox = async (boxId) => {
    if (!window.confirm(`Bạn có chắc muốn xóa thùng ${boxId}?`)) return;
    
    try {
      await deleteBox(boxId);
      loadBoxes();
    } catch (error) {
      alert('Lỗi khi xóa thùng hàng');
    }
  };

  const handleViewHistory = async (box) => {
    setSelectedBox(box);
    try {
      const response = await getBoxHistory(box.box_id);
      setBoxHistory(response.data);
      setShowHistoryDialog(true);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleViewQR = (box) => {
    setSelectedBox(box);
    setShowQRDialog(true);
  };

  const handleOpenLocation = (box) => {
    setSelectedBox(box);
    setShowLocationDialog(true);
  };

  const handleSaveLocation = async (data) => {
    try {
      await updateBoxLocation(selectedBox.box_id, data);
      setShowLocationDialog(false);
      loadBoxes();
      alert(`✓ Đã cập nhật vị trí thùng ${selectedBox.box_id}`);
    } catch (error) {
      alert('Lỗi khi cập nhật vị trí: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${selectedBox.box_id}</title></head>
        <body style="text-align: center; padding: 50px;">
          <h1>${selectedBox.box_id}</h1>
          <p>Khách hàng: ${selectedBox.customer_name}</p>
          <img src="${selectedBox.qr_code_data}" style="width: 300px;" />
          <p style="margin-top: 20px;">Quét mã để cập nhật trạng thái</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredBoxes = filterStatus === 'all' 
    ? boxes 
    : boxes.filter(box => box.status === filterStatus);

  // Group boxes by status for tabs
  const waitingBoxes = boxes.filter(b => b.status === 'WAITING_FOR_PICKUP');
  const pickedUpBoxes = boxes.filter(b => b.status === 'PICKED_UP');
  const inHubBoxes = boxes.filter(b => b.status === 'IN_HUB');
  const deliveredBoxes = boxes.filter(b => b.status === 'DELIVERED');

  // Render single box card (reusable)
  const renderBoxCard = (box) => (
    <Card key={box.box_id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{box.box_id}</CardTitle>
            <CardDescription>{box.customer_name}</CardDescription>
            {box.created_by === 'customer' && (
              <Badge className="mt-1 bg-indigo-100 text-indigo-800 border-indigo-300 text-xs">
                🆕 KH tự tạo
              </Badge>
            )}
          </div>
          <Badge className={statusColors[box.status]}>
            {statusLabels[box.status] || box.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {box.item_description && (
          <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
            📦 {box.item_description}
          </p>
        )}
        {box.pickup_time && (
          <p className="text-xs text-indigo-600">
            🕐 Hẹn lấy: {new Date(box.pickup_time).toLocaleString('vi-VN')}
          </p>
        )}
        {box.pickup_address && (
          <p className="text-xs text-gray-600">📍 {box.pickup_address}</p>
        )}
        <p className="text-xs text-gray-500">
          Cập nhật: {new Date(box.last_updated).toLocaleString('vi-VN')}
        </p>
        {box.last_latitude && (
          <p className="text-xs text-blue-600">
            📍 {box.last_latitude.toFixed(4)}, {box.last_longitude.toFixed(4)}
          </p>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => handleViewQR(box)} data-testid={`view-qr-${box.box_id}`}>
            🔲 QR
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleViewHistory(box)} data-testid={`view-history-${box.box_id}`}>
            📜 Lịch Sử
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleOpenLocation(box)} 
            data-testid={`update-location-${box.box_id}`}
            className={box.last_latitude ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'}
          >
            📍 {box.last_latitude ? 'Đổi VT' : 'Set VT'}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              const link = `${window.location.origin}/track/${box.box_id}`;
              navigator.clipboard.writeText(link);
              alert(`Đã copy link cho khách hàng:\n${link}`);
            }} 
            data-testid={`copy-track-link-${box.box_id}`}
          >
            🔗 Link KH
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeleteBox(box.box_id)} data-testid={`delete-${box.box_id}`}>
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
    <div className="p-6 space-y-6" data-testid="boxes-management">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📦 Quản Lý Thùng Hàng</h1>
          <p className="text-gray-600 mt-1">Tổng số: {boxes.length} thùng • 🏙️ Đà Nẵng</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="create-box-button">
          + Tạo Thùng Mới
        </Button>
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
              <span className="text-lg font-bold">{waitingBoxes.length}</span>
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
              <span className="text-lg font-bold">{pickedUpBoxes.length}</span>
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
              <span className="text-lg font-bold">{inHubBoxes.length}</span>
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
              <span className="text-lg font-bold">{deliveredBoxes.length}</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="WAITING_FOR_PICKUP" className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">⏳ Chờ Lấy</Badge>
            <span className="text-sm text-gray-600">{waitingBoxes.length} thùng đang chờ shipper đến lấy</span>
          </div>
          {waitingBoxes.length === 0 ? renderEmpty('Không có thùng nào đang chờ lấy') : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="boxes-list-waiting">
              {waitingBoxes.map(renderBoxCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="PICKED_UP" className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">🚚 Đã Lấy</Badge>
            <span className="text-sm text-gray-600">{pickedUpBoxes.length} thùng đã được shipper lấy, đang trên đường</span>
          </div>
          {pickedUpBoxes.length === 0 ? renderEmpty('Không có thùng nào đã lấy') : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="boxes-list-picked-up">
              {pickedUpBoxes.map(renderBoxCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="IN_HUB" className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-800 border-purple-300">🏢 Đang Ở Hub</Badge>
            <span className="text-sm text-gray-600">{inHubBoxes.length} thùng đang tập kết tại hub</span>
          </div>
          {inHubBoxes.length === 0 ? renderEmpty('Không có thùng nào đang ở hub') : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="boxes-list-in-hub">
              {inHubBoxes.map(renderBoxCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="DELIVERED" className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-green-300">✅ Đã Giao</Badge>
            <span className="text-sm text-gray-600">{deliveredBoxes.length} thùng đã giao thành công</span>
          </div>
          {deliveredBoxes.length === 0 ? renderEmpty('Chưa có thùng nào được giao') : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="boxes-list-delivered">
              {deliveredBoxes.map(renderBoxCard)}
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
          <form onSubmit={handleCreateBox} className="space-y-4">
            <div className="space-y-2">
              <Label>Khách Hàng *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger data-testid="create-box-customer-select">
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
                value={customBoxId}
                onChange={(e) => setCustomBoxId(e.target.value)}
                data-testid="create-box-id-input"
              />
            </div>
            <DialogFooter>
              <Button type="submit" data-testid="submit-create-box">Tạo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mã QR: {selectedBox?.box_id}</DialogTitle>
            <DialogDescription>Khách hàng: {selectedBox?.customer_name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {selectedBox?.qr_code_data && (
              <img src={selectedBox.qr_code_data} alt="QR Code" className="w-64 h-64" />
            )}
            <Button onClick={handlePrintQR} data-testid="print-qr-button">
              🖨️ In Mã QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Picker Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📍 Cập Nhật Vị Trí: {selectedBox?.box_id}</DialogTitle>
            <DialogDescription>
              Khách hàng: {selectedBox?.customer_name}
              {selectedBox?.last_latitude && (
                <span className="block text-xs mt-1">
                  Vị trí hiện tại: {selectedBox.last_latitude.toFixed(6)}, {selectedBox.last_longitude.toFixed(6)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedBox && showLocationDialog && (
            <LocationPicker
              initialLat={selectedBox.last_latitude}
              initialLng={selectedBox.last_longitude}
              onSave={handleSaveLocation}
              onCancel={() => setShowLocationDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lịch Sử Tracking: {selectedBox?.box_id}</DialogTitle>
            <DialogDescription>Khách hàng: {selectedBox?.customer_name}</DialogDescription>
          </DialogHeader>

          {/* Map of route */}
          {boxHistory.filter(h => h.latitude && h.longitude).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">🗺️ Bản đồ lộ trình</h4>
              <MapView
                height="300px"
                testId="box-history-map"
                showPath={true}
                markers={boxHistory
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
            {boxHistory.length === 0 ? (
              <p className="text-center text-gray-500">Chưa có lịch sử</p>
            ) : (
              boxHistory.map((record) => (
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

export default BoxesManagement;
