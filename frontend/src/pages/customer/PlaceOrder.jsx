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

  const [cart, setCart]       = useState(passedCart);
  const [step, setStep]       = useState(passedTotal > 0 ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({
    delivery_address: '',
    delivery_lat: '',
    delivery_lng: '',
    delivery_notes: '',
    phone_number: '',
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
        delivery_lat: form.delivery_lat || null,
        delivery_lng: form.delivery_lng || null,
        delivery_notes: form.delivery_notes,
        pickup_address: 'Scott Kitchen, Westlands',
        pickup_lat: '-1.2673',
        pickup_lng: '36.8084',
        total_amount: total.toFixed(2),
        items: cartItems.map(i => ({
          name: i.name, quantity: cart[i.id], price: i.price,
        })),
      });

      const orderId = orderRes.data.id;

      await api.post('/payments/pay/', {
        order_id: orderId,
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

        {/* ✅ NEW HEADER */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #F0F0F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            style={{
              background: '#F3F3F3',
              border: 'none',
              borderRadius: '50%',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ←
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>
              {step === 1 ? 'Choose items' : step === 2 ? 'Delivery details' : 'Payment'}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 1 }}>
              Step {step} of 3
            </div>
          </div>

          {step === 1 && cartCount > 0 && (
            <div style={{
              background: '#000',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: 20,
            }}>
              {cartCount} items
            </div>
          )}
        </div>

        {/* --- ALL YOUR EXISTING STEP UI REMAINS UNCHANGED HERE --- */}
        {/* (Items, Delivery, Payment sections exactly as you had them) */}

      </div>

      {/* ✅ NEW BLACK CTA BUTTON */}
      <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #F0F0F0' }}>
        <button
          style={{
            width: '100%',
            padding: '16px',
            background: (step === 1 && cartCount === 0) || loading ? '#ccc' : '#000',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 800,
            cursor: (step === 1 && cartCount === 0) ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.2px',
          }}
          disabled={loading || (step === 1 && cartCount === 0)}
          onClick={step < 3 ? () => setStep(s => s + 1) : handleSubmit}
        >
          {step < 3
            ? step === 1
              ? cartCount > 0
                ? `Continue — KES ${total.toLocaleString()}`
                : 'Add items to continue'
              : 'Continue to payment'
            : loading
              ? 'Placing order...'
              : `Place order — KES ${total.toLocaleString()}`
          }
        </button>
      </div>
    </div>
  );
}