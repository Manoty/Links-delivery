import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

const TYPE_ICON = {
  order_placed:    '📋',
  payment_success: '💳',
  rider_assigned:  '🏍️',
  order_picked_up: '🚀',
  order_delivered: '🎉',
  order_cancelled: '❌',
  new_order:       '📦',
  rating_received: '⭐',
};

export default function NotificationBell({ color = '#fff' }) {
  const { notifications, unreadCount, markRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open && unreadCount > 0) {
      markRead([]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          borderRadius: 8,
          width: 36,
          height: 36,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontSize: 18,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#E24B4A',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid #fff',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute',
            right: 0,
            top: 44,
            width: 320,
            maxHeight: 420,
            background: '#fff',
            borderRadius: 12,
            border: '0.5px solid var(--gray-200)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '0.5px solid var(--gray-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Notifications</div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markRead([])}
                  style={{ fontSize: 11, color: 'var(--green-700)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                  No notifications yet
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '0.5px solid var(--gray-200)',
                      background: n.is_read ? '#fff' : 'var(--green-50)',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: n.is_read ? 'var(--gray-100)' : 'var(--green-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}>
                      {TYPE_ICON[n.type] || '📬'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4 }}>{n.body}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                        {new Date(n.created_at).toLocaleTimeString('en-KE', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {!n.is_read && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green-700)', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}