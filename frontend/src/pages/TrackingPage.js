import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBox, getBoxHistory } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MapView from '@/components/MapView';

const statusConfig = {
  'WAITING_FOR_PICKUP': { label: '⏳ Chờ Shipper Lấy', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', step: 1 },
  'PICKED_UP': { label: '🚚 Đã Lấy Hàng', color: 'bg-blue-100 text-blue-800 border-blue-300', step: 2 },
  'IN_HUB': { label: '🏢 Đang Ở Hub', color: 'bg-purple-100 text-purple-800 border-purple-300', step: 3 },
  'DELIVERED': { label: '✅ Đã Giao Thành Công', color: 'bg-green-100 text-green-800 border-green-300', step: 4 }
};

const ProgressBar = ({ currentStatus }) => {
  const steps = [
    { key: 'WAITING_FOR_PICKUP', label: 'Chờ Lấy', icon: '📦' },
    { key: 'PICKED_UP', label: 'Đã Lấy', icon: '🚚' },
    { key: 'IN_HUB', label: 'Ở Hub', icon: '🏢' },
    { key: 'DELIVERED', label: 'Đã Giao', icon: '✅' }
  ];

  const currentStep = statusConfig[currentStatus]?.step || 1;

  return (
    <div className="py-6">
      <div className="flex justify-between items-center relative">
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />
        </div>

        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum <= currentStep;
          const isCurrent = stepNum === currentStep;
          
          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-4 transition-all
                ${isActive ? 'bg-white border-blue-500 shadow-lg' : 'bg-gray-100 border-gray-300'}
                ${isCurrent ? 'ring-4 ring-blue-200 scale-110' : ''}
              `}>
                {step.icon}
              </div>
              <p className={`mt-2 text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TrackingPage = () => {
  const { boxId: paramBoxId } = useParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [box, setBox] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paramBoxId) {
      loadTracking(paramBoxId);
    }
  }, [paramBoxId]);

  const loadTracking = async (boxId) => {
    setLoading(true);
    setError('');
    setBox(null);
    setHistory([]);

    try {
      const [boxRes, historyRes] = await Promise.all([
        getBox(boxId),
        getBoxHistory(boxId)
      ]);
      setBox(boxRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Không tìm thấy thùng hàng. Vui lòng kiểm tra lại mã!');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/track/${searchInput.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4" data-testid="tracking-page">
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📦 Theo Dõi Đơn Hàng</h1>
          <p className="text-gray-600">Nhập mã thùng để xem trạng thái giao hàng</p>
        </div>

        {/* Search Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Nhập mã thùng (VD: BOX-8D765870)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                className="flex-1"
                data-testid="tracking-search-input"
              />
              <Button type="submit" disabled={loading} data-testid="tracking-search-button">
                {loading ? '🔄 Đang tìm...' : '🔍 Tra Cứu'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center text-red-700">
                <p className="text-4xl mb-2">❌</p>
                <p className="font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
          </div>
        )}

        {/* Box Info */}
        {box && (
          <>
            <Card data-testid="tracking-result">
              <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <CardDescription>Mã thùng</CardDescription>
                    <CardTitle className="text-2xl mt-1">{box.box_id}</CardTitle>
                  </div>
                  <Badge className={`${statusConfig[box.status]?.color} text-base px-4 py-2`}>
                    {statusConfig[box.status]?.label || box.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Người nhận</p>
                    <p className="font-medium">{box.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cập nhật lần cuối</p>
                    <p className="font-medium">{new Date(box.last_updated).toLocaleString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ngày tạo</p>
                    <p className="font-medium">{new Date(box.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Tiến trình giao hàng</h3>
                  <ProgressBar currentStatus={box.status} />
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>📜 Lịch Sử Vận Chuyển</CardTitle>
                <CardDescription>Chi tiết các bước trong quá trình giao hàng</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Chưa có cập nhật nào</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((record, idx) => (
                      <div key={record.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${idx === 0 ? 'bg-green-500 ring-4 ring-green-100' : 'bg-blue-500'}`}></div>
                          {idx < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1"></div>}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={statusConfig[record.status]?.color}>
                              {statusConfig[record.status]?.label || record.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(record.timestamp).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Shipper:</strong> {record.shipper_name}
                          </p>
                          {record.latitude && record.longitude && (
                            <p className="text-xs text-blue-600 mt-1">
                              📍 Tọa độ: {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                            </p>
                          )}
                          {record.notes && (
                            <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                              💬 {record.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map View */}
            <Card>
              <CardHeader>
                <CardTitle>🗺️ Bản Đồ Lộ Trình</CardTitle>
                <CardDescription>Vị trí cập nhật của thùng hàng</CardDescription>
              </CardHeader>
              <CardContent>
                <MapView
                  height="400px"
                  testId="customer-map"
                  showPath={true}
                  markers={history
                    .filter(h => h.latitude && h.longitude)
                    .reverse()
                    .map((h, idx) => ({
                      id: h.id,
                      lat: h.latitude,
                      lng: h.longitude,
                      status: h.status,
                      title: `${statusConfig[h.status]?.label || h.status}`,
                      description: `Shipper: ${h.shipper_name}${h.notes ? ' • ' + h.notes : ''}`,
                      time: new Date(h.timestamp).toLocaleString('vi-VN')
                    }))
                  }
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💡 Đường nét đứt thể hiện hành trình của thùng hàng
                </p>
              </CardContent>
            </Card>

            {/* Share Section */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-700 mb-2">🔗 Chia sẻ link theo dõi này:</p>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input 
                      value={window.location.href} 
                      readOnly 
                      className="text-xs"
                      data-testid="tracking-share-url"
                    />
                    <Button 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Đã copy link!');
                      }}
                      data-testid="copy-link-button"
                    >
                      📋 Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!box && !loading && !error && !paramBoxId && (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              <p className="text-6xl mb-4">🔍</p>
              <p>Nhập mã thùng để xem thông tin vận chuyển</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-4">
          <p>Powered by Smart Mini Storage 📦</p>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
