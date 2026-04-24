import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyOrders } from '../../api/orders';
import { useToast } from '../../components/shared/Toast';
import Navbar from '../../components/customer/Navbar';
import Hero from '../../components/customer/Hero';
import RestaurantCard from '../../components/customer/RestaurantCard';
import MenuCard from '../../components/customer/MenuCard';

const RESTAURANTS = [
  {
    id: 1, name: 'KFC Sarit Centre',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80',
    rating: '4.9', time: '20–30 min', delivery: 'Free delivery',
    badge: '⭐ 4.9 · Top rated', tags: ['Burgers', 'Chicken', 'Sides'],
  },
  {
    id: 2, name: 'Debonairs Pizza',
    image: 'https://images.unsplash.com/photo-1571066811602-716837d681de?w=600&q=80',
    rating: '4.7', time: '25–40 min', delivery: 'KES 50 delivery',
    badge: '🔥 Popular', tags: ['Pizza', 'Pasta', 'Sides'],
  },
  {
    id: 3, name: 'Galitos Chicken',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80',
    rating: '4.8', time: '15–25 min', delivery: 'Free delivery',
    badge: '🎁 20% off today', tags: ['Chicken', 'Grills', 'Sides'],
  },
  {
    id: 4, name: 'Burger Barn',
    image: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=600&q=80',
    rating: '4.6', time: '20–35 min', delivery: 'KES 30 delivery',
    badge: '⚡ Fast dispatch', tags: ['Burgers', 'Shakes'],
  },
];

const CATEGORIES = [
  { id: 'burgers',   label: 'Burgers',   image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70' },
  { id: 'pizza',     label: 'Pizza',     image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70' },
  { id: 'chicken',   label: 'Chicken',   image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=200&q=70' },
  { id: 'healthy',   label: 'Healthy',   image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=70' },
  { id: 'breakfast', label: 'Breakfast', image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=200&q=70' },
  { id: 'desserts',  label: 'Desserts',  image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&q=70' },
  { id: 'drinks',    label: 'Drinks',    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&q=70' },
];

const MENU_ITEMS = [
  { id: 1, name: 'Chicken Burger',     price: 650, restaurant: 'KFC Sarit Centre',  image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', discount: 'BESTSELLER', category: 'burgers'  },
  { id: 2, name: 'Margherita Pizza',   price: 850, restaurant: 'Debonairs Pizza',   image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', category: 'pizza'    },
  { id: 3, name: 'Chicken Wings x6',   price: 680, restaurant: 'Galitos Chicken',   image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400&q=80', discount: '20% OFF', oldPrice: 850, category: 'chicken' },
  { id: 4, name: 'Strawberry Shake',   price: 350, restaurant: 'Scott Kitchen',     image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80', category: 'drinks'   },
  { id: 5, name: 'Beef Burger Deluxe', price: 750, restaurant: 'Burger Barn',       image: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=400&q=80', discount: 'NEW', category: 'burgers'  },
  { id: 6, name: 'Acai Bowl',          price: 550, restaurant: 'Scott Kitchen',     image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', category: 'healthy'  },
  { id: 7, name: 'Full English',       price: 780, restaurant: 'Scott Kitchen',     image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80', category: 'breakfast'},
  { id: 8, name: 'Chocolate Lava',     price: 420, restaurant: 'Galitos Chicken',   image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80', category: 'desserts' },
];

const CHIPS = [
  { id: 'fast',    label: 'Under 30 min', icon: '⚡' },
  { id: 'deals',   label: 'Deals',        icon: '🎁' },
  { id: 'top',     label: 'Top rated',    icon: '⭐' },
  { id: 'healthy', label: 'Healthy',      icon: '🥗' },
  { id: 'new',     label: 'New',          icon: '✨' },
];

export default function Home() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [cat,         setCat]         = useState('all');
  const [activeChip,  setActiveChip]  = useState('fast');
  const [cart,        setCart]        = useState({});
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    getMyOrders()
      .then(r => {
        const live = r.data.find(o =>
          ['paid','assigned','picked_up'].includes(o.status)
        );
        setActiveOrder(live || null);
      })
      .catch(() => {});
  }, []);

  const updateCart = (id, delta) => {
    setCart(c => {
      const next = { ...c, [id]: Math.max(0, (c[id] || 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const filtered = MENU_ITEMS.filter(i =>
    cat === 'all' || i.category === cat
  );

  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);
  const cartTotal = MENU_ITEMS.reduce(
    (s, i) => s + (cart[i.id] || 0) * i.price, 0
  );

  const goToCart = () => {
    if (cartCount === 0) return toast.info('Add items first.');
    navigate('/place-order', { state: { cart, cartTotal } });
  };

  return (
    <div style={{ background: '#FFF8F3', minHeight: '100vh' }}>
      <Navbar
        cartCount={cartCount}
        cartTotal={cartTotal}
        onCartClick={goToCart}
      />

      {/* Hero */}
      <div style={{ display: 'block' }}>
        <Hero activeOrder={activeOrder} />
      </div>

      {/* Body */}
      <div style={{ padding: '0 5%', maxWidth: 1280, margin: '0 auto' }}>

        {/* Categories */}
        <div style={{ padding: '32px 0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1207', letterSpacing: '-0.5px' }}>
              What are you craving?
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: 10,
          }}>
            {[{ id: 'all', label: 'All', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=70' }, ...CATEGORIES].map(c => (
              <div
                key={c.id}
                onClick={() => setCat(c.id)}
                style={{
                  background: '#fff',
                  border: cat === c.id ? '2px solid #E8521A' : '1.5px solid #F0EBE3',
                  borderRadius: 14,
                  padding: '12px 8px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 8,
                  cursor: 'pointer',
                  background: cat === c.id ? '#FFF3EE' : '#fff',
                }}
              >
                <img
                  src={c.image}
                  alt={c.label}
                  style={{ width: '100%', height: 52, objectFit: 'cover', borderRadius: 8 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: cat === c.id ? '#E8521A' : '#1A1207',
                  textAlign: 'center',
                }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Promo strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)',
          gap: 14, margin: '24px 0 32px',
        }}>
          {/* Promo A — food image */}
          <div style={{
            borderRadius: 18, padding: '24px',
            overflow: 'hidden', position: 'relative',
            minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            background: '#1A1207',
          }}>
            <img
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80"
              alt="Promo"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'inline-block', background: '#E8521A', color: '#fff',
                fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 5,
                letterSpacing: '0.06em', marginBottom: 6,
              }}>
                FREE DELIVERY
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                Weekend special —<br />no delivery fees
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>
                On orders above KES 800 · Until Sunday
              </div>
            </div>
          </div>

          {/* Promo B — rider recruitment */}
          <div style={{
            borderRadius: 18, padding: '24px',
            background: '#E8521A',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', right: -24, bottom: -24,
              width: 130, height: 130, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'inline-block', background: 'rgba(255,255,255,0.2)',
                color: '#fff', fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 5, marginBottom: 8,
              }}>
                EARN WITH SCOTT
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                Your city,<br />your hours.
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 5 }}>
                Join 200+ riders delivering across Nairobi
              </div>
            </div>
            <button
              onClick={() => navigate('/register')}
              style={{
                background: '#fff', color: '#E8521A',
                border: 'none', borderRadius: 9,
                padding: '9px 16px', fontSize: 13, fontWeight: 800,
                alignSelf: 'flex-start', marginTop: 16,
                position: 'relative', zIndex: 1, cursor: 'pointer',
              }}
            >
              Become a rider →
            </button>
          </div>
        </div>

        {/* Active order banner */}
        {activeOrder && (
          <div
            onClick={() => navigate(`/orders/${activeOrder.id}/track`)}
            style={{
              background: '#1A1207', borderRadius: 16,
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              marginBottom: 24, cursor: 'pointer',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=80"
              alt="Order"
              style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
              onError={e => { e.target.style.background = '#2A1F17'; e.target.style.display = 'none'; }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                Your order is on the way
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                Order #{activeOrder.id} · {activeOrder.rider?.username || 'Finding rider...'}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              {activeOrder.status === 'picked_up' ? (
                <>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#E8521A', lineHeight: 1 }}>~8</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>min away</div>
                </>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M9 5l6 6-6 6" stroke="#E8521A" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {CHIPS.map(chip => (
            <button
              key={chip.id}
              onClick={() => setActiveChip(chip.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 30,
                fontSize: 13, fontWeight: 700,
                border: activeChip === chip.id ? 'none' : '1.5px solid #F0EBE3',
                background: activeChip === chip.id ? '#1A1207' : '#fff',
                color: activeChip === chip.id ? '#fff' : '#6B5E52',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14 }}>{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>

        {/* Restaurants */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1207', letterSpacing: '-0.5px' }}>
            Top restaurants near you
          </h2>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#E8521A', cursor: 'pointer' }}>
            See all →
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20, marginBottom: 40,
        }}>
          {RESTAURANTS.map(r => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>

        {/* Menu grid */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1207', letterSpacing: '-0.5px' }}>
            {cat === 'all' ? 'Order again 🔁' : `${CATEGORIES.find(c => c.id === cat)?.label || cat}`}
          </h2>
          <span style={{ fontSize: 13, color: '#B0A396', fontWeight: 500 }}>
            {filtered.length} items
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16, marginBottom: 48,
        }}>
          {filtered.map(item => (
            <MenuCard
              key={item.id}
              item={item}
              qty={cart[item.id] || 0}
              onAdd={() => updateCart(item.id, 1)}
              onRemove={() => updateCart(item.id, -1)}
            />
          ))}
        </div>
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div style={{
          position: 'sticky', bottom: 20,
          padding: '0 5%', zIndex: 50,
          maxWidth: 1280, margin: '0 auto',
        }}>
          <div
            onClick={goToCart}
            style={{
              background: '#1A1207', borderRadius: 14,
              padding: '14px 22px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer', maxWidth: 600,
              margin: '0 auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                background: '#E8521A', color: '#fff',
                width: 30, height: 30, borderRadius: 8,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, fontWeight: 800,
              }}>
                {cartCount}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  View cart
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                  {cartCount} item{cartCount > 1 ? 's' : ''} · Scott Kitchen
                </div>
              </div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#E8521A' }}>
              KES {cartTotal.toLocaleString()} →
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        background: '#1A1207', padding: '20px 5%',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        marginTop: 20,
      }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>
          Scott<span style={{ color: '#E8521A' }}>.</span> Delivery
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Become a rider', 'Help centre', 'Terms of use'].map(l => (
            <span key={l} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
              {l}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          © 2026 Scott Delivery, Nairobi
        </div>
      </footer>
    </div>
  );
}