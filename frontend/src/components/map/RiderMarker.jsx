import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Motorcycle emoji as custom marker
const riderIcon = L.divIcon({
  html: '🏍️',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function RiderMarker({ position, riderName, eta }) {
  return (
    <Marker position={position} icon={riderIcon}>
      <Popup>
        <div style={{ textAlign: 'center' }}>
          <strong>🏍️ {riderName}</strong>
          {eta && (
            <p style={{ margin: '4px 0 0', color: '#16a34a' }}>
              ETA: <strong>{eta} min</strong>
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}