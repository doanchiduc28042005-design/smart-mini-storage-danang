import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;



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

const createColoredPinSVG = (color) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3" fill="white"></circle>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const iconCache = {};
const getCachedIcon = (color) => {
  if (!iconCache[color]) {
    iconCache[color] = L.icon({
      iconUrl: createColoredPinSVG(color),
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -40],
      shadowUrl: iconShadow,
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    });
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
            icon={getCachedIcon(marker.color || statusColors[marker.status] || '#6b7280')}
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
