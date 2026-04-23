export default function KpiCard({ label, value, delta, deltaType, accentColor, icon }) {
  return (
    <div className="kpi-card">
      <div className="kpi-accent" style={{ background: accentColor }} />
      <div style={{ flex: 1 }}>
        <div className="kpi-label">
          {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
          {label}
        </div>
        <div className="kpi-value">{value}</div>
        {delta && (
          <div className={`kpi-delta delta-${deltaType}`}>
            {deltaType === 'up' ? '↑' : '↓'} {delta}
          </div>
        )}
      </div>
    </div>
  );
}