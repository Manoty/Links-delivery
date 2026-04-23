import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeOrder } from '../../api/orders';
import api from '../../api/axios';

const MENU_ITEMS = [
  { name: 'Chicken Burger',   price: 650 },
  { name: 'Beef Burger',      price: 700 },
  { name: 'Fries (Large)',    price: 250 },
  { name: 'Soda 500ml',       price: 150 },
  { name: 'Chicken Wings x6', price: 850 },
  { name: 'Milkshake',        price: 350 },
];

export default function PlaceOrder() {
  const [quantities, setQuantities] = useState(
    Object.fromEntries(MENU_ITEMS.map((_, i) => [i, 0]))
  );
  const [delivery, setDelivery] = useState({
    address: '', lat: '', lng: '', notes: '',
  });
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const navigate = useNavigate();

  const updateQty = (i, delta) =>
    setQuantities(q => ({ ...q, [i]: Math.max(0, (q[i] || 0) + delta) }));

  const selectedItems = MENU_ITEMS
    .map((item, i) => ({ ...item, quantity: quantities[i] }))
    .filter(item => item.quantity > 0);

  const total = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  const handleSubmit = async e => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError('Add at least one item.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Place the order
      const orderRes = await placeOrder({
        delivery_address: delivery.address,
        delivery_lat:     delivery.lat   || null,
        delivery_lng:     delivery.lng   || null,
        delivery_notes:   delivery.notes,
        pickup_address:   'Scott Kitchen, Westlands',
        pickup_lat:       '-1.2673',
        pickup_lng:       '36.8084',
        total_amount:     total.toFixed(2),
        items: selectedItems.map(i => ({
          name: i.name, quantity: i.quantity, price: i.price,
        })),
      });

      const orderId = orderRes.data.id;

      // 2. Immediately trigger M-Pesa STK push
      await api.post('/payments/pay/', {
        order_id:     orderId,
        phone_number: phone,
      });

      navigate(`/orders/${orderId}/track`, {
        state: { justOrdered: true }
      });

    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'object'
          ? Object.values(data).flat().join(' ')
          : 'Order failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🍔 Place Order</h2>
        <span style={styles.total}>KES {total.toLocaleString()}</span>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Menu */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Select Items</h3>
        {MENU_ITEMS.map((item, i) => (
          <div key={i} style={styles.menuItem}>
            <div>
              <div style={styles.itemName}>{item.name}</div>
              <div style={styles.itemPrice}>KES {item.price}</div>
            </div>
            <div style={styles.qtyControls}>
              <button style={styles.qtyBtn} onClick={() => updateQty(i, -1)}>−</button>
              <span style={styles.qty}>{quantities[i]}</span>
              <button style={styles.qtyBtn} onClick={() => updateQty(i, +1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery details */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Delivery Details</h3>
        <label style={styles.label}>Delivery Address *</label>
        <input
          style={styles.input}
          placeholder="e.g. Westlands, Nairobi"
          value={delivery.address}
          onChange={e => setDelivery({ ...delivery, address: e.target.value })}
          required
        />
        <div style={styles.row}>
          <div style={styles.half}>
            <label style={styles.label}>Latitude (optional)</label>
            <input
              style={styles.input}
              placeholder="-1.2864"
              value={delivery.lat}
              onChange={e => setDelivery({ ...delivery, lat: e.target.value })}
            />
          </div>
          <div style={styles.half}>
            <label style={styles.label}>Longitude (optional)</label>
            <input
              style={styles.input}
              placeholder="36.8172"
              value={delivery.lng}
              onChange={e => setDelivery({ ...delivery, lng: e.target.value })}
            />
          </div>
        </div>
        <label style={styles.label}>Delivery Notes</label>
        <textarea
          style={{ ...styles.input, height: 72, resize: 'vertical' }}
          placeholder="Gate code, landmark, floor number..."
          value={delivery.notes}
          onChange={e => setDelivery({ ...delivery, notes: e.target.value })}
        />
      </div>

      {/* Payment */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>M-Pesa Payment</h3>
        <label style={styles.label}>M-Pesa Phone Number *</label>
        <input
          style={styles.input}
          type="tel"
          placeholder="0712345678"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
        />
        <div style={styles.mpesaNote}>
          📱 You will receive an M-Pesa prompt after placing the order
        </div>
      </div>

      {/* Order summary */}
      {selectedItems.length > 0 && (
        <div style={styles.summary}>
          <h3 style={styles.sectionTitle}>Order Summary</h3>
          {selectedItems.map((item, i) => (
            <div key={i} style={styles.summaryRow}>
              <span>{item.quantity}× {item.name}</span>
              <span>KES {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div style={styles.summaryTotal}>
            <span>Total</span>
            <span>KES {total.toLocaleString()}</span>
          </div>
        </div>
      )}

      <button
        style={{
          ...styles.submitBtn,
          opacity: loading ? 0.7 : 1,
        }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Placing order...' : `Place Order — KES ${total.toLocaleString()}`}
      </button>
    </div>
  );
}

const styles = {
  container:    { maxWidth:640, margin:'0 auto', padding:'24px 16px', fontFamily:'sans-serif', paddingBottom:100 },
  header:       { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  title:        { fontSize:22, fontWeight:700, margin:0 },
  total:        { fontSize:20, fontWeight:700, color:'#16a34a' },
  error:        { background:'#fee2e2', color:'#dc2626', padding:12, borderRadius:8, marginBottom:16 },
  section:      { background:'#fff', borderRadius:12, padding:20, marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize:16, fontWeight:600, margin:'0 0 16px', color:'#111827' },
  menuItem:     { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f3f4f6' },
  itemName:     { fontWeight:500 },
  itemPrice:    { fontSize:13, color:'#6b7280', marginTop:2 },
  qtyControls:  { display:'flex', alignItems:'center', gap:12 },
  qtyBtn:       { width:32, height:32, borderRadius:8, border:'1px solid #d1d5db', background:'#f9fafb', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' },
  qty:          { width:24, textAlign:'center', fontWeight:600 },
  label:        { display:'block', fontSize:14, fontWeight:500, color:'#374151', marginBottom:6 },
  input:        { width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, marginBottom:12, boxSizing:'border-box' },
  row:          { display:'flex', gap:12 },
  half:         { flex:1 },
  mpesaNote:    { background:'#f0fdf4', color:'#15803d', padding:10, borderRadius:8, fontSize:13 },
  summary:      { background:'#fff', borderRadius:12, padding:20, marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  summaryRow:   { display:'flex', justifyContent:'space-between', padding:'6px 0', color:'#374151' },
  summaryTotal: { display:'flex', justifyContent:'space-between', padding:'12px 0 0', fontWeight:700, fontSize:16, borderTop:'1px solid #e5e7eb', marginTop:8 },
  submitBtn:    { width:'100%', padding:16, background:'#16a34a', color:'#fff', border:'none', borderRadius:12, fontSize:17, fontWeight:700, cursor:'pointer' },
};