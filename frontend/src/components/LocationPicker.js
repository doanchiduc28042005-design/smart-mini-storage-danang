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

// Vietnamese cities preset
const PRESET_LOCATIONS = [
  { name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
  { name: 'Hải Phòng', lat: 20.8449, lng: 106.6881 },
  { name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
  { name: 'Huế', lat: 16.4637, lng: 107.5909 },
  { name: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
  { name: 'TP.HCM', lat: 10.8231, lng: 106.6297 },
  { name: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
  { name: 'Vinh', lat: 18.6796, lng: 105.6822 },
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

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ GPS');
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
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
    onSave({ latitude: parseFloat(lat), longitude: parseFloat(lng) });
  };

  return (
    <div className="space-y-3" data-testid="location-picker">
      <p className="text-sm text-gray-600">
        💡 <strong>Click trực tiếp lên bản đồ</strong>, dùng vị trí của bạn, hoặc chọn thành phố
      </p>

      {/* Map */}
      <div style={{ height: '350px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <MapContainer
          center={[lat, lng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
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
