import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { getAvailableOrders, acceptOrder, rejectOrder, updateOrderStatus } from '../../api/orders';
import { updateLocation } from '../../api/tracking';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/shared/Toast';
import api from '../../api/axios';
import '../../styles/app.css';
import NotificationBell from '../../components/shared/NotificationBell';

const SLA_MINUTES = 30;

function SlaTimer({ assignedAt }) {
  const [left, setLeft] = useState(SLA_MINUTES * 60);

  useEffect(() => {
    if (!assignedAt) return;
    const start = new Date(assignedAt).getTime();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setLeft(Math.max(0, SLA_MINUTES * 60 - elapsed));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [assignedAt]);

  const mins = Math.floor(left / 60);
  const secs = left % 60;
  const pct  = (left / (SLA_MINUTES * 60)) * 100;
  const cls  = pct > 50 ? '' : pct > 25 ? 'warn' : 'danger';

  return (
    <div className={`sla-timer ${cls}`}>
      SLA: {mins}:{String(secs).padStart(2, '0')} left
    </div>
  );
}

export default function RiderDashboard() {
  const { user, logoutUser } = useAuth();
  const toast = useToast();

  const [profile,     setProfile]     = useState(null);
  const [isOnline,    setIsOnline]    = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [available,   setAvailable]   = useState([]);
  const [history,     setHistory]     = useState([]);
  const [earnings,    setEarnings]    = useState({ today: 0, week: 0, deliveries: 0, avgTime: 0 });
  const [tab,         setTab]         = useState('active');
  const [loading,     setLoading]     = useState(true);
  const locationRef = useRef(null);

  const refresh = useCallback(async () => {
  try {
    const [profRes, availRes, mineRes, ratingsRes] = await Promise.all([
      api.get('/riders/profile/'),
      getAvailableOrders(),
      api.get('/orders/rider/'),
      getMyRatings().catch(() => null), // prevents crash if endpoint fails
    ]);

    setProfile(profRes.data);
    setIsOnline(profRes.data.is_available);
    setAvailable(availRes.data);

    // ratings
    if (ratingsRes?.data) {
      setRatingData(ratingsRes.data);
    }

    const mine = mineRes.data;
    const active = mine.find(o => ['assigned','picked_up'].includes(o.status));
    setActiveOrder(active || null);

    const delivered = mine.filter(o => o.status === 'delivered');
    setHistory(delivered.slice(0, 10));

    const todayEarnings = delivered.reduce((s, o) => s + parseFloat(o.total_amount) * 0.15, 0);

    setEarnings({
      today:      Math.round(todayEarnings),
      week:       Math.round(todayEarnings * 5.2),
      deliveries: delivered.length,
      avgTime:    21,
    });

  } catch (err) {
    console.log('refresh error', err);
  }

  setLoading(false);
}, []);

  const startLocationPush = () => {
    if (locationRef.current) return;
    locationRef.current = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        updateLocation({
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          order_id:  activeOrder?.id || null,
        }).catch(() => {});
      }, () => {});
    }, 5000);
  };

  const stopLocationPush = () => {
    clearInterval(locationRef.current);
    locationRef.current = null;
  };

  useEffect(() => () => stopLocationPush(), []);

  const toggleOnline = async () => {
    const next = !isOnline;
    try {
      await api.put('/riders/profile/', {
        is_available: next,
        vehicle_type: profile?.vehicle_type || 'motorcycle',
      });
      setIsOnline(next);
      if (next) {
        startLocationPush();
        toast.success('You are now online. Location sharing active.');
      } else {
        stopLocationPush();
        toast.info('You are offline.');
      }
    } catch {
      toast.error('Could not update status.');
    }
  };

  const handleAccept = async (orderId) => {
    try {
      await acceptOrder(orderId);
      toast.success('Order accepted!');
      await refresh();
      setTab('active');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not accept order.');
    }
  };

  const handleReject = async (orderId) => {
    try {
      await rejectOrder(orderId);
      toast.info('Order rejected.');
      await refresh();
    } catch {}
  };

  const handleStatusUpdate = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      if (nextStatus === 'delivered') {
        toast.success('Delivery complete! Great work.');
      } else {
        toast.success('Status updated.');
      }
      await refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed.');
    }
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'RD';

  return (
    <div className="app-shell">
      <div className="screen-content">

        {/* Header */}
        <div className="topbar-dark">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="av av-sm" style={{ background: '#374151', color: '#fff' }}>{initials}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
                {profile?.vehicle_type || 'Rider'} · {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell color="#fff" />
            <div className="toggle-wrap">
              <div style={{ fontSize: 11, color: isOnline ? '#9FE1CB' : 'rgba(255,255,255,0.4)' }}>
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <div className={`toggle ${isOnline ? 'on' : ''}`} onClick={toggleOnline}>
                <div className="toggle-thumb" />
              </div>
            </div>
            <button
              onClick={logoutUser}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '5px 10px', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer' }}
            >
              Out
            </button>
          </div>
        </div>

        {/* Online notice */}
        {isOnline && (
          <div style={{
            background: 'var(--green-50)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--green-600)',
            fontWeight: 500,
          }}>
            <span className="pulse-dot" style={{ width: 7, height: 7 }} />
            Location sharing active — updating every 5 seconds
          </div>
        )}

        {/* Earnings grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '14px 16px 4px' }}>
          {[
            { label: "Today's earnings", value: `KES ${earnings.today.toLocaleString()}`, accent: 'var(--green-700)' },
            { label: 'Deliveries today', value: earnings.deliveries,                      accent: 'var(--blue-400)'  },
            { label: 'Avg delivery time', value: `${earnings.avgTime} min`,               accent: 'var(--amber-800)' },
            { label: 'Your rating',      value: '4.9 ★',                                 accent: '#7F77DD'          },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff',
              border: '0.5px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 14px',
              display: 'flex',
              gap: 10,
            }}>
              <div style={{ width: 3, borderRadius: 2, background: s.accent, alignSelf: 'stretch' }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 16px 4px' }}>
          {[
            { key: 'active',    label: 'Active order' },
            { key: 'available', label: `Available (${available.length})` },
            { key: 'history',   label: 'History' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: tab === t.key ? 'var(--dark-900)' : '#fff',
                color: tab === t.key ? '#fff' : 'var(--gray-600)',
                fontSize: 12,
                fontWeight: tab === t.key ? 500 : 400,
                cursor: 'pointer',
                border: tab === t.key ? 'none' : '0.5px solid var(--gray-200)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ACTIVE ORDER TAB ── */}
        {tab === 'active' && (
          <div style={{ padding: '12px 0' }}>
            {!activeOrder ? (
              <div style={{ textAlign: 'center', padding: '48px 32px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏍️</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>No active order</div>
                <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 20 }}>
                  {isOnline ? 'Switch to Available tab to pick up an order' : 'Go online to start receiving orders'}
                </div>
                {!isOnline && (
                  <button className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }} onClick={toggleOnline}>
                    Go online
                  </button>
                )}
              </div>
            ) : (
              <div style={{ padding: '0 16px' }}>
                {/* Active order card */}
                <div style={{
                  background: '#fff',
                  border: '1.5px solid var(--green-700)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  marginBottom: 12,
                }}>
                  {/* Card header */}
                  <div style={{
                    background: 'var(--dark-900)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Active order</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                        #{activeOrder.id} · KES {parseFloat(activeOrder.total_amount).toLocaleString()}
                      </div>
                    </div>
                    <SlaTimer assignedAt={activeOrder.updated_at} />
                  </div>

                  {/* Route */}
                  <div style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#BA7517', flexShrink: 0 }} />
                        <div style={{ width: 1, height: 28, background: 'var(--gray-200)', margin: '3px 0' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E24B4A', flexShrink: 0 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 1 }}>Pickup</div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{activeOrder.pickup_address}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 1 }}>Deliver to</div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{activeOrder.delivery_address}</div>
                        </div>
                      </div>
                    </div>

                    {/* Customer info */}
                    <div style={{
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 12,
                    }}>
                      <div className="av av-sm av-green">
                        {activeOrder.customer?.username?.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{activeOrder.customer?.username}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{activeOrder.customer?.phone_number}</div>
                      </div>
                      <a
                        href={`tel:${activeOrder.customer?.phone_number}`}
                        style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'var(--green-50)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          textDecoration: 'none', fontSize: 16,
                        }}
                      >
                        📞
                      </a>
                    </div>

                    {/* Items */}
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 14 }}>
                      {activeOrder.items?.map(i => `${i.quantity}× ${i.name}`).join(' · ')}
                    </div>

                    {/* CTA */}
                    {activeOrder.status === 'assigned' && (
                      <button
                        className="btn-primary"
                        onClick={() => handleStatusUpdate(activeOrder.id, 'picked_up')}
                      >
                        ✓ Mark as picked up
                      </button>
                    )}
                    {activeOrder.status === 'picked_up' && (
                      <button
                        className="btn-primary"
                        onClick={() => handleStatusUpdate(activeOrder.id, 'delivered')}
                      >
                        ✓ Mark as delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AVAILABLE TAB ── */}
        {tab === 'available' && (
          <div style={{ padding: '12px 0' }}>
            {!isOnline && (
              <div style={{ margin: '0 16px 12px', background: 'var(--amber-50)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', fontSize: 13, color: 'var(--amber-800)' }}>
                ⚠️ Go online to see and accept available orders.
              </div>
            )}
            {available.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 32px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>No orders available</div>
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                  New orders will appear here automatically
                </div>
              </div>
            ) : (
              available.map(order => (
                <div key={order.id} style={{ margin: '0 16px 10px' }}>
                  <div className="card" style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Order #{order.id}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green-700)', marginTop: 2 }}>
                          KES {parseFloat(order.total_amount).toLocaleString()}
                        </div>
                      </div>
                      <span className="pill pill-green" style={{ fontSize: 12 }}>
                        ~0.8 km away
                      </span>
                    </div>

                    {/* Route */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#BA7517' }} />
                        <div style={{ width: 1, height: 20, background: 'var(--gray-200)', margin: '2px 0' }} />
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E24B4A' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>{order.pickup_address}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{order.delivery_address}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 12 }}>
                      {order.items?.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-sm btn-sm-solid"
                        style={{ flex: 2, padding: '10px 0', fontSize: 13 }}
                        onClick={() => handleAccept(order.id)}
                      >
                        ✓ Accept
                      </button>
                      <button
                        className="btn-sm btn-sm-red"
                        style={{ flex: 1, padding: '10px 0', fontSize: 13 }}
                        onClick={() => handleReject(order.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div style={{ padding: '12px 0' }}>
            {/* Weekly earnings bar */}
            <div style={{ margin: '0 16px 16px', background: 'var(--dark-900)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>This week's earnings</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                KES {earnings.week.toLocaleString()}
              </div>
              {/* Mini bar chart */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 40 }}>
                {[0.4, 0.7, 0.5, 0.9, 0.6, 1.0, 0.8].map((h, i) => (
                  <div key={i} style={{ flex: 1, background: i === 6 ? 'var(--green-700)' : 'rgba(255,255,255,0.15)', borderRadius: '3px 3px 0 0', height: `${h * 100}%` }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{d}</div>
                ))}
              </div>
            </div>
            {/* Ratings summary */}
            {ratingData && ratingData.count > 0 && (
              <div style={{ margin: '0 16px 12px' }}>
                <div className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Your ratings</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                      {ratingData.count} reviews
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                        {ratingData.average}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                        out of 5
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      {[5,4,3,2,1].map(star => {
                        const count = ratingData.ratings.filter(r => r.stars === star).length;
                        const pct = ratingData.count > 0 ? (count / ratingData.count) * 100 : 0;

                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)', width: 12 }}>
                              {star}
                            </div>
                            <div style={{ flex: 1, height: 4, background: 'var(--gray-100)', borderRadius: 2 }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: 4,
                                  background: '#BA7517',
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)', width: 20 }}>
                              {count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comments */}
                  {ratingData.ratings
                    .filter(r => r.comment)
                    .slice(0, 3)
                    .map(r => (
                      <div key={r.id} style={{
                        padding: '10px 12px',
                        background: 'var(--gray-50)',
                        borderRadius: 8,
                        marginBottom: 6,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ color: '#BA7517', fontSize: 13 }}>
                            {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                            Order #{r.order}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                          {r.comment}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)', fontSize: 13 }}>
                No completed deliveries yet
              </div>
            ) : (
              history.map(order => (
                <div key={order.id} style={{
                  margin: '0 16px 8px',
                  background: '#fff',
                  border: '0.5px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    ✓
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Order #{order.id}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.delivery_address}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green-700)' }}>
                      KES {Math.round(parseFloat(order.total_amount) * 0.15).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>
                      {new Date(order.updated_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {[
          { key: 'active',    icon: '🏍️', label: 'Active'    },
          { key: 'available', icon: '📋', label: 'Available' },
          { key: 'history',   icon: '📊', label: 'History'   },
        ].map(item => (
          <div
            key={item.key}
            className={`bn-item ${tab === item.key ? 'active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            <div className="bn-icon">{item.icon}</div>
            <div className="bn-label">{item.label}</div>
          </div>
        ))}
      </nav>
    </div>
  );
}