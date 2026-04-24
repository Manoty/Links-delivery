import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyOrders } from '../../api/orders';
import { useToast } from '../../components/shared/Toast';
import NotificationBell from '../../components/shared/NotificationBell';
import '../../styles/app.css';

const CATEGORIES = [
  { id: 'all',     label: 'All',      emoji: '🍽️', bg: '#F7F7F7' },
  { id: 'burgers', label: 'Burgers',  emoji: '🍔', bg: '#FFF3E0' },
  { id: 'pizza',   label: 'Pizza',    emoji: '🍕', bg: '#FCE4EC' },
  { id: 'chicken', label: 'Chicken',  emoji: '🍗', bg: '#E8F5E9' },
  { id: 'sides',   label: 'Sides',    emoji: '🍟', bg: '#FFF9C4' },
  { id: 'drinks',  label: 'Drinks',   emoji: '🥤', bg: '#E3F2FD' },
  { id: 'desserts',label: 'Desserts', emoji: '🧁', bg: '#F3E5F5' },
];

const RESTAURANTS = [
  { id: 1, name: 'KFC Sarit Centre',  emoji: '🍗', bg: '#FFF3E0', rating: 4.9, time: '20–30', delivery: 'Free',    badge: '⭐ Top rated' },
  { id: 2, name: 'Debonairs Pizza',   emoji: '🍕', bg: '#FCE4EC', rating: 4.7, time: '25–40', delivery: 'KES 50',  badge: '🔥 Popular'  },
  { id: 3, name: 'Galitos Chicken',   emoji: '🍗', bg: '#E8F5E9', rating: 4.8, time: '15–25', delivery: 'Free',    badge: '🎁 20% off'  },
  { id: 4, name: 'Burger Barn',       emoji: '🍔', bg: '#FFF3E0', rating: 4.6, time: '20–35', delivery: 'KES 30',  badge: '⚡ Fast'      },
];

const MENU_ITEMS = [
  { id: 1, name: 'Chicken Burger',   price: 650,  emoji: '🍔', bg: '#FFF3E0', category: 'burgers'  },
  { id: 2, name: 'Beef Burger',      price: 700,  emoji: '🍔', bg: '#FCE4EC', category: 'burgers'  },
  { id: 3, name: 'Chicken Wings',    price: 850,  emoji: '🍗', bg: '#E8F5E9', category: 'chicken'  },
  { id: 4, name: 'Streetwise Two',   price: 750,  emoji: '🍗', bg: '#FFF3E0', category: 'chicken'  },
  { id: 5, name: 'Fries Large',      price: 250,  emoji: '🍟', bg: '#FFF9C4', category: 'sides', oldPrice: 320 },
  { id: 6, name: 'Pepsi 500ml',      price: 150,  emoji: '🥤', bg: '#E3F2FD', category: 'drinks'   },
  { id: 7, name: 'Milkshake',        price: 350,  emoji: '🥛', bg: '#E3F2FD', category: 'drinks', oldPrice: 420 },
  { id: 8, name: 'Onion Rings',      price: 200,  emoji: '🧅', bg: '#FFF9C4', category: 'sides'    },
];

const OFFER_CHIPS = [
  { id: 'fast',    label: 'Under 30 min', emoji: '⚡' },
  { id: 'deals',   label: 'Deals',        emoji: '🎁' },
  { id: 'top',     label: 'Top rated',    emoji: '⭐' },
  { id: 'healthy', label: 'Healthy',      emoji: '🥗' },
  { id: 'new',     label: 'New',          emoji: '✨' },
];

const STATUS_ETA = {
  assigned:  'Finding rider',
  picked_up: 'On the way',
  paid:      'Finding rider',
};

export default function Home() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [cat,         setCat]         = useState('all');
  const [activeChip,  setActiveChip]  = useState('fast');
  const [cart,        setCart]        = useState({});
  const [search,      setSearch]      = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [tracking,    setTracking]    = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    getMyOrders()
      .then(r => {
        const active = r.data.find(o =>
          ['paid', 'assigned', 'picked_up'].includes(o.status)
        );
        setActiveOrder(active || null);
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

  const filtered = MENU_ITEMS.filter(item =>
    (cat === 'all' || item.category === cat) &&
    (!search || item.name.toLowerCase().includes(search.toLowerCase()))
  );

  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);
  const cartTotal = MENU_ITEMS.reduce(
    (s, item) => s + (cart[item.id] || 0) * item.price, 0
  );

  const goToCart = () => {
    if (cartCount === 0) return toast.info('Add items to your cart first.');
    navigate('/place-order', { state: { cart, cartTotal } });
  };

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const firstName = user?.username?.split('_')[0] || user?.username || 'there';

  return (
    <div className="app-shell" style={{ background: '#fff' }}>
      <div className="screen-content" style={{ background: '#fff' }}>

        {/* ── HERO ── */}
        <div className="hero-black">
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            {/* Location */}
            <div className="loc-row" style={{ margin: 0 }}>
              <div className="loc-pin-v2">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="3" fill="#fff"/>
                </svg>
              </div>
              <div>
                <div className="loc-name">Westlands, Nairobi</div>
                <div className="loc-sub-v2">Delivering now · 20–35 min</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 2 }}>
                <path d="M3 5l4 4 4-4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Notification bell */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <NotificationBell />
              <div style={{
                width: 36, height: 36,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
              }}>
                {firstName.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="hero-headline">
            {greeting()},<br />{firstName} 👋
          </div>
          <div className="hero-sub">What are you craving today?</div>

          {/* Search — sits on white surface that bleeds into body */}
          <div className="search-surface">
            <div className="search-inner" onClick={() => searchRef.current?.focus()}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#999" strokeWidth="1.5"/>
                <path d="M11 11l3 3" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                ref={searchRef}
                placeholder="Search food, restaurants..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <span
                  style={{ cursor: 'pointer', color: '#999', fontSize: 13 }}
                  onClick={() => setSearch('')}
                >
                  ✕
                </span>
              )}
            </div>
            {/* Filter button */}
            <div style={{
              width: 44, height: 44,
              background: '#F3F3F3',
              borderRadius: 10,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, cursor: 'pointer', flexShrink: 0,
            }}>
              {[14, 10, 6].map(w => (
                <div key={w} style={{ width: w, height: 2, background: '#333', borderRadius: 1 }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="home-body">

          {/* Categories */}
          <div className="cat-scroll">
            {CATEGORIES.map(c => (
              <div key={c.id} className="cat-pill" onClick={() => setCat(c.id)}>
                <div
                  className={`cat-circle ${cat === c.id ? 'active' : ''}`}
                  style={{ background: c.bg }}
                >
                  <span style={{ fontSize: 24 }}>{c.emoji}</span>
                </div>
                <div className="cat-label">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Active order card — only when order is live */}
          {activeOrder && (
            <div
              className="active-order-mini"
              onClick={() => navigate(`/orders/${activeOrder.id}/track`)}
            >
              <div className="aom-icon">🏍️</div>
              <div>
                <div className="aom-title">Order #{activeOrder.id}</div>
                <div className="aom-sub">
                  {STATUS_ETA[activeOrder.status] || activeOrder.status}
                  {activeOrder.rider && ` · ${activeOrder.rider.username}`}
                </div>
              </div>
              <div className="aom-right">
                {activeOrder.status === 'picked_up' ? (
                  <>
                    <div className="aom-eta">~8</div>
                    <div className="aom-eta-label">min away</div>
                  </>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M8 5l5 5-5 5" stroke="#06C167" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Promo banner */}
          {!search && (
            <div className="promo-banner">
              <div className="promo-blob" />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="promo-tag">LIMITED TIME</div>
                <div className="promo-title">
                  Free delivery<br />this weekend
                </div>
                <div className="promo-desc">On orders above KES 800</div>
              </div>
              <div className="promo-emoji">🎉</div>
            </div>
          )}

          {/* Offer chips */}
          {!search && (
            <div className="offer-strip">
              {OFFER_CHIPS.map(chip => (
                <div
                  key={chip.id}
                  className={`offer-chip ${activeChip === chip.id ? 'active' : ''}`}
                  onClick={() => setActiveChip(chip.id)}
                >
                  <span style={{ fontSize: 14 }}>{chip.emoji}</span>
                  {chip.label}
                </div>
              ))}
            </div>
          )}

          {/* Top restaurants */}
          {!search && (
            <>
              <div className="sec-head">
                <div className="sec-title">Top restaurants</div>
                <div className="sec-link">See all</div>
              </div>

              <div className="resto-scroll">
                {RESTAURANTS.map(r => (
                  <div key={r.id} className="resto-card">
                    <div className="resto-img" style={{ background: r.bg }}>
                      <span style={{ fontSize: 44 }}>{r.emoji}</span>
                      <div className="resto-badge">{r.badge}</div>
                    </div>
                    <div className="resto-name">{r.name}</div>
                    <div className="resto-meta">
                      <span className="resto-rating">{r.rating}</span>
                      <span>·</span>
                      <span>{r.time} min</span>
                      <span>·</span>
                      <span>{r.delivery}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Menu section */}
          <div className="sec-head" style={{ marginTop: search ? 0 : 4 }}>
            <div className="sec-title">
              {search
                ? `"${search}"`
                : cat === 'all' ? 'Order again 🔁' : CATEGORIES.find(c => c.id === cat)?.label
              }
            </div>
            <div style={{ fontSize: 13, color: '#999', fontWeight: 500 }}>
              {filtered.length} items
            </div>
          </div>

          <div className="menu-grid-2">
            {filtered.map(item => {
              const qty = cart[item.id] || 0;
              return (
                <div key={item.id} className="menu-card-v2">
                  <div className="menu-img-v2" style={{ background: item.bg }}>
                    <span style={{ fontSize: 40 }}>{item.emoji}</span>
                  </div>
                  <div className="menu-body-v2">
                    <div className="menu-name-v2">{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                      <div className="menu-price-v2">KES {item.price}</div>
                      {item.oldPrice && (
                        <div className="menu-old-price">{item.oldPrice}</div>
                      )}
                    </div>
                  </div>

                  {qty === 0 ? (
                    <button
                      className="add-fab"
                      onClick={() => updateCart(item.id, 1)}
                    >
                      +
                    </button>
                  ) : (
                    <div className="qty-ctrl-v2">
                      <button className="qty-btn-v2" onClick={() => updateCart(item.id, -1)}>−</button>
                      <div className="qty-num-v2">{qty}</div>
                      <button className="qty-btn-v2" onClick={() => updateCart(item.id, 1)}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                No results for "{search}"
              </div>
              <div style={{ fontSize: 13 }}>Try a different search term</div>
            </div>
          )}
        </div>
      </div>

      {/* ── CART FLOAT BAR ── */}
      {cartCount > 0 && (
        <div className="cart-float-v2" onClick={goToCart}>
          <div className="cart-bar-v2">
            <div className="cart-bubble-v2">{cartCount}</div>
            <div className="cart-info-v2">
              <div className="cart-main-v2">
                View cart — KES {cartTotal.toLocaleString()}
              </div>
              <div className="cart-hint-v2">
                Scott Kitchen · Tap to checkout
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 5l5 5-5 5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <nav className="bottom-nav-v2">
        {[
          { to: '/home',         icon: '🏠', label: 'Home'    },
          { to: '/search',       icon: '🔍', label: 'Search'  },
          { to: '/orders',       icon: '📋', label: 'Orders'  },
          { to: '/profile',      icon: '👤', label: 'Account' },
        ].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `bn-v2 ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="bn-active-dot" />}
                <div className="bn-icon-v2">{item.icon}</div>
                <div className="bn-label-v2">{item.label}</div>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}