import { useNavigate } from 'react-router-dom';

const TRUST_ITEMS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5A5 5 0 003 6.5c0 3.5 5 8 5 8s5-4.5 5-8a5 5 0 00-5-5z"
          stroke="#E8521A" strokeWidth="1.4"/>
        <circle cx="8" cy="6.5" r="1.8" stroke="#E8521A" strokeWidth="1.4"/>
      </svg>
    ),
    strong: '24 min',
    text: 'average delivery across all Nairobi zones',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="6" r="3" stroke="#E8521A" strokeWidth="1.4"/>
        <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"
          stroke="#E8521A" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    strong: '200+ riders',
    text: 'active daily, tracked live on the map',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="#E8521A" strokeWidth="1.4"/>
        <path d="M2 7h12" stroke="#E8521A" strokeWidth="1.4"/>
        <path d="M5 10.5h2" stroke="#E8521A" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    strong: 'M-Pesa',
    text: 'instant payments — no card needed',
  },
];

export default function AuthLayout({ children, mode = 'login' }) {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5EDE4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        width: '100%',
        maxWidth: 960,
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid #E0D4C8',
        minHeight: 580,
      }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          background: '#1A1207',
          padding: '44px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative blobs */}
          <div style={{
            position: 'absolute', width: 300, height: 300,
            borderRadius: '50%', background: 'rgba(232,82,26,0.1)',
            right: -80, top: -80,
          }} />
          <div style={{
            position: 'absolute', width: 180, height: 180,
            borderRadius: '50%', background: 'rgba(232,82,26,0.07)',
            left: -40, bottom: -40,
          }} />

          {/* Brand */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              position: 'relative', zIndex: 1, cursor: 'pointer',
            }}
            onClick={() => navigate('/home')}
          >
            <div style={{
              width: 38, height: 38, background: '#E8521A',
              borderRadius: 11, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke="#fff" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{
              fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px',
            }}>
              Scott<span style={{ color: '#E8521A' }}>.</span>
            </div>
          </div>

          {/* Middle content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{
              fontSize: 'clamp(28px, 3vw, 38px)',
              fontWeight: 900, color: '#fff',
              lineHeight: 1.15, letterSpacing: '-1px',
              marginBottom: 12,
            }}>
              Nairobi's food,<br />
              <span style={{ color: '#E8521A' }}>delivered fast.</span>
            </h1>
            <p style={{
              fontSize: 14, color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.7, marginBottom: 24, maxWidth: 320,
            }}>
              Order from 120+ restaurants. Track your rider live on the map. Pay with M-Pesa in seconds.
            </p>

            {/* Food image */}
            <img
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80"
              alt="Delicious food from Scott"
              style={{
                width: '100%', height: 150,
                objectFit: 'cover', borderRadius: 14,
                display: 'block',
              }}
              onError={e => {
                e.target.parentElement.style.background = '#2A1F17';
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Trust signals */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 12,
            position: 'relative', zIndex: 1,
          }}>
            {TRUST_ITEMS.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 34, height: 34, flexShrink: 0,
                  background: 'rgba(232,82,26,0.12)',
                  borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{item.strong}</span>
                  {' '}{item.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          background: '#FFF8F3',
          padding: '44px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflowY: 'auto',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}