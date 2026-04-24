import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTracking } from '../../hooks/useTracking';
import DeliveryMap from '../../components/map/DeliveryMap';
import RatingModal from '../../components/shared/RatingModal';
import NotificationBell from '../../components/shared/NotificationBell';
import '../../styles/app.css';

const STATUS_META = {
  pending:   { label: 'Order placed',      color: '#BA7517', step: 1 },
  paid:      { label: 'Finding rider',     color: '#378ADD', step: 2 },
  assigned:  { label: 'Rider assigned',    color: '#7F77DD', step: 3 },
  picked_up: { label: 'On the way 🏍️',    color: '#1D9E75', step: 4 },
  delivered: { label: 'Delivered! 🎉',     color: '#1D9E75', step: 5 },
  cancelled: { label: 'Cancelled',         color: '#E24B4A', step: 0 },
};

export default function TrackOrder() {
  const { orderId }                        = useParams();
  const { tracking, history, error }       = useTracking(orderId);
  const [showRating, setShowRating]        = useState(false);
  const [ratingDone, setRatingDone]        = useState(false);

  const meta      = STATUS_META[tracking?.order_status] || {};
  const isDelivered = tracking?.order_status === 'delivered';
  const canRate   = isDelivered && tracking?.rider_name && !ratingDone;

  return (
    <div className="app-shell">
      <div className="screen-content">

        {/* Header */}
        <div style={{
          background: '#fff',
          borderBottom: '0.5px solid var(--gray-200)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <button
            onClick={() => window.history.back()}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Order #{orderId}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>
              Live tracking
            </div>
          </div>
          <NotificationBell color="var(--gray-600)" />
        </div>

        {error && (
          <div style={{ margin: '12px 16px', padding: '10px 14px', background: 'var(--red-50)', borderRadius: 10, fontSize: 13, color: 'var(--red-700)' }}>
            {error}
          </div>
        )}

        {/* Status banner */}
        {tracking && (
          <div style={{
            margin: '12px 16px 0',
            padding: '12px 16px',
            borderRadius: 'var(--radius-lg)',
            background: meta.color + '18',
            borderLeft: `3px solid ${meta.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: meta.color }}>
              {meta.label}
            </div>
            {tracking.eta_minutes && !isDelivered && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: meta.color, lineHeight: 1 }}>
                  {tracking.eta_minutes}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>min away</div>
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div style={{ margin: '12px 16px 0', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '0.5px solid var(--gray-200)' }}>
          <DeliveryMap tracking={tracking} history={history} />
        </div>

        {/* Rider card */}
        {tracking?.rider_name && (
          <div style={{ margin: '12px 16px 0' }}>
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="av av-md av-green">
                  {tracking.rider_name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{tracking.rider_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>
                    {tracking.rider_phone}
                  </div>
                </div>
                <a
                  href={`tel:${tracking.rider_phone}`}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--green-50)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18,
                    textDecoration: 'none',
                  }}
                >
                  📞
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Progress steps */}
        {tracking && (
          <div style={{ margin: '12px 16px 0' }}>
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Order progress</div>
              <div className="step-track">
                {['Placed', 'Paid', 'Assigned', 'In transit', 'Delivered'].map((label, i) => {
                  const current = meta.step || 1;
                  const isDone   = i + 1 < current;
                  const isActive = i + 1 === current;
                  return (
                    <div className="step-item" key={label}>
                      {i < 4 && <div className={`step-connector ${isDone ? 'done' : ''}`} />}
                      <div className={`step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`} />
                      <div className={`step-label ${isActive ? 'active' : ''}`}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Delivered — rate CTA */}
        {canRate && (
          <div style={{ margin: '12px 16px 0' }}>
            <div style={{
              background: 'var(--green-700)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{ fontSize: 28 }}>🎉</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                  Your order arrived!
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
                  How was your delivery?
                </div>
              </div>
              <button
                onClick={() => setShowRating(true)}
                style={{
                  padding: '8px 14px',
                  background: '#fff',
                  color: 'var(--green-700)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Rate ★
              </button>
            </div>
          </div>
        )}

        {/* No rider assigned yet */}
        {tracking && !tracking.rider_name && !isDelivered && (
          <div style={{ margin: '12px 16px', textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Looking for a rider</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              We'll notify you once a rider is assigned
            </div>
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>

      {/* Rating modal */}
      {showRating && (
        <RatingModal
          order={{ id: orderId, rider: { username: tracking?.rider_name } }}
          onClose={() => setShowRating(false)}
          onSubmitted={() => setRatingDone(true)}
        />
      )}
    </div>
  );
}