import { useState, useEffect } from 'react';
import { getAllOrders, assignRider } from '../../api/orders';
import { getLiveRiders } from '../../api/tracking';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const STATUS_COLORS = {
  pending:'#f59e0b', paid:'#3b82f6', assigned:'#8b5cf6',
  picked_up:'#f97316', delivered:'#16a34a', cancelled:'#ef4444',
};

export default function AdminDashboard() {
  const [orders,      setOrders]      = useState([]);
  const [riders,      setRiders]      = useState([]);
  const [liveRiders,  setLiveRiders]  = useState([]);
  const [filter,      setFilter]      = useState('');
  const [assigning,   setAssigning]   = useState(null);
  const [riderId,     setRiderId]     = useState('');
  const [loading,     setLoading]     = useState(true);
  const { user, logoutUser } = useAuth();

  const refresh = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const [ordersRes, ridersRes, liveRes] = await Promise.all([
        getAllOrders(params),
        api.get('/riders/active/'),
        getLiveRiders(),
      ]);
      setOrders(ordersRes.data);
      setRiders(ridersRes.data);
      setLiveRiders(liveRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [filter]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleAssign = async (orderId) => {
    if (!riderId) return alert('Enter a rider ID.');
    try {
      await assignRider(orderId, parseInt(riderId));
      setAssigning(null);
      setRiderId('');
      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Assignment failed.');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/admin/${orderId}/status/`, { status: newStatus });
      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Status update failed.');
    }
  };

  const STATUSES = ['', 'pending', 'paid', 'assigned', 'picked_up', 'delivered', 'cancelled'];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>⚙️ Admin Dashboard</h2>
          <p style={styles.subtitle}>{user?.username}</p>
        </div>
        <button style={styles.logoutBtn} onClick={logoutUser}>Logout</button>
      </div>

      {/* Stats bar */}
      <div style={styles.stats}>
        {[
          { label:'Total Orders',   value: orders.length },
          { label:'Live Riders',    value: liveRiders.length },
          { label:'Pending',        value: orders.filter(o => o.status === 'pending').length },
          { label:'Active',         value: orders.filter(o => ['assigned','picked_up'].includes(o.status)).length },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={styles.statValue}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Live riders */}
      {liveRiders.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🟢 Live Riders</h3>
          <div style={styles.riderGrid}>
            {liveRiders.map(r => (
              <div key={r.rider_id} style={styles.riderChip}>
                <span>🏍️ {r.rider_name}</span>
                <span style={styles.riderOrder}>
                  {r.active_order_id ? `Order #${r.active_order_id}` : 'Idle'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={styles.filterRow}>
        <h3 style={styles.sectionTitle}>📋 Orders</h3>
        <select
          style={styles.select}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {s ? s.replace('_', ' ') : 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      {/* Orders table */}
      {loading ? (
        <div style={styles.empty}>Loading...</div>
      ) : orders.length === 0 ? (
        <div style={styles.empty}>No orders found.</div>
      ) : (
        orders.map(order => (
          <div key={order.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div>
                <span style={styles.orderId}>Order #{order.id}</span>
                <span style={{ ...styles.badge, background: STATUS_COLORS[order.status] }}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <span style={styles.amount}>
                KES {parseFloat(order.total_amount).toLocaleString()}
              </span>
            </div>

            <div style={styles.cardDetails}>
              <p style={styles.detail}>👤 {order.customer?.username} · {order.customer?.phone_number}</p>
              <p style={styles.detail}>📍 {order.delivery_address}</p>
              {order.rider && (
                <p style={styles.detail}>🏍️ {order.rider.username} · {order.rider.phone_number}</p>
              )}
            </div>

            {/* Items */}
            <div style={styles.itemsList}>
              {order.items?.map((item, i) => (
                <span key={i} style={styles.itemTag}>
                  {item.quantity}× {item.name}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div style={styles.actions}>
              {/* Assign rider */}
              {['pending', 'paid'].includes(order.status) && (
                assigning === order.id ? (
                  <div style={styles.assignBox}>
                    <input
                      style={styles.assignInput}
                      type="number"
                      placeholder="Rider user ID"
                      value={riderId}
                      onChange={e => setRiderId(e.target.value)}
                    />
                    <button
                      style={styles.confirmBtn}
                      onClick={() => handleAssign(order.id)}
                    >
                      Confirm
                    </button>
                    <button
                      style={styles.cancelBtn}
                      onClick={() => { setAssigning(null); setRiderId(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    style={styles.assignBtn}
                    onClick={() => setAssigning(order.id)}
                  >
                    Assign Rider
                  </button>
                )
              )}

              {/* Status update */}
              {!['delivered', 'cancelled'].includes(order.status) && (
                <select
                  style={styles.statusSelect}
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) handleStatusChange(order.id, e.target.value);
                  }}
                >
                  <option value="" disabled>Update status...</option>
                  {STATUSES.filter(s => s && s !== order.status).map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container:    { maxWidth:800, margin:'0 auto', padding:'24px 16px', fontFamily:'sans-serif' },
  header:       { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  title:        { fontSize:22, fontWeight:700, margin:0 },
  subtitle:     { fontSize:14, color:'#6b7280' },
  logoutBtn:    { padding:'8px 16px', background:'#f3f4f6', border:'none', borderRadius:8, cursor:'pointer' },
  stats:        { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 },
  statCard:     { background:'#fff', borderRadius:12, padding:16, textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  statValue:    { fontSize:28, fontWeight:800, color:'#111827' },
  statLabel:    { fontSize:12, color:'#6b7280', marginTop:4 },
  section:      { background:'#fff', borderRadius:12, padding:16, marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize:15, fontWeight:600, margin:'0 0 12px' },
  riderGrid:    { display:'flex', flexWrap:'wrap', gap:8 },
  riderChip:    { background:'#f0fdf4', borderRadius:8, padding:'8px 14px', fontSize:13, display:'flex', flexDirection:'column', gap:2 },
  riderOrder:   { fontSize:11, color:'#6b7280' },
  filterRow:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  select:       { padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14 },
  empty:        { textAlign:'center', color:'#9ca3af', padding:48 },
  card:         { background:'#fff', borderRadius:12, padding:20, marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  cardTop:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  orderId:      { fontWeight:700, fontSize:16, marginRight:8 },
  badge:        { color:'#fff', padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:600, textTransform:'capitalize' },
  amount:       { fontWeight:700, color:'#16a34a' },
  cardDetails:  { marginBottom:8 },
  detail:       { fontSize:14, color:'#374151', margin:'2px 0' },
  itemsList:    { display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 },
  itemTag:      { background:'#f3f4f6', padding:'4px 10px', borderRadius:6, fontSize:12 },
  actions:      { display:'flex', gap:8, flexWrap:'wrap' },
  assignBtn:    { padding:'8px 14px', background:'#eff6ff', color:'#1d4ed8', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13 },
  assignBox:    { display:'flex', gap:8, alignItems:'center' },
  assignInput:  { padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:8, width:120, fontSize:14 },
  confirmBtn:   { padding:'8px 12px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 },
  cancelBtn:    { padding:'8px 12px', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, cursor:'pointer' },
  statusSelect: { padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, cursor:'pointer' },
};