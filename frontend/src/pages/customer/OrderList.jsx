import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyOrders } from '../../api/orders';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  pending:   '#f59e0b',
  paid:      '#3b82f6',
  assigned:  '#8b5cf6',
  picked_up: '#f97316',
  delivered: '#16a34a',
  cancelled: '#ef4444',
};

export default function OrderList() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logoutUser }  = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getMyOrders()
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🛵 Scott Delivery</h2>
          <p style={styles.subtitle}>Welcome, {user?.username}</p>
        </div>
        <div style={styles.headerActions}>
          <button
            style={styles.newOrderBtn}
            onClick={() => navigate('/place-order')}
          >
            + New Order
          </button>
          <button style={styles.logoutBtn} onClick={logoutUser}>
            Logout
          </button>
        </div>
      </div>

      {/* Orders */}
      {loading ? (
        <div style={styles.empty}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={styles.empty}>
          <p>No orders yet.</p>
          <button
            style={styles.newOrderBtn}
            onClick={() => navigate('/place-order')}
          >
            Place your first order
          </button>
        </div>
      ) : (
        orders.map(order => (
          <div key={order.id} style={styles.card}>
            <div style={styles.cardTop}>
              <span style={styles.orderId}>Order #{order.id}</span>
              <span style={{
                ...styles.badge,
                background: STATUS_COLORS[order.status] || '#6b7280'
              }}>
                {order.status.replace('_', ' ')}
              </span>
            </div>

            <div style={styles.items}>
              {order.items.map((item, i) => (
                <span key={i} style={styles.item}>
                  {item.quantity}× {item.name}
                  {i < order.items.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>

            <div style={styles.cardBottom}>
              <span style={styles.amount}>
                KES {parseFloat(order.total_amount).toLocaleString()}
              </span>
              <div style={styles.cardActions}>
                {['assigned', 'picked_up'].includes(order.status) && (
                  <Link
                    to={`/orders/${order.id}/track`}
                    style={styles.trackBtn}
                  >
                    📍 Track
                  </Link>
                )}
                <span style={styles.date}>
                  {new Date(order.created_at).toLocaleDateString('en-KE', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container:     { maxWidth:640, margin:'0 auto', padding:'24px 16px', fontFamily:'sans-serif' },
  header:        { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 },
  title:         { fontSize:22, fontWeight:700, margin:0 },
  subtitle:      { fontSize:14, color:'#6b7280', margin:'4px 0 0' },
  headerActions: { display:'flex', gap:8, alignItems:'center' },
  newOrderBtn:   { padding:'8px 16px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 },
  logoutBtn:     { padding:'8px 12px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:8, cursor:'pointer', fontSize:14 },
  empty:         { textAlign:'center', color:'#6b7280', padding:60 },
  card:          { background:'#fff', borderRadius:12, padding:20, marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  cardTop:       { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  orderId:       { fontWeight:700, fontSize:16 },
  badge:         { color:'#fff', padding:'4px 10px', borderRadius:12, fontSize:12, fontWeight:600, textTransform:'capitalize' },
  items:         { fontSize:14, color:'#374151', marginBottom:12, lineHeight:1.5 },
  item:          { },
  cardBottom:    { display:'flex', justifyContent:'space-between', alignItems:'center' },
  amount:        { fontWeight:700, fontSize:16, color:'#111827' },
  cardActions:   { display:'flex', gap:12, alignItems:'center' },
  trackBtn:      { padding:'6px 14px', background:'#eff6ff', color:'#1d4ed8', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600 },
  date:          { fontSize:12, color:'#9ca3af' },
};