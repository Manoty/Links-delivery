import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { placeOrder } from '../../api/orders';
import api from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import '../../styles/app.css';

export default function PlaceOrder() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const toast     = useToast();

  const passedCart  = location.state?.cart || {};
  const passedTotal = location.state?.cartTotal || 0;

  const MENU = [
    { id: 1, name: 'Chicken Burger',   price: 650, emoji: '🍔' },
    { id: 2, name: 'Beef Burger',      price: 700, emoji: '🍔' },
    { id: 3, name: 'Chicken Wings x6', price: 850, emoji: '🍗' },
    { id: 4, name: 'Streetwise Two',   price: 750, emoji: '🍗' },
    { id: 5, name: 'Fries Large',      price: 250, emoji: '🍟' },
    { id: 6, name: 'Pepsi 500ml',      price: 150, emoji: '🥤' },
    { id: 7, name: 'Milkshake',        price: 350, emoji: '🥛' },
    { id: 8, name: 'Onion Rings',      price: 200, emoji: '🧅' },
  ];

  const [cart,    setCart]    = useState(passedCart);
  const [step,    setStep]    = useState(passedTotal > 0 ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({
    delivery_address: '',
    delivery_lat:     '',
    delivery_lng:     '',
    delivery_notes:   '',
    phone_number:     '',
  });

  const updateCart = (id, delta) => {
    setCart(c => {
      const next = { ...c, [id]: Math.max(0, (c[id] || 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const cartItems = MENU.filter(i => cart[i.id] > 0);
  const total     = cartItems.reduce((s, i) => s + cart[i.id] * i.price, 0);
  const cartCount = cartItems.reduce((s, i) => s + cart[i.id], 0);

  const handleSubmit = async () => {
    if (!form.delivery_address) return toast.error('Enter your delivery address.');
    if (!form.phone_number)     return toast.error('Enter your M-Pesa number.');
    if (cartCount === 0)        return toast.error('Your cart is empty.');

    setLoading(true);
    try {
      const orderRes = await placeOrder({
        delivery_address: form.delivery_address,
        delivery_lat:     form.delivery_lat || null,
        delivery_lng:     form.delivery_lng || null,
        delivery_notes:   form.delivery_notes,
        pickup_address:   'Scott Kitchen, Westlands',
        pickup_lat:       '-1.2673',
        pickup_lng:       '36.8084',
        total_amount:     total.toFixed(2),
        items: cartItems.map(i => ({
          name: i.name, quantity: cart[i.id], price: i.price,
        })),
      });

      const orderId = orderRes.data.id;

      await api.post('/payments/pay/', {
        order_id:     orderId,
        phone_number: form.phone_number,
      });

      toast.success('Order placed! Check your phone for M-Pesa prompt.');
      navigate(`/orders/${orderId}/track`);
    } catch (err) {
      const d = err.response?.data;
      toast.error(
        typeof d === 'string' ? d :
        Object.values(d || {}).flat().join(' ') || 'Order failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="screen-content">

        {/* Header */}
        <div style={{
          background: '#fff',
          borderBottom: '0.5px solid var(--gray-200)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-900)' }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {step === 1 ? 'Choose items' : step === 2 ? 'Delivery details' : 'Payment'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>
              Step {step} of 3
            </div>
          </div>
          {step === 1 && cartCount > 0 && (
            <div style={{
              background: 'var(--green-50)',
              color: 'var(--green-600)',
              fontSize: 12,
              fontWeight: 500,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
            }}>
              {cartCount} items
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', padding: '10px 16px', gap: 6 }}>
          {[1, 2, 3].map(s => (
            <div
              key={s}
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: s <= step ? 'var(--green-700)' : 'var(--gray-200)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Step 1 — Items */}
        {step === 1 && (
          <div style={{ padding: '8px 0' }}>
            {MENU.map(item => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  style={{
                    margin: '0 16px 8px',
                    background: '#fff',
                    border: qty > 0 ? '1.5px solid var(--green-700)' : '0.5px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ fontSize: 28, width: 44, textAlign: 'center' }}>{item.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--green-700)', fontWeight: 600, marginTop: 2 }}>
                      KES {item.price}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {qty > 0 && (
                      <button
                        onClick={() => updateCart(item.id, -1)}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '0.5px solid var(--gray-200)', background: '#fff', fontSize: 16, cursor: 'pointer' }}
                      >
                        −
                      </button>
                    )}
                    {qty > 0 && (
                      <span style={{ fontSize: 14, fontWeight: 600, minWidth: 16, textAlign: 'center' }}>
                        {qty}
                      </span>
                    )}
                    <button
                      onClick={() => updateCart(item.id, 1)}
                      style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'var(--green-700)', border: 'none',
                        color: '#fff', fontSize: 18, cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 2 — Delivery */}
        {step === 2 && (
          <div style={{ padding: '16px' }}>
            {/* Cart summary */}
            <div style={{ background: 'var(--green-50)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--green-600)', marginBottom: 8 }}>
                Your order
              </div>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--green-600)', marginBottom: 4 }}>
                  <span>{item.emoji} {cart[item.id]}× {item.name}</span>
                  <span>KES {(cart[item.id] * item.price).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: '0.5px solid var(--green-100)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: 'var(--green-700)' }}>
                <span>Total</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Delivery address *</label>
              <input
                className="input-field"
                placeholder="e.g. Westlands, Nairobi"
                value={form.delivery_address}
                onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label className="input-label">Latitude (opt.)</label>
                <input className="input-field" placeholder="-1.2864"
                  value={form.delivery_lat}
                  onChange={e => setForm(f => ({ ...f, delivery_lat: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Longitude (opt.)</label>
                <input className="input-field" placeholder="36.8172"
                  value={form.delivery_lng}
                  onChange={e => setForm(f => ({ ...f, delivery_lng: e.target.value }))} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Delivery notes</label>
              <textarea
                className="input-field"
                style={{ height: 80, resize: 'none' }}
                placeholder="Gate code, landmark, floor number..."
                value={form.delivery_notes}
                onChange={e => setForm(f => ({ ...f, delivery_notes: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* Step 3 — Payment */}
        {step === 3 && (
          <div style={{ padding: '16px' }}>
            <div style={{
              background: '#fff',
              border: '0.5px solid var(--gray-200)',
              borderRadius: 'var(--radius-xl)',
              padding: '20px 16px',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ fontSize: 28 }}>📱</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>M-Pesa payment</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>
                    You'll receive a PIN prompt on your phone
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">M-Pesa phone number *</label>
                <input
                  className="input-field"
                  type="tel"
                  placeholder="0712 345 678"
                  value={form.phone_number}
                  onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                />
              </div>
            </div>

            {/* Final summary */}
            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Order summary</div>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
                  <span>{cart[item.id]}× {item.name}</span>
                  <span>KES {(cart[item.id] * item.price).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: '0.5px solid var(--gray-200)', marginTop: 10, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>
                  <span>Delivery fee</span><span>KES 0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--green-700)' }}>KES {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--amber-50)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--amber-800)' }}>
              ⚡ Once you tap "Place order", an M-Pesa STK push will be sent to your phone. Enter your PIN to complete payment.
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{ padding: '12px 16px', background: '#fff', borderTop: '0.5px solid var(--gray-200)' }}>
        {step < 3 ? (
          <button
            className="btn-primary"
            disabled={step === 1 && cartCount === 0}
            onClick={() => {
              if (step === 1 && cartCount === 0) return;
              setStep(s => s + 1);
            }}
          >
            {step === 1
              ? cartCount > 0 ? `Continue — KES ${total.toLocaleString()}` : 'Add items to continue'
              : 'Continue to payment'
            }
          </button>
        ) : (
          <button
            className="btn-primary"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Placing order...' : `Place order — KES ${total.toLocaleString()}`}
          </button>
        )}
      </div>
    </div>
  );
}