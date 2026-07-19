import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored markers per status
const createIcon = (color) => L.divIcon({
  className: 'custom-map-marker',
  html: `<div style="
    background-color: ${color};
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 12px;">📦</div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const statusColors = {
  'WAITING_FOR_PICKUP': '#eab308', // yellow
  'PICKED_UP': '#3b82f6',          // blue
  'IN_HUB': '#a855f7',              // purple
  'DELIVERED': '#22c55e',           // green
};

const statusLabels = {
  'WAITING_FOR_PICKUP': '⏳ Chờ Lấy',
  'PICKED_UP': '🚚 Đã Lấy',
  'IN_HUB': '🏢 Ở Hub',
  'DELIVERED': '✅ Đã Giao',
};

const iconCache = {};
const getCachedIcon = (color) => {
  if (!iconCache[color]) {
    iconCache[color] = createIcon(color);
  }
  return iconCache[color];
};

// Auto-fit map to markers bounds
const FitBounds = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [markers, map]);
  return null;
};

const MapView = ({ markers = [], height = '400px', center = [16.0544, 108.2022], zoom = 12, showPath = false, testId = 'map-view' }) => {
  const validMarkers = markers.filter(m => m.lat && m.lng);
  const pathPoints = showPath ? validMarkers.map(m => [m.lat, m.lng]) : [];

  return (
    <div data-testid={testId} style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <MapContainer
        center={validMarkers.length > 0 ? [validMarkers[0].lat, validMarkers[0].lng] : center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render polyline showing route */}
        {showPath && pathPoints.length > 1 && (
          <Polyline 
            positions={pathPoints} 
            pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.7, dashArray: '5,10' }} 
          />
        )}

        {/* Render markers */}
        {validMarkers.map((marker, idx) => (
          <Marker
            key={marker.id || idx}
            position={[marker.lat, marker.lng]}
          >
            <Popup>
              <div style={{ fontSize: '13px', minWidth: '180px' }}>
                {marker.title && <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{marker.title}</div>}
                {marker.status && (
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: statusColors[marker.status] + '20', 
                      color: statusColors[marker.status],
                      fontWeight: 'bold',
                      fontSize: '11px'
                    }}>
                      {statusLabels[marker.status] || marker.status}
                    </span>
                  </div>
                )}
                {marker.description && <div style={{ color: '#666', marginTop: '2px' }}>{marker.description}</div>}
                {marker.time && <div style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>🕐 {marker.time}</div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {validMarkers.length > 0 && <FitBounds markers={validMarkers} />}
      </MapContainer>

      {validMarkers.length === 0 && (
        <div style={{
          position: 'relative',
          marginTop: '-' + height,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.85)',
          pointerEvents: 'none',
          color: '#666',
          fontSize: '14px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px' }}>🗺️</div>
            <div style={{ marginTop: '8px' }}>Chưa có dữ liệu vị trí</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
