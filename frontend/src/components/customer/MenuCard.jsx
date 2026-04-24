export default function MenuCard({ item, qty, onAdd, onRemove }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #F0EBE3',
      cursor: 'pointer',
      position: 'relative',
      transition: 'transform 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      {/* Image */}
      <div style={{ height: 150, overflow: 'hidden', position: 'relative' }}>
        <img
          src={item.image}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => {
            e.target.parentElement.style.background = '#FFF3EE';
            e.target.style.display = 'none';
          }}
        />
        {item.discount && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: '#E8521A', color: '#fff',
            fontSize: 10, fontWeight: 800,
            padding: '3px 8px', borderRadius: 5,
          }}>
            {item.discount}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 12px 14px' }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#1A1207',
          marginBottom: 3, lineHeight: 1.3,
        }}>
          {item.name}
        </div>
        <div style={{ fontSize: 12, color: '#B0A396', marginBottom: 10 }}>
          {item.restaurant}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#1A1207' }}>
              KES {item.price}
            </span>
            {item.oldPrice && (
              <span style={{ fontSize: 12, color: '#B0A396', textDecoration: 'line-through' }}>
                {item.oldPrice}
              </span>
            )}
          </div>

          {qty === 0 ? (
            <button
              onClick={onAdd}
              style={{
                width: 34, height: 34,
                background: '#E8521A', color: '#fff',
                border: 'none', borderRadius: 9,
                fontSize: 22, fontWeight: 300,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              +
            </button>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#1A1207', borderRadius: 9, padding: '5px 9px',
            }}>
              <button
                onClick={onRemove}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 17, width: 18, textAlign: 'center' }}
              >
                −
              </button>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>
                {qty}
              </span>
              <button
                onClick={onAdd}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 17, width: 18, textAlign: 'center' }}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}