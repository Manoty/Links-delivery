export function SkeletonCard({ lines = 3 }) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid var(--gray-200)',
      borderRadius: 'var(--radius-lg)',
      padding: 16,
      margin: '0 16px 12px',
    }}>
      <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 10 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{
          height: 12,
          width: i === lines - 1 ? '60%' : '100%',
          marginBottom: i < lines - 1 ? 8 : 0,
        }} />
      ))}
    </div>
  );
}

export function SkeletonMenu() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 16px 16px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ background: '#fff', border: '0.5px solid var(--gray-200)', borderRadius: 10, padding: 10 }}>
          <div className="skeleton" style={{ height: 60, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 10, width: '40%' }} />
        </div>
      ))}
    </div>
  );
}