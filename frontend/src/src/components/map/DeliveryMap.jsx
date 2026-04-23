import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RiderMarker from './RiderMarker';
import RoutePolyline from './RoutePolyline';

// Fix Leaflet default marker icons broken by Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

// Custom delivery pin icon
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

/**
 * Smoothly re-centres map when rider position changes.
 * Extracted as a child component because useMap() only works
 * inside a MapContainer.
 */
function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.panTo([parseFloat(lat), parseFloat(lng)], { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function DeliveryMap({ tracking, history }) {
  const defaultCenter = [-1.2864, 36.8172];   // Nairobi CBD

  const riderPos = tracking?.latitude && tracking?.longitude
    ? [parseFloat(tracking.latitude), parseFloat(tracking.longitude)]
    : null;

  const deliveryPos = tracking?.delivery_lat && tracking?.delivery_lng
    ? [parseFloat(tracking.delivery_lat), parseFloat(tracking.delivery_lng)]
    : null;

  const routePoints = history.map(p => [
    parseFloat(p.latitude),
    parseFloat(p.longitude),
  ]);

  return (
    <MapContainer
      center={riderPos || defaultCenter}
      zoom={14}
      style={{ height: '450px', width: '100%', borderRadius: '12px' }}
    >
      {/* OpenStreetMap tiles — 100% free */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-pan map to follow rider */}
      {riderPos && (
        <MapRecenter lat={tracking.latitude} lng={tracking.longitude} />
      )}

      {/* Rider marker */}
      {riderPos && (
        <RiderMarker
          position={riderPos}
          riderName={tracking.rider_name}
          eta={tracking.eta_minutes}
        />
      )}

      {/* Delivery destination marker */}
      {deliveryPos && (
        <Marker position={deliveryPos} icon={deliveryIcon}>
          <Popup>📦 Delivery location</Popup>
        </Marker>
      )}

      {/* Route trail polyline */}
      {routePoints.length > 1 && (
        <RoutePolyline points={routePoints} />
      )}
    </MapContainer>
  );
}