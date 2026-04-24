import { useParams } from 'react-router-dom';
import { useTracking } from '../../hooks/useTracking';
import DeliveryMap from '../../components/map/DeliveryMap';
import NotificationBell from '../../components/notifications/NotificationBell';

const STATUS_LABELS = {
  pending:   { label: 'Order Placed',       color: '#f59e0b' },
  paid:      { label: 'Payment Confirmed',  color: '#3b82f6' },
  assigned:  { label: 'Rider Assigned',     color: '#8b5cf6' },
  picked_up: { label: 'Order Picked Up',    color: '#f97316' },
  delivered: { label: 'Delivered! 🎉',      color: '#16a34a' },
  cancelled: { label: 'Cancelled',          color: '#ef4444' },
};

export default function TrackOrder() {
  const { orderId } = useParams();
  const { tracking, history, error } = useTracking(orderId);

  const statusInfo = STATUS_LABELS[tracking?.order_status] || {};

  return (
    <div style={styles.container}>

      {/* Topbar */}
      <div style={styles.topbar}>
        <button
          onClick={() => window.history.back()}
          style={styles.backBtn}
        >
          ←
        </button>

        <div style={{ flex: 1 }}>
          <div style={styles.topbarTitle}>
            Tracking order #{orderId}
          </div>
          <div style={styles.topbarSub}>
            Live updates every 5 seconds
          </div>
        </div>

        <NotificationBell />
      </div>

      {error && (
        <div style={styles.error}>{error}</div>
      )}

      {/* Status badge */}
      {tracking && (
        <div style={{ ...styles.statusBadge, background: statusInfo.color }}>
          {statusInfo.label}
        </div>
      )}

      {/* ETA card */}
      {tracking?.eta_minutes && (
        <div style={styles.etaCard}>
          <span style={styles.etaNumber}>{tracking.eta_minutes}</span>
          <span style={styles.etaLabel}>minutes away</span>
        </div>
      )}

      {/* Rider info */}
      {tracking?.rider_name && (
        <div style={styles.riderCard}>
          <span>🏍️ <strong>{tracking.rider_name}</strong></span>
          <span>📞 {tracking.rider_phone}</span>
        </div>
      )}

      {/* Map */}
      <div style={styles.mapWrapper}>
        <DeliveryMap tracking={tracking} history={history} />
      </div>

      {/* No rider yet */}
      {tracking && !tracking.rider_name && (
        <div style={styles.waiting}>
          ⏳ Waiting for a rider to be assigned...
        </div>
      )}

      {/* Delivered */}
      {tracking?.order_status === 'delivered' && (
        <div style={styles.delivered}>
          ✅ Your order has been delivered. Enjoy!
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '24px 16px',
    fontFamily: 'sans-serif',
  },

  topbar: {
    background: '#000',
    padding: '16px 18px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    marginBottom: 18,
  },

  backBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    fontSize: 18,
  },

  topbarTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
  },

  topbarSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },

  error: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },

  statusBadge: {
    display: 'inline-block',
    color: '#fff',
    padding: '6px 16px',
    borderRadius: 20,
    fontWeight: 600,
    marginBottom: 16,
  },

  etaCard: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },

  etaNumber: {
    fontSize: 48,
    fontWeight: 800,
    color: '#16a34a',
  },

  etaLabel: {
    fontSize: 18,
    color: '#6b7280',
  },

  riderCard: {
    display: 'flex',
    gap: 24,
    background: '#f3f4f6',
    padding: '12px 16px',
    borderRadius: 8,
    marginBottom: 16,
  },

  mapWrapper: {
    marginBottom: 16,
  },

  waiting: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 24,
  },

  delivered: {
    background: '#dcfce7',
    color: '#15803d',
    padding: 16,
    borderRadius: 8,
    textAlign: 'center',
    fontWeight: 600,
  },
};