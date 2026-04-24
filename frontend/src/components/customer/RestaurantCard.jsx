import { useState } from 'react';

export default function RestaurantCard({ restaurant }) {
  const [fav, setFav] = useState(false);

  return (
    <div style={{
      background: '#fff',
      borderRadius: 18,
      overflow: 'hidden',
      border: '1px solid #F0EBE3',
      cursor: 'pointer',
      transition: 'transform 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
        <img
          src={restaurant.image}
          alt={restaurant.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => {
            e.target.parentElement.style.background = '#F5E6D3';
            e.target.style.display = 'none';
          }}
        />
        {/* Badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: '#fff', borderRadius: 7,
          padding: '4px 10px', fontSize: 11, fontWeight: 700,
          color: '#1A1207',
        }}>
          {restaurant.badge}
        </div>
        {/* Favourite */}
        <button
          onClick={e => { e.stopPropagation(); setFav(f => !f); }}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            border: 'none', fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: fav ? '#E8521A' : '#B0A396',
          }}
        >
          {fav ? '♥' : '♡'}
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 14px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1207', marginBottom: 4 }}>
          {restaurant.name}
        </div>
        <div style={{
          fontSize: 13, color: '#B0A396',
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
        }}>
          <span style={{ color: '#1A1207', fontWeight: 700 }}>{restaurant.rating}</span>
          <span>·</span>
          <span>{restaurant.time}</span>
          <span>·</span>
          <span>{restaurant.delivery}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {restaurant.tags.map(tag => (
            <span key={tag} style={{
              background: '#FFF8F3', color: '#8B6F5E',
              fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 6,
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}