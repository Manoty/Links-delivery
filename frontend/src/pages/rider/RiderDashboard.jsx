import { useState, useEffect, useRef } from 'react';
import { getAvailableOrders, acceptOrder, rejectOrder, updateOrderStatus } from '../../api/orders';
import { updateLocation } from '../../api/tracking';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_NEXT = {
  assigned:  { label: 'Mark Picked Up',  next: 'picked_up' },
  picked_up: { label: 'Mark Delivered',  next: 'delivered'  },
};

export default function RiderDashboard() {
  const [available,    setAvailable]    = useState([]);
  const [myOrders,     setMyOrders]     = useState([]);
  const [profile,      setProfile]      = useState(null);
  const [isAvailable,  setIsAvailable]  = useState(false);
  const [tab,          setTab]          = useState('available');
  const [loading,      setLoading]      = useState(false);
  const locationRef = useRef(null);
  const { user, logoutUser } = useAuth();

  // Fetch data
  const refresh = async () => {
    try {
      const [avail, mine, prof] = await Promise.all([
        getAvailableOrders(),
        api.get('/orders/rider/'),
        api.get('/riders/profile/'),
      ]);
      setAvailable(avail.data);
      setMyOrders(mine.data);
      setProfile(prof.data);
      setIsAvailable(prof.data.is_available);
    } catch {}
  };

  useEffect(() => { refresh(); }, []);

  // Toggle availability
  const toggleAvailability = async () => {
    const newVal = !isAvailable;
    try {
      await api.put('/riders/profile/', { is_available: newVal, vehicle_type: profile?.vehicle_type || 'motorcycle' });
      setIsAvailable(newVal);

      if (newVal) {
        startLocationPush();
      } else {
        stopLocationPush();
      }
    } catch {}
  };

  // Start pushing location every 5 seconds
  const startLocationPush = () => {
    if (locationRef.current) return;
    locationRef.current = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        const activeOrder = myOrders.find(o =>
          ['assigned', 'picked_up'].includes(o.status)
        );
        updateLocation({
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          order_id:  activeOrder?.id || null,
        }).catch(() => {});
      });
    }, 5000);
  };

  const stopLocationPush = () => {
    clearInterval(locationRef.current);
    locationRef.current = null;
  };

  useEffect(() => () => stopLocationPush(), []);

  const handleAccept = async (orderId) => {
    setLoading(true);
    try {
      await acceptOrder(orderId);
      await refresh();
      setTab('mine');
    } catch (err) {
      alert(err.response?.data?.error || 'Could not accept order.');
    } finally { setLoading(false); }
  };

  const handleReject = async (orderId) => {
    try {
      await rejectOrder(orderId);
      await refresh();
    } catch {}
  };

  const handleStatusUpdate = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      await refresh();
    } catch {}
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🏍️ Rider Panel</h2>
          <p style={styles.subtitle}>{user?.username}</p>
        </div>
        <div style={styles.headerRight}>
          {/* Availability toggle */}
          <div
            style={{ ...styles.toggle, background: isAvailable ? '#16a34a' : '#d1d5db' }}
            onClick={toggleAvailability}
          >
            <div style={{
              ...styles.toggleThumb,
              transform: isAvailable ? 'translateX(24px)' : 'translateX(0)',
            }}/>
          </div>
          <span style={styles.toggleLabel}>
            {isAvailable ? 'Online' : 'Offline'}
          </span>
          <button style={styles.logoutBtn} onClick={logoutUser}>Logout</button>
        </div>
      </div>

      {/* Location notice */}
      {isAvailable && (
        <div style={styles.notice}>
          📍 Location sharing active — updating every 5 seconds
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {['available', 'mine'].map(t => (
          <button
            key={t}
            style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
            onClick={() => setTab(t)}
          >
            {t === 'available'
              ? `Available (${available.length})`
              : `My Orders (${myOrders.length})`
            }
          </button>
        ))}
      </div>

      {/* Available orders */}
      {tab === 'available' && (
        <div>
          {available.length === 0 ? (
            <div style={styles.empty}>No available orders right now.</div>
          ) : (
            available.map(order => (
              <div key={order.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <span style={styles.orderId}>Order #{order.id}</span>
                  <span style={styles.amount}>
                    KES {parseFloat(order.total_amount).toLocaleString()}
                  </span>
                </div>
                <p style={styles.address}>📍 {order.delivery_address}</p>
                <p style={styles.address}>🏪 {order.pickup_address}</p>
                <div style={styles.items}>
                  {order.items.map((item, i) => (
                    <span key={i}>{item.quantity}× {item.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                  ))}
                </div>
                <div style={styles.cardActions}>
                  <button
                    style={styles.acceptBtn}
                    onClick={() => handleAccept(order.id)}
                    disabled={loading}
                  >
                    ✓ Accept
                  </button>
                  <button
                    style={styles.rejectBtn}
                    onClick={() => handleReject(order.id)}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* My orders */}
      {tab === 'mine' && (
        <div>
          {myOrders.length === 0 ? (
            <div style={styles.empty}>No orders assigned to you.</div>
          ) : (
            myOrders.map(order => {
              const nextAction = STATUS_NEXT[order.status];
              return (
                <div key={order.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <span style={styles.orderId}>Order #{order.id}</span>
                    <span style={styles.statusBadge}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={styles.address}>📍 {order.delivery_address}</p>
                  <p style={styles.address}>👤 {order.customer?.username}</p>
                  <p style={styles.address}>📞 {order.customer?.phone_number}</p>
                  {nextAction && (
                    <button
                      style={styles.actionBtn}
                      onClick={() => handleStatusUpdate(order.id, nextAction.next)}
                    >
                      {nextAction.label}
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <div style={styles.delivered}>✅ Delivered</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container:    { maxWidth:640, margin:'0 auto', padding:'24px 16px', fontFamily:'sans-serif' },
  header:       { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
  title:        { fontSize:22, fontWeight:700, margin:0 },
  subtitle:     { fontSize:14, color:'#6b7280', margin:'4px 0 0' },
  headerRight:  { display:'flex', gap:8, alignItems:'center' },
  toggle:       { width:48, height:24, borderRadius:12, cursor:'pointer', position:'relative', transition:'background 0.2s' },
  toggleThumb:  { position:'absolute', top:2, left:2, width:20, height:20, borderRadius:10, background:'#fff', transition:'transform 0.2s' },
  toggleLabel:  { fontSize:13, color:'#374151', fontWeight:500 },
  logoutBtn:    { padding:'6px 12px', background:'#f3f4f6', border:'none', borderRadius:8, cursor:'pointer' },
  notice:       { background:'#f0fdf4', color:'#15803d', padding:10, borderRadius:8, marginBottom:16, fontSize:13 },
  tabs:         { display:'flex', gap:8, marginBottom:16 },
  tab:          { flex:1, padding:'10px', border:'1px solid #e5e7eb', borderRadius:8, background:'#f9fafb', cursor:'pointer', fontWeight:500 },
  tabActive:    { background:'#16a34a', color:'#fff', border:'1px solid #16a34a' },
  empty:        { textAlign:'center', color:'#9ca3af', padding:48 },
  card:         { background:'#fff', borderRadius:12, padding:20, marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  cardTop:      { display:'flex', justifyContent:'space-between', marginBottom:8 },
  orderId:      { fontWeight:700, fontSize:16 },
  amount:       { fontWeight:700, color:'#16a34a', fontSize:16 },
  address:      { fontSize:14, color:'#374151', margin:'4px 0' },
  items:        { fontSize:13, color:'#6b7280', margin:'8px 0' },
  cardActions:  { display:'flex', gap:8, marginTop:12 },
  acceptBtn:    { flex:1, padding:10, background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' },
  rejectBtn:    { flex:1, padding:10, background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' },
  actionBtn:    { width:'100%', padding:10, background:'#f97316', color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', marginTop:8 },
  statusBadge:  { background:'#f3f4f6', padding:'4px 10px', borderRadius:12, fontSize:12, fontWeight:600, textTransform:'capitalize' },
  delivered:    { color:'#16a34a', fontWeight:600, textAlign:'center', padding:8 },
};