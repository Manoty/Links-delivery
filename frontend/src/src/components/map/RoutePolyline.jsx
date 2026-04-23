import { Polyline } from 'react-leaflet';

/**
 * Draws the rider's travelled route as a blue line.
 * Points must be ordered oldest → newest for correct direction.
 */
export default function RoutePolyline({ points }) {
  return (
    <Polyline
      positions={points}
      pathOptions={{
        color:     '#3b82f6',
        weight:    4,
        opacity:   0.7,
        dashArray: '8, 4',   // Dashed line looks cleaner than solid
      }}
    />
  );
}