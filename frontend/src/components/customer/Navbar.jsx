import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../shared/NotificationBell';

export default function Navbar({ cartCount = 0, cartTotal = 0, onCartClick }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #F0EBE3',
      padding: '0 5%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => navigate('/home')}
      >
        <div style={{
          width: 36, height: 36,
          background: '#E8521A',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1207', letterSpacing: '-0.5px' }}>
          Scott<span style={{ color: '#E8521A' }}>.</span>
        </div>
      </div>

      {/* Center nav — desktop only */}
      <div style={{
        display: 'flex', gap: 28, alignItems: 'center',
        '@media(max-width:768px)': { display: 'none' },
      }}>
        {[
          { label: 'Restaurants', path: '/home' },
          { label: 'Deals',       path: '/home' },
          { label: 'Track order', path: '/orders' },
        ].map(item => (
          <span
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{ fontSize: 14, fontWeight: 500, color: '#6B5E52', cursor: 'pointer' }}
          >
            {item.label}
          </span>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Location */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#FFF8F3', border: '1px solid #F0EBE3',
          borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5A4 4 0 003 5.5C3 8.5 7 12.5 7 12.5S11 8.5 11 5.5a4 4 0 00-4-4z" stroke="#E8521A" strokeWidth="1.4"/>
            <circle cx="7" cy="5.5" r="1.5" stroke="#E8521A" strokeWidth="1.4"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1207' }}>
            Nairobi
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5l3 3 3-3" stroke="#B0A396" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <NotificationBell />

        {/* Cart */}
        {cartCount > 0 && (
          <button
            onClick={onCartClick}
            style={{
              background: '#1A1207', color: '#fff',
              border: 'none', borderRadius: 10,
              padding: '8px 16px', fontSize: 13,
              fontWeight: 700, display: 'flex',
              alignItems: 'center', gap: 8,
            }}
          >
            <div style={{
              background: '#E8521A', color: '#fff',
              width: 22, height: 22, borderRadius: 6,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12, fontWeight: 800,
            }}>
              {cartCount}
            </div>
            Cart — KES {cartTotal.toLocaleString()}
          </button>
        )}

        {/* Account */}
        <div
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#FFF3EE', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#E8521A',
            cursor: 'pointer', border: '1.5px solid #F0EBE3',
          }}
          onClick={logoutUser}
        >
          {user?.username?.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </nav>
  );
}