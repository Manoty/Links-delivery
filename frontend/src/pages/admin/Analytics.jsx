import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import Sidebar from '../../components/admin/Sidebar';
import {
  getAnalyticsKpi, getRevenueTrend, getPeakHours,
  getHeatmap, getZonePerformance, getRiderLeaderboard,
} from '../../api/orders';
import '../../styles/dashboard.css';

const ZONE_COLORS = ['#E8521A','#1D9E75','#378ADD','#BA7517','#7F77DD','#D4537E','#888780'];
const RIDER_COLORS = [
  { bg:'#E1F5EE', tc:'#085041' },
  { bg:'#E6F1FB', tc:'#0C447C' },
  { bg:'#EEEDFE', tc:'#3C3489' },
  { bg:'#FAEEDA', tc:'#633806' },
  { bg:'#FBEAF0', tc:'#72243E' },
];

function heatColor(value, max) {
  if (!value || !max) return '#F3F4F6';
  const t = value / max;
  const r = Math.round(29  + (232 - 29)  * t);
  const g = Math.round(158 + (82  - 158) * t);
  const b = Math.round(117 + (26  - 117) * t);
  return `rgb(${r},${g},${b})`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #e5e7eb',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: '#1A1207' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {p.name === 'Revenue'
            ? `KES ${Math.round(p.value).toLocaleString()}`
            : p.value
          }
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [kpi,         setKpi]         = useState(null);
  const [trend,       setTrend]       = useState([]);
  const [peakHours,   setPeakHours]   = useState([]);
  const [heatmap,     setHeatmap]     = useState([]);
  const [zones,       setZones]       = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [range,       setRange]       = useState('7d');
  const [lMetric,     setLMetric]     = useState('deliveries');
  const [hoverCell,   setHoverCell]   = useState(null);
  const [loading,     setLoading]     = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [kpiRes, trendRes, peakRes, heatRes, zoneRes, leaderRes] = await Promise.all([
        getAnalyticsKpi(),
        getRevenueTrend(range),
        getPeakHours(),
        getHeatmap(),
        getZonePerformance(),
        getRiderLeaderboard(lMetric),
      ]);
      setKpi(kpiRes.data);
      setTrend(trendRes.data);
      setPeakHours(peakRes.data);
      setHeatmap(heatRes.data);
      setZones(zoneRes.data);
      setLeaderboard(leaderRes.data);
    } catch {}
    setLoading(false);
  }, [range, lMetric]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const heatMax = Math.max(
    ...heatmap.flatMap(d => d.hours?.map(h => h.orders) || []), 1
  );

  const peakMax = Math.max(...peakHours.map(h => h.orders), 1);

  if (loading) return (
    <div className="dashboard-shell">
      <Sidebar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div style={{ color: 'var(--gray-400)', fontSize: 14 }}>Loading analytics...</div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-shell">
      <Sidebar />

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div className="topbar">
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Analytics</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>
              {format(new Date(), "EEEE d MMMM yyyy")} · Live data
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="tab-group">
              {['7d', '30d'].map(r => (
                <button
                  key={r}
                  className={`tab-btn ${range === r ? 'active' : ''}`}
                  onClick={() => setRange(r)}
                >
                  {r === '7d' ? '7 days' : '30 days'}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={fetchAll}>
              Refresh
            </button>
          </div>
        </div>

        <div className="dash-content">

          {/* KPI row */}
          <div className="kpi-grid">
            {[
              {
                label: 'Revenue today',
                value: `KES ${Math.round(kpi?.revenue?.value || 0).toLocaleString()}`,
                delta: kpi?.revenue?.delta ? `${kpi.revenue.delta > 0 ? '+' : ''}${kpi.revenue.delta}% vs yesterday` : null,
                type:  kpi?.revenue?.delta >= 0 ? 'up' : 'down',
                color: '#E8521A', icon: '💰',
              },
              {
                label: 'Orders today',
                value: kpi?.orders?.value || 0,
                delta: kpi?.orders?.delta !== null ? `${kpi?.orders?.delta >= 0 ? '+' : ''}${kpi?.orders?.delta} vs yesterday` : null,
                type:  kpi?.orders?.delta >= 0 ? 'up' : 'down',
                color: '#1D9E75', icon: '📋',
              },
              {
                label: 'Avg delivery',
                value: `${kpi?.avg_delivery_min || 24} min`,
                delta: 'Target: 25 min',
                type:  'up',
                color: '#378ADD', icon: '⏱️',
              },
              {
                label: 'Payment success',
                value: `${kpi?.payment_success_pct || 0}%`,
                delta: 'M-Pesa STK push',
                type:  'up',
                color: '#7F77DD', icon: '💳',
              },
            ].map(k => (
              <div className="kpi-card" key={k.label}>
                <div className="kpi-accent" style={{ background: k.color }} />
                <div style={{ flex: 1 }}>
                  <div className="kpi-label">{k.icon} {k.label}</div>
                  <div className="kpi-value">{k.value}</div>
                  {k.delta && (
                    <div className={`kpi-delta delta-${k.type}`}>
                      {k.type === 'up' ? '↑' : '↓'} {k.delta}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue trend + Peak hours */}
          <div className="two-col">
            <div className="dash-card">
              <div className="card-head">
                <div className="card-title">Revenue trend</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: '#E8521A', display: 'inline-block' }} />
                    Revenue
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 3, background: '#1D9E75', display: 'inline-block' }} />
                    Orders
                  </span>
                </div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#E8521A" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#E8521A" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#1D9E75" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#1D9E75" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                      tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue"
                      stroke="#E8521A" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                    <Area type="monotone" dataKey="orders" name="Orders"
                      stroke="#1D9E75" strokeWidth={1.5} fill="url(#ordGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dash-card">
              <div className="card-head">
                <div className="card-title">Peak hours</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>orders per hour · last 7 days</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={peakHours} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v, n) => [v, 'Orders']} labelFormatter={l => `${l}`} />
                    <Bar dataKey="orders" name="Orders" radius={[4, 4, 0, 0]}>
                      {peakHours.map((h, i) => (
                        <Cell
                          key={i}
                          fill={
                            h.orders >= peakMax * 0.7 ? '#E8521A'
                            : h.orders >= peakMax * 0.4 ? '#BA7517'
                            : '#1D9E75'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Peak hours legend */}
                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, color: 'var(--gray-400)' }}>
                  {[
                    { color: '#E8521A', label: 'Peak (70%+)'   },
                    { color: '#BA7517', label: 'Busy (40-70%)' },
                    { color: '#1D9E75', label: 'Low (<40%)'    },
                  ].map(l => (
                    <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap + Zones */}
          <div className="two-col">
            <div className="dash-card">
              <div className="card-head">
                <div className="card-title">Order heatmap</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>day × hour · last 28 days</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                {heatmap.length > 0 ? (
                  <>
                    {/* Column headers — hours */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '48px repeat(17, 1fr)',
                      gap: 3, marginBottom: 3,
                    }}>
                      <div />
                      {heatmap[0]?.hours?.map(h => (
                        <div key={h.hour} style={{
                          fontSize: 9, color: 'var(--gray-400)',
                          textAlign: 'center',
                        }}>
                          {h.hour % 3 === 0 ? `${h.hour < 12 ? h.hour : h.hour - 12}${h.hour < 12 ? 'a' : 'p'}` : ''}
                        </div>
                      ))}
                    </div>

                    {/* Rows — days */}
                    {heatmap.map(day => (
                      <div key={day.day} style={{
                        display: 'grid',
                        gridTemplateColumns: '48px repeat(17, 1fr)',
                        gap: 3, marginBottom: 3,
                      }}>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', display: 'flex', alignItems: 'center' }}>
                          {day.day}
                        </div>
                        {day.hours?.map(h => (
                          <div
                            key={h.hour}
                            title={`${day.day} ${h.hour}:00 — ${h.orders} orders`}
                            onMouseEnter={() => setHoverCell({ day: day.day, hour: h.hour, orders: h.orders })}
                            onMouseLeave={() => setHoverCell(null)}
                            style={{
                              height: 22,
                              borderRadius: 3,
                              background: heatColor(h.orders, heatMax),
                              cursor: 'pointer',
                              opacity: hoverCell &&
                                (hoverCell.day !== day.day || hoverCell.hour !== h.hour)
                                ? 0.5 : 1,
                              transition: 'opacity 0.1s',
                            }}
                          />
                        ))}
                      </div>
                    ))}

                    {/* Legend + hover info */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginTop: 10, fontSize: 11, color: 'var(--gray-400)',
                    }}>
                      <span>Low</span>
                      <div style={{
                        width: 80, height: 8, borderRadius: 2,
                        background: 'linear-gradient(to right, #E1F5EE, #E8521A)',
                      }} />
                      <span>High</span>
                      {hoverCell && (
                        <span style={{ marginLeft: 'auto', color: 'var(--gray-600)', fontWeight: 500 }}>
                          {hoverCell.day} {hoverCell.hour}:00 — {hoverCell.orders} orders
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>
                    Not enough data yet — heatmap builds after 7+ days of orders
                  </div>
                )}
              </div>
            </div>

            <div className="dash-card">
              <div className="card-head">
                <div className="card-title">Zone performance</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>last 30 days</div>
              </div>
              <div className="card-body">
                {zones.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--gray-400)', fontSize: 13 }}>
                    No zone data yet
                  </div>
                ) : (
                  zones.map((z, i) => (
                    <div key={z.zone} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 0',
                      borderBottom: i < zones.length - 1 ? '0.5px solid var(--gray-200)' : 'none',
                    }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: 2,
                        background: ZONE_COLORS[i % ZONE_COLORS.length],
                        flexShrink: 0,
                      }} />
                      <div style={{ fontSize: 13, fontWeight: 500, minWidth: 88 }}>{z.zone}</div>
                      <div style={{ flex: 1, height: 6, background: 'var(--gray-100)', borderRadius: 3 }}>
                        <div style={{
                          width: `${z.pct}%`, height: 6, borderRadius: 3,
                          background: ZONE_COLORS[i % ZONE_COLORS.length],
                        }} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', minWidth: 80, textAlign: 'right' }}>
                        KES {(z.revenue / 1000).toFixed(1)}k · {z.pct}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Leaderboard + Payment split */}
          <div className="two-col">
            <div className="dash-card">
              <div className="card-head">
                <div className="card-title">Rider leaderboard</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['deliveries', 'rating', 'speed'].map(m => (
                    <button
                      key={m}
                      className={`btn ${lMetric === m ? 'btn-primary' : ''}`}
                      style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() => setLMetric(m)}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '0 18px' }}>
                {leaderboard.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                    No rider data yet
                  </div>
                ) : (
                  leaderboard.map((rider, i) => {
                    const color = RIDER_COLORS[i % RIDER_COLORS.length];
                    const initials = rider.rider_name?.slice(0, 2).toUpperCase() || '??';
                    const maxVal = lMetric === 'deliveries'
                      ? leaderboard[0]?.deliveries
                      : lMetric === 'rating' ? 5
                      : leaderboard[leaderboard.length - 1]?.avg_time_min;
                    const val = lMetric === 'deliveries' ? rider.deliveries
                      : lMetric === 'rating' ? (rider.rating || '—')
                      : `${rider.avg_time_min}m`;
                    const pct = lMetric === 'speed'
                      ? Math.round((1 - rider.avg_time_min / 50) * 100)
                      : Math.round(
                          lMetric === 'rating'
                          ? ((rider.rating || 0) / 5) * 100
                          : (rider.deliveries / maxVal) * 100
                        );
                    const stars = lMetric === 'rating' && rider.rating
                      ? '★'.repeat(Math.floor(rider.rating)) + '☆'.repeat(5 - Math.floor(rider.rating))
                      : null;

                    return (
                      <div key={rider.rider_id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 0',
                        borderBottom: i < leaderboard.length - 1 ? '0.5px solid var(--gray-200)' : 'none',
                      }}>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', minWidth: 18, fontWeight: 500 }}>
                          {i + 1}
                        </div>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: color.bg, color: color.tc,
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 11,
                          fontWeight: 600, flexShrink: 0,
                        }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{rider.rider_name}</div>
                          {stars && (
                            <div style={{ fontSize: 11, color: '#BA7517' }}>{stars}</div>
                          )}
                        </div>
                        <div style={{ width: 72, height: 4, background: 'var(--gray-100)', borderRadius: 2 }}>
                          <div style={{ width: `${pct}%`, height: 4, borderRadius: 2, background: '#1D9E75' }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, minWidth: 32, textAlign: 'right' }}>
                          {val}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="dash-card">
              <div className="card-head">
                <div className="card-title">Payment methods</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>by transaction volume</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'M-Pesa', value: 78, fill: '#E8521A' },
                        { name: 'Cash',   value: 14, fill: '#BA7517' },
                        { name: 'Card',   value: 8,  fill: '#1D9E75' },
                      ]}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      dataKey="value"
                      strokeWidth={0}
                    />
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                {[
                  { label: 'M-Pesa', pct: 78, color: '#E8521A' },
                  { label: 'Cash',   pct: 14, color: '#BA7517' },
                  { label: 'Card',   pct: 8,  color: '#1D9E75' },
                ].map(p => (
                  <div key={p.label} style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13, marginBottom: 8,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--gray-500)' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: p.color, display: 'inline-block' }} />
                      {p.label}
                    </span>
                    <span style={{ fontWeight: 600 }}>{p.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}