import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Da Nang bounding box (approximate)
const DANANG_BOUNDS = {
  minLat: 15.85,   // South (Hội An)
  maxLat: 16.20,   // North (Hải Vân pass)
  minLng: 107.85,  // West (Bà Nà mountains)
  maxLng: 108.40,  // East (sea/Sơn Trà)
};

const isInDaNang = (lat, lng) => {
  return lat >= DANANG_BOUNDS.minLat && lat <= DANANG_BOUNDS.maxLat &&
         lng >= DANANG_BOUNDS.minLng && lng <= DANANG_BOUNDS.maxLng;
};

// Da Nang area preset locations
const PRESET_LOCATIONS = [
  { name: 'Trung tâm ĐN', lat: 16.0544, lng: 108.2022 },
  { name: 'Hải Châu', lat: 16.0668, lng: 108.2208 },
  { name: 'Thanh Khê', lat: 16.0639, lng: 108.1825 },
  { name: 'Sơn Trà', lat: 16.1067, lng: 108.2627 },
  { name: 'Ngũ Hành Sơn', lat: 16.0073, lng: 108.2528 },
  { name: 'Liên Chiểu', lat: 16.0816, lng: 108.1545 },
  { name: 'Cẩm Lệ', lat: 16.0181, lng: 108.2024 },
  { name: 'Hoà Vang', lat: 15.9849, lng: 108.1290 },
  { name: 'Cầu Rồng', lat: 16.0612, lng: 108.2272 },
  { name: 'Sân bay ĐN', lat: 16.0439, lng: 108.1995 },
  { name: 'Bà Nà Hills', lat: 15.9978, lng: 107.9881 },
  { name: 'Hội An', lat: 15.8800, lng: 108.3380 },
];

const ClickHandler = ({ onPick }) => {
  useMapEvents({
    click: (e) => {
      onPick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom() < 10 ? 12 : map.getZoom());
    }
  }, [position, map]);
  return null;
};

const LocationPicker = ({ initialLat, initialLng, onSave, onCancel }) => {
  const [lat, setLat] = useState(initialLat || 16.0544);
  const [lng, setLng] = useState(initialLng || 108.2022);
  const [searching, setSearching] = useState(false);
  const outOfBounds = !isInDaNang(lat, lng);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ GPS');
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        if (!isInDaNang(newLat, newLng)) {
          if (!window.confirm(`⚠️ Vị trí GPS của bạn (${newLat.toFixed(4)}, ${newLng.toFixed(4)}) ngoài khu vực Đà Nẵng.\n\nHiện hệ thống chỉ phục vụ khu vực Đà Nẵng. Bạn vẫn muốn dùng vị trí này?`)) {
            setSearching(false);
            return;
          }
        }
        setLat(newLat);
        setLng(newLng);
        setSearching(false);
      },
      (err) => {
        setSearching(false);
        alert('Không lấy được vị trí: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectPreset = (preset) => {
    setLat(preset.lat);
    setLng(preset.lng);
  };

  const handleSave = () => {
    if (outOfBounds) {
      if (!window.confirm('⚠️ Vị trí đã chọn ngoài khu vực Đà Nẵng. Bạn vẫn muốn lưu?')) {
        return;
      }
    }
    onSave({ latitude: parseFloat(lat), longitude: parseFloat(lng) });
  };

  return (
    <div className="space-y-3" data-testid="location-picker">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs text-blue-800">
        🏙️ <strong>Khu vực phục vụ:</strong> Thành phố Đà Nẵng
      </div>
      <p className="text-sm text-gray-600">
        💡 <strong>Click trực tiếp lên bản đồ</strong>, dùng vị trí của bạn, hoặc chọn quận
      </p>

      {/* Map */}
      <div style={{ height: '350px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <MapContainer
          center={[lat, lng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          maxBounds={[[DANANG_BOUNDS.minLat - 0.2, DANANG_BOUNDS.minLng - 0.3], [DANANG_BOUNDS.maxLat + 0.2, DANANG_BOUNDS.maxLng + 0.3]]}
          minZoom={9}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} />
          <ClickHandler onPick={(la, ln) => { setLat(la); setLng(ln); }} />
          <RecenterMap position={[lat, lng]} />
        </MapContainer>
      </div>

      {outOfBounds && (
        <div className="bg-orange-50 border border-orange-300 rounded-md p-2 text-xs text-orange-800">
          ⚠️ Vị trí này ngoài khu vực Đà Nẵng. Vui lòng chọn lại trong phạm vi thành phố.
        </div>
      )}

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Vĩ độ (Latitude)</Label>
          <Input
            type="number"
            step="0.000001"
            value={lat}
            onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
            data-testid="location-lat-input"
          />
        </div>
        <div>
          <Label className="text-xs">Kinh độ (Longitude)</Label>
          <Input
            type="number"
            step="0.000001"
            value={lng}
            onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
            data-testid="location-lng-input"
          />
        </div>
      </div>

      {/* Use My Location */}
      <Button
        type="button"
        variant="outline"
        onClick={handleUseMyLocation}
        disabled={searching}
        className="w-full"
        data-testid="use-my-location-button"
      >
        {searching ? '⏳ Đang lấy GPS...' : '📍 Dùng vị trí của tôi'}
      </Button>

      {/* Preset Cities */}
      <div>
        <Label className="text-xs mb-1 block">Hoặc chọn nhanh:</Label>
        <div className="flex flex-wrap gap-1">
          {PRESET_LOCATIONS.map((p) => (
            <Button
              key={p.name}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelectPreset(p)}
              className="text-xs h-7"
              data-testid={`preset-${p.name}`}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t">
        <Button onClick={handleSave} className="flex-1" data-testid="save-location-button">
          ✓ Lưu Vị Trí
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
      </div>
    </div>
  );
};

export default LocationPicker;
