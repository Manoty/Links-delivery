import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { getMyOrders } from '../../api/orders';
import { SkeletonCard } from '../../components/shared/Skeleton';
import '../../styles/app.css';

const STATUS_META = {
  pending:   { label: 'Awaiting payment', pill: 'pill-amber', step: 1 },
  paid:      { label: 'Finding rider',    pill: 'pill-blue',  step: 2 },
  assigned:  { label: 'Rider assigned',   pill: 'pill-purple',step: 3 },
  picked_up: { label: 'On the way 🏍️',   pill: 'pill-green', step: 4 },
  delivered: { label: 'Delivered ✓',      pill: 'pill-green', step: 5 },
  cancelled: { label: 'Cancelled',        pill: 'pill-red',   step: 0 },
};

export default function OrderList() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    getMyOrders()
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? orders
    : filter === 'active'
      ? orders.filter(o => ['pending','paid','assigned','picked_up'].includes(o.status))
      : orders.filter(o => o.status === 'delivered');

  const activeCount = orders.filter(o =>
    ['paid','assigned','picked_up'].includes(o.status)
  ).length;

  return (
    <div className="app-shell">
      <div className="screen-content">

        {/* Header */}
        <div className="topbar-green">
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>My orders</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {activeCount > 0 ? `${activeCount} active` : 'No active orders'}
            </div>
          </div>
          <button
            onClick={() => navigate('/place-order')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 10,
              padding: '8px 14px',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + New order
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 16px 4px' }}>
          {['all', 'active', 'delivered'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: filter === f ? 'var(--green-700)' : '#fff',
                color: filter === f ? '#fff' : 'var(--gray-600)',
                fontSize: 13,
                fontWeight: filter === f ? 500 : 400,
                cursor: 'pointer',
                border: filter === f ? 'none' : '0.5px solid var(--gray-200)',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Order list */}
        <div style={{ padding: '12px 0' }}>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 32px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛵</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>No orders yet</div>
              <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 20 }}>
                Your order history will appear here
              </div>
              <button className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }}
                onClick={() => navigate('/home')}>
                Order now
              </button>
            </div>
          ) : (
            filtered.map(order => {
              const meta = STATUS_META[order.status] || {};
              const isActive = ['assigned','picked_up'].includes(order.status);
              return (
                <div
                  key={order.id}
                  style={{ margin: '0 16px 10px' }}
                  onClick={() => isActive && navigate(`/orders/${order.id}/track`)}
                >
                  <div className="card" style={{
                    border: isActive ? '1.5px solid var(--green-700)' : '0.5px solid var(--gray-200)',
                    cursor: isActive ? 'pointer' : 'default',
                  }}>
                    <div style={{ padding: '12px 14px' }}>
                      {/* Top row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>
                            {new Date(order.created_at).toLocaleDateString('en-KE', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>Order #{order.id}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`pill ${meta.pill}`}>{meta.label}</span>
                          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
                            KES {parseFloat(order.total_amount).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{
                        fontSize: 13,
                        color: 'var(--gray-600)',
                        marginBottom: 10,
                        padding: '8px 10px',
                        background: 'var(--gray-50)',
                        borderRadius: 8,
                      }}>
                        {order.items?.map(i => `${i.quantity}× ${i.name}`).join(' · ')}
                      </div>

                      {/* Delivery address */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, marginTop: 1 }}>📍</span>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{order.delivery_address}</div>
                      </div>

                      {/* Rider info if assigned */}
                      {order.rider && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          background: 'var(--green-50)',
                          borderRadius: 8,
                          marginBottom: 10,
                        }}>
                          <div className="av av-sm av-green">
                            {order.rider.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--green-600)' }}>
                              {order.rider.username}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--green-600)', opacity: 0.8 }}>
                              {order.rider.phone_number}
                            </div>
                          </div>
                          {isActive && (
                            <div style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: 'var(--green-600)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                              Live
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {isActive && (
                          <button
                            className="btn-sm btn-sm-solid"
                            style={{ flex: 1, padding: '9px 0' }}
                            onClick={e => { e.stopPropagation(); navigate(`/orders/${order.id}/track`); }}
                          >
                            📍 Track live
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button
                            className="btn-sm btn-sm-green"
                            style={{ flex: 1, padding: '9px 0' }}
                            onClick={() => navigate('/home')}
                          >
                            🔄 Reorder
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            className="btn-sm btn-sm-green"
                            style={{ flex: 1, padding: '9px 0' }}
                            onClick={() => navigate(`/orders/${order.id}/pay`)}
                          >
                            💳 Pay now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {[
          { to: '/home',   icon: '🏠', label: 'Home'    },
          { to: '/orders', icon: '📋', label: 'Orders'  },
          { to: '/track',  icon: '📍', label: 'Track'   },
          { to: '/profile',icon: '👤', label: 'Profile' },
        ].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}
          >
            <div className="bn-icon">{item.icon}</div>
            <div className="bn-label">{item.label}</div>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}