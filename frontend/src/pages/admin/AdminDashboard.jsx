import { useState, useEffect } from 'react';
import { getAllOrders, assignRider } from '../../api/orders';
import { getLiveRiders } from '../../api/tracking';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const STATUS_COLORS = {
  pending:'#f59e0b',
  paid:'#3b82f6',
  assigned:'#8b5cf6',
  picked_up:'#f97316',
  delivered:'#16a34a',
  cancelled:'#ef4444',
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [liveRiders, setLiveRiders] = useState([]);
  const [filter, setFilter] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [riderId, setRiderId] = useState('');
  const [loading, setLoading] = useState(true);

  const { user, logoutUser } = useAuth();

  // ---------------- REFRESH ----------------
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
    } catch (err) {
      console.error('Refresh error:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [filter]);

  useEffect(() => {
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  // ---------------- MANUAL ASSIGN ----------------
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

  // ---------------- AUTO DISPATCH (NEW) ----------------
  const handleAutoDispatch = async (orderId) => {
    try {
      const res = await api.post(`/riders/dispatch/${orderId}/`);

      alert(
        `Dispatched to ${res.data.rider_name} (${res.data.distance_km} km)`
      );

      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Auto dispatch failed.');
    }
  };

  // ---------------- STATUS UPDATE ----------------
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/admin/${orderId}/status/`, {
        status: newStatus,
      });

      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Status update failed.');
    }
  };

  const STATUSES = [
    '',
    'pending',
    'paid',
    'assigned',
    'picked_up',
    'delivered',
    'cancelled',
  ];

  // ---------------- UI ----------------
  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>⚙️ Admin Dashboard</h2>
          <p style={styles.subtitle}>{user?.username}</p>
        </div>
        <button style={styles.logoutBtn} onClick={logoutUser}>
          Logout
        </button>
      </div>

      {/* STATS */}
      <div style={styles.stats}>
        {[
          { label:'Total Orders', value: orders.length },
          { label:'Live Riders', value: liveRiders.length },
          { label:'Pending', value: orders.filter(o => o.status === 'pending').length },
          { label:'Active', value: orders.filter(o =>
              ['assigned','picked_up'].includes(o.status)
            ).length
          },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={styles.statValue}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* LIVE RIDERS */}
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

      {/* FILTER */}
      <div style={styles.filterRow}>
        <h3 style={styles.sectionTitle}>📋 Orders</h3>

        <select
          style={styles.select}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {s ? s.replace('_',' ') : 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      {/* ORDERS */}
      {loading ? (
        <div style={styles.empty}>Loading...</div>
      ) : orders.length === 0 ? (
        <div style={styles.empty}>No orders found.</div>
      ) : (
        orders.map(order => (
          <div key={order.id} style={styles.card}>

            {/* TOP */}
            <div style={styles.cardTop}>
              <div>
                <span style={styles.orderId}>Order #{order.id}</span>
                <span
                  style={{
                    ...styles.badge,
                    background: STATUS_COLORS[order.status],
                  }}
                >
                  {order.status.replace('_',' ')}
                </span>
              </div>

              <span style={styles.amount}>
                KES {parseFloat(order.total_amount).toLocaleString()}
              </span>
            </div>

            {/* DETAILS */}
            <div style={styles.cardDetails}>
              <p style={styles.detail}>
                👤 {order.customer?.username} · {order.customer?.phone_number}
              </p>

              <p style={styles.detail}>
                📍 {order.delivery_address}
              </p>

              {order.rider && (
                <p style={styles.detail}>
                  🏍️ {order.rider.username} · {order.rider.phone_number}
                </p>
              )}
            </div>

            {/* ITEMS */}
            <div style={styles.itemsList}>
              {order.items?.map((item, i) => (
                <span key={i} style={styles.itemTag}>
                  {item.quantity}× {item.name}
                </span>
              ))}
            </div>

            {/* ACTIONS */}
            <div style={styles.actions}>

              {/* AUTO DISPATCH */}
              {['paid'].includes(order.status) && (
                <button
                  style={{
                    ...styles.assignBtn,
                    background:'#dbeafe',
                    color:'#1d4ed8',
                  }}
                  onClick={() => handleAutoDispatch(order.id)}
                >
                  Auto Dispatch
                </button>
              )}

              {/* MANUAL ASSIGN */}
              {['pending','paid'].includes(order.status) && (
                assigning === order.id ? (
                  <div style={styles.assignBox}>
                    <input
                      style={styles.assignInput}
                      type="number"
                      placeholder="Rider ID"
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
                      onClick={() => {
                        setAssigning(null);
                        setRiderId('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    style={styles.assignBtn}
                    onClick={() => setAssigning(order.id)}
                  >
                    Manual Assign
                  </button>
                )
              )}

              {/* STATUS */}
              {!['delivered','cancelled'].includes(order.status) && (
                <select
                  style={styles.statusSelect}
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value)
                      handleStatusChange(order.id, e.target.value);
                  }}
                >
                  <option value="" disabled>
                    Update status...
                  </option>

                  {STATUSES
                    .filter(s => s && s !== order.status)
                    .map(s => (
                      <option key={s} value={s}>
                        {s.replace('_',' ')}
                      </option>
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