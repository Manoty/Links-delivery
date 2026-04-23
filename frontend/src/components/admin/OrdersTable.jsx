import { useState } from 'react';
import { assignRider, autoDispatch } from '../../api/orders';
import api from '../../api/axios';

const STATUS_CLASS = {
  pending:   'pill-pending',
  paid:      'pill-paid',
  assigned:  'pill-assigned',
  picked_up: 'pill-picked_up',
  delivered: 'pill-delivered',
  cancelled: 'pill-cancelled',
};

export default function OrdersTable({ orders, onRefresh }) {
  const [assigning,   setAssigning]   = useState(null);
  const [riderId,     setRiderId]     = useState('');
  const [dispatching, setDispatching] = useState(null);

  const handleAssign = async (orderId) => {
    if (!riderId) return;
    try {
      await assignRider(orderId, parseInt(riderId));
      setAssigning(null);
      setRiderId('');
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Assignment failed.');
    }
  };

  const handleAutoDispatch = async (orderId) => {
    setDispatching(orderId);
    try {
      const res = await autoDispatch(orderId);
      alert(`Dispatched to ${res.data.rider_name} (${res.data.distance_km}km away)`);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.reason || 'No riders available.');
    } finally {
      setDispatching(null);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/admin/${orderId}/status/`, { status: newStatus });
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed.');
    }
  };

  return (
    <table className="orders-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Amount</th>
          <th>Rider</th>
          <th>Status</th>
          <th>Time</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.id}>
            <td style={{ fontWeight: 500 }}>#{order.id}</td>
            <td>
              <div style={{ fontWeight: 500 }}>{order.customer?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                {order.customer?.phone_number}
              </div>
            </td>
            <td>
              <div style={{ fontSize: 12 }}>
                {order.items?.map(i => `${i.quantity}× ${i.name}`).join(', ')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                {order.delivery_address}
              </div>
            </td>
            <td style={{ fontWeight: 500 }}>
              KES {parseFloat(order.total_amount).toLocaleString()}
            </td>
            <td>
              {order.rider ? (
                <div>
                  <div style={{ fontWeight: 500 }}>{order.rider.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    {order.rider.phone_number}
                  </div>
                </div>
              ) : (
                <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>Unassigned</span>
              )}
            </td>
            <td>
              <span className={`pill ${STATUS_CLASS[order.status]}`}>
                {order.status.replace('_', ' ')}
              </span>
            </td>
            <td style={{ fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
              {new Date(order.created_at).toLocaleTimeString('en-KE', {
                hour: '2-digit', minute: '2-digit'
              })}
            </td>
            <td>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {order.status === 'paid' && (
                  <>
                    <button
                      className="btn btn-green"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                      disabled={dispatching === order.id}
                      onClick={() => handleAutoDispatch(order.id)}
                    >
                      {dispatching === order.id ? '...' : '🚀 Auto'}
                    </button>
                    {assigning === order.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input
                          style={{ width: 60, padding: '3px 6px', border: '0.5px solid var(--gray-200)', borderRadius: 6, fontSize: 12 }}
                          type="number"
                          placeholder="ID"
                          value={riderId}
                          onChange={e => setRiderId(e.target.value)}
                        />
                        <button className="btn btn-green" style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => handleAssign(order.id)}>✓</button>
                        <button className="btn" style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => setAssigning(null)}>✕</button>
                      </div>
                    ) : (
                      <button className="btn" style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => setAssigning(order.id)}>Manual</button>
                    )}
                  </>
                )}

                {!['delivered', 'cancelled'].includes(order.status) && (
                  <select
                    style={{ padding: '4px 8px', border: '0.5px solid var(--gray-200)', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: '#fff' }}
                    defaultValue=""
                    onChange={e => { if (e.target.value) handleStatusChange(order.id, e.target.value); }}
                  >
                    <option value="" disabled>Move to...</option>
                    {['pending','paid','assigned','picked_up','delivered','cancelled']
                      .filter(s => s !== order.status)
                      .map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))
                    }
                  </select>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}