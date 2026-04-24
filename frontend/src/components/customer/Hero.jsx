import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero({ activeOrder }) {
  const searchRef = useRef(null);
  const navigate  = useNavigate();

  return (
    <section style={{
      background: '#1A1207',
      padding: '56px 5% 0',
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
      gap: 48,
      alignItems: 'flex-end',
    }}>
      {/* Left */}
      <div style={{ paddingBottom: 56 }}>
        {/* Live tag */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(232,82,26,0.15)',
          border: '1px solid rgba(232,82,26,0.3)',
          borderRadius: 20, padding: '5px 14px', marginBottom: 20,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#E8521A' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#E8521A', letterSpacing: '0.06em' }}>
            LIVE — DELIVERING NOW
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(32px, 4vw, 52px)',
          fontWeight: 900, color: '#fff',
          lineHeight: 1.1, letterSpacing: '-1.5px',
          marginBottom: 14,
        }}>
          Nairobi's freshest<br />food, at your door
          <span style={{ color: '#E8521A' }}>.</span>
        </h1>

        <p style={{
          fontSize: 16, color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.7, marginBottom: 28, maxWidth: 420,
        }}>
          Order from 120+ restaurants across Nairobi. Delivered hot in under 30 minutes by Scott riders.
        </p>

        {/* Search */}
        <div style={{
          background: '#fff', borderRadius: 14,
          padding: '6px 6px 6px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          maxWidth: 500,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="#B0A396" strokeWidth="1.5"/>
            <path d="M13 13l3 3" stroke="#B0A396" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={searchRef}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15, color: '#1A1207', background: 'transparent',
              fontFamily: 'inherit',
            }}
            placeholder="Search restaurants, cuisines, dishes..."
          />
          <button
            style={{
              background: '#E8521A', color: '#fff',
              border: 'none', borderRadius: 10,
              padding: '12px 22px', fontSize: 14,
              fontWeight: 700, whiteSpace: 'nowrap',
            }}
          >
            Search
          </button>
        </div>

        {/* Trust pills */}
        <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
          {[
            { icon: '⚡', text: '24 min avg delivery' },
            { icon: '🏍️', text: '200+ riders active' },
            { icon: '🍽️', text: '120+ restaurants' },
          ].map(p => (
            <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{p.icon}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                {p.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — hero image */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
          <img
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&q=85"
            alt="Delicious food"
            style={{
              width: '100%', height: 300,
              objectFit: 'cover',
              borderRadius: '20px 20px 0 0',
              display: 'block',
            }}
            onError={e => {
              e.target.style.background = '#2A1F17';
              e.target.style.height = '300px';
            }}
          />

          {/* Floating rider card */}
          <div style={{
            position: 'absolute', bottom: 20, left: -20,
            background: '#fff', borderRadius: 14,
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#FFF3EE', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              🏍️
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1207' }}>
                Jane R. is nearby
              </div>
              <div style={{ fontSize: 11, color: '#B0A396', marginTop: 1 }}>
                Available · 0.8 km away
              </div>
            </div>
          </div>

          {/* ETA badge */}
          <div style={{
            position: 'absolute', top: 20, right: -10,
            background: '#E8521A', borderRadius: 12,
            padding: '8px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>24</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>min avg</div>
          </div>
        </div>
      </div>
    </section>
  );
}