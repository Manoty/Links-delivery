import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyOrders } from '../../api/orders';
import { useToast } from '../../components/shared/Toast';
import { SkeletonMenu } from '../../components/shared/Skeleton';
import '../../styles/app.css';

const MENU = [
  { id: 1, name: 'Chicken Burger',   price: 650,  emoji: '🍔', category: 'Burgers'  },
  { id: 2, name: 'Beef Burger',      price: 700,  emoji: '🍔', category: 'Burgers'  },
  { id: 3, name: 'Chicken Wings x6', price: 850,  emoji: '🍗', category: 'Chicken'  },
  { id: 4, name: 'Streetwise Two',   price: 750,  emoji: '🍗', category: 'Chicken'  },
  { id: 5, name: 'Fries Large',      price: 250,  emoji: '🍟', category: 'Sides'    },
  { id: 6, name: 'Pepsi 500ml',      price: 150,  emoji: '🥤', category: 'Drinks'   },
  { id: 7, name: 'Milkshake',        price: 350,  emoji: '🥛', category: 'Drinks'   },
  { id: 8, name: 'Onion Rings',      price: 200,  emoji: '🧅', category: 'Sides'    },
];

const CATS = ['All', 'Burgers', 'Chicken', 'Sides', 'Drinks'];

const STATUS_META = {
  pending:   { label: 'Awaiting payment', color: 'pill-amber' },
  paid:      { label: 'Finding rider',    color: 'pill-blue'  },
  assigned:  { label: 'Rider assigned',   color: 'pill-purple'},
  picked_up: { label: 'On the way',       color: 'pill-green' },
  delivered: { label: 'Delivered',        color: 'pill-green' },
  cancelled: { label: 'Cancelled',        color: 'pill-red'   },
};

const STEPS = ['placed', 'paid', 'rider', 'transit', 'done'];
const ORDER_STEP = {
  pending:   1,
  paid:      2,
  assigned:  3,
  picked_up: 4,
  delivered: 5,
};

export default function Home() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [cat,      setCat]      = useState('All');
  const [cart,     setCart]     = useState({});
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    getMyOrders()
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeOrder = orders.find(o =>
    ['assigned', 'picked_up', 'paid'].includes(o.status)
  );

  const filtered = MENU.filter(item =>
    (cat === 'All' || item.category === cat) &&
    (!search || item.name.toLowerCase().includes(search.toLowerCase()))
  );

  const updateCart = (id, delta) => {
    setCart(c => {
      const next = { ...c, [id]: Math.max(0, (c[id] || 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const cartCount  = Object.values(cart).reduce((s, n) => s + n, 0);
  const cartTotal  = MENU.reduce((s, item) => s + (cart[item.id] || 0) * item.price, 0);

  const goToCart = () => {
    if (cartCount === 0) return toast.info('Add items to your cart first.');
    navigate('/place-order', { state: { cart, cartTotal } });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="app-shell">
      <div className="screen-content">

        {/* Header */}
        <div className="topbar-green">
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
              {greeting()}, {user?.username?.split('_')[0]}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12 }}>📍</span> Nairobi, Kenya
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 12, cursor: 'pointer' }}
              onClick={() => navigate('/orders')}
            >
              My orders
            </button>
            <div className="av av-sm av-white">
              {user?.username?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px 4px' }}>
          <div style={{
            background: '#fff',
            border: '0.5px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
          }}>
            <span style={{ fontSize: 16 }}>🔍</span>
            <input
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent', color: 'var(--gray-900)' }}
              placeholder="Search for food..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <span style={{ cursor: 'pointer', color: 'var(--gray-400)', fontSize: 14 }} onClick={() => setSearch('')}>✕</span>
            )}
          </div>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CATS.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: cat === c ? 'var(--green-700)' : '#fff',
                color: cat === c ? '#fff' : 'var(--gray-600)',
                fontSize: 13,
                fontWeight: cat === c ? 500 : 400,
                cursor: 'pointer',
                border: cat === c ? 'none' : '0.5px solid var(--gray-200)',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Active order card */}
        {activeOrder && (
          <>
            <div className="section-head">
              <div className="section-title">Active order</div>
              <span
                className="section-link"
                onClick={() => navigate(`/orders/${activeOrder.id}/track`)}
              >
                Track →
              </span>
            </div>
            <div style={{ margin: '0 16px 16px' }}>
              <div className="card">
                {/* Map strip */}
                <div style={{
                  height: 80,
                  background: 'linear-gradient(135deg, #E1F5EE 0%, #9FE1CB 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <div style={{ position: 'absolute', left: '40%', fontSize: 20 }}>🏍️</div>
                  <div style={{ position: 'absolute', right: '20%', fontSize: 16 }}>📍</div>
                  <div style={{
                    position: 'absolute', left: '42%', right: '22%',
                    top: '50%', height: 2, background: 'var(--green-700)', opacity: 0.4,
                  }} />
                  <span
                    style={{ position: 'absolute', top: 8, right: 12, fontSize: 11, background: '#fff', padding: '2px 8px', borderRadius: 20, color: 'var(--green-600)', fontWeight: 500 }}
                    className="pill-green"
                  >
                    {STATUS_META[activeOrder.status]?.label}
                  </span>
                </div>

                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
                        {activeOrder.status === 'picked_up' ? '~8' : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                        {activeOrder.status === 'picked_up' ? 'minutes away' : STATUS_META[activeOrder.status]?.label}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Order #{activeOrder.id}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>
                        KES {parseFloat(activeOrder.total_amount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Rider info */}
                  {activeOrder.rider && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 0', borderTop: '0.5px solid var(--gray-200)',
                      marginBottom: 10,
                    }}>
                      <div className="av av-sm av-green">
                        {activeOrder.rider.username?.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{activeOrder.rider.username}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{activeOrder.rider.phone_number}</div>
                      </div>
                      <a
                        href={`tel:${activeOrder.rider.phone_number}`}
                        style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'var(--green-50)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: 16,
                          textDecoration: 'none',
                        }}
                      >
                        📞
                      </a>
                    </div>
                  )}

                  {/* Progress steps */}
                  <div className="step-track">
                    {['Placed', 'Paid', 'Rider', 'Transit', 'Done'].map((label, i) => {
                      const currentStep = ORDER_STEP[activeOrder.status] || 1;
                      const isDone   = i + 1 < currentStep;
                      const isActive = i + 1 === currentStep;
                      return (
                        <div className="step-item" key={label}>
                          {i < 4 && (
                            <div className={`step-connector ${isDone ? 'done' : ''}`} />
                          )}
                          <div className={`step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`} />
                          <div className={`step-label ${isActive ? 'active' : ''}`}>{label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Menu */}
        <div className="section-head">
          <div className="section-title">
            {search ? `Results for "${search}"` : `${cat === 'All' ? 'Popular items' : cat}`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{filtered.length} items</div>
        </div>

        {loading ? (
          <SkeletonMenu />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 16px' }}>
            {filtered.map(item => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="card"
                  style={{ padding: 12, cursor: 'pointer' }}
                >
                  <div style={{
                    height: 70,
                    background: 'var(--gray-100)',
                    borderRadius: 8,
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                  }}>
                    {item.emoji}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{item.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-700)' }}>
                      KES {item.price}
                    </div>
                    {qty === 0 ? (
                      <button
                        onClick={() => updateCart(item.id, 1)}
                        style={{
                          width: 26, height: 26,
                          borderRadius: 8,
                          background: 'var(--green-700)',
                          color: '#fff',
                          border: 'none',
                          fontSize: 18,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        +
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => updateCart(item.id, -1)}
                          style={{ width: 24, height: 24, borderRadius: 6, border: '0.5px solid var(--gray-200)', background: '#fff', cursor: 'pointer', fontSize: 16 }}
                        >
                          −
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 14, textAlign: 'center' }}>{qty}</span>
                        <button
                          onClick={() => updateCart(item.id, 1)}
                          style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--green-700)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div
          onClick={goToCart}
          style={{
            position: 'sticky',
            bottom: 'var(--bottom-nav)',
            margin: '0 16px 8px',
            background: 'var(--green-700)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              {cartCount} item{cartCount > 1 ? 's' : ''} in cart
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
              KES {cartTotal.toLocaleString()} · Tap to checkout
            </div>
          </div>
          <div style={{ color: '#fff', fontSize: 20 }}>›</div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {[
          { to: '/home',        icon: '🏠', label: 'Home'    },
          { to: '/orders',      icon: '📋', label: 'Orders'  },
          { to: '/orders/track',icon: '📍', label: 'Track'   },
          { to: '/profile',     icon: '👤', label: 'Profile' },
        ].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}
          >
            <div className="bn-icon">{item.icon}</div>
            <div className="bn-label">{item.label}</div>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}