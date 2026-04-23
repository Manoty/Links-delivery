import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import Sidebar from '../../components/admin/Sidebar';
import KpiCard from '../../components/admin/KpiCard';
import RevenueChart from '../../components/admin/RevenueChart';
import OrdersTable from '../../components/admin/OrdersTable';
import { getAllOrders } from '../../api/orders';
import { getLiveRiders } from '../../api/tracking';
import api from '../../api/axios';
import '../../styles/dashboard.css';

const STATUS_COLORS = {
  pending:   { bg: '#FAEEDA', text: '#633806', kanban: '#FAEEDA' },
  paid:      { bg: '#E6F1FB', text: '#0C447C', kanban: '#E6F1FB' },
  assigned:  { bg: '#EEEDFE', text: '#3C3489', kanban: '#EEEDFE' },
  picked_up: { bg: '#FBEAF0', text: '#72243E', kanban: '#FBEAF0' },
  delivered: { bg: '#E1F5EE', text: '#085041', kanban: '#E1F5EE' },
  cancelled: { bg: '#FCEBEB', text: '#791F1F', kanban: '#FCEBEB' },
};

const RIDER_COLORS = [
  { bg: '#E1F5EE', text: '#085041' },
  { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#EEEDFE', text: '#3C3489' },
  { bg: '#FAEEDA', text: '#633806' },
  { bg: '#FBEAF0', text: '#72243E' },
];

function generateChartData(range) {
  if (range === 'Today') {
    const hours = ['6am','7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm'];
    return hours.map((h, i) => ({
      label: h,
      revenue: Math.round(800 + Math.sin(i * 0.8) * 400 + i * 700 + Math.random() * 500),
      orders:  Math.round(5 + i * 5 + Math.random() * 8),
    }));
  }
  if (range === '7 days') {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return days.map(d => ({
      label: d,
      revenue: Math.round(40000 + Math.random() * 30000),
      orders:  Math.round(80 + Math.random() * 60),
    }));
  }
  const weeks = Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);
  return weeks.map(w => ({
    label: w,
    revenue: Math.round(200000 + Math.random() * 100000),
    orders:  Math.round(400 + Math.random() * 200),
  }));
}

const KANBAN_COLS = [
  { key: 'pending',   label: 'Pending' },
  { key: 'paid',      label: 'Paid' },
  { key: 'assigned',  label: 'Assigned' },
  { key: 'picked_up', label: 'In transit' },
  { key: 'delivered', label: 'Delivered' },
];

export default function AdminDashboard() {
  const [orders,      setOrders]      = useState([]);
  const [liveRiders,  setLiveRiders]  = useState([]);
  const [allRiders,   setAllRiders]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [range,       setRange]       = useState('Today');
  const [statusFilter,setStatusFilter]= useState('all');
  const [chartData,   setChartData]   = useState(() => generateChartData('Today'));
  const [view,        setView]        = useState('overview'); // overview | orders

  const refresh = useCallback(async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const [ordersRes, liveRes, ridersRes] = await Promise.all([
        getAllOrders(params),
        getLiveRiders(),
        api.get('/riders/active/'),
      ]);
      setOrders(ordersRes.data);
      setLiveRiders(liveRes.data);
      setAllRiders(ridersRes.data);
    } catch {}
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const t = setInterval(refresh, 10000); return () => clearInterval(t); }, [refresh]);
  useEffect(() => { setChartData(generateChartData(range)); }, [range]);

  const byStatus = (s) => orders.filter(o => o.status === s);

  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const activeOrders = orders.filter(o =>
    ['assigned', 'picked_up'].includes(o.status)
  ).length;

  const deliveredToday = byStatus('delivered').length;

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  return (
    <div className="dashboard-shell">
      <Sidebar />

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div className="topbar">
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Operations overview</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>
              {format(new Date(), "EEEE, d MMMM yyyy")} — Nairobi
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-600)' }}>
              <span className="pulse" />
              Live
            </div>
            <div className="tab-group">
              {['Today', '7 days', '30 days'].map(r => (
                <button
                  key={r}
                  className={`tab-btn ${range === r ? 'active' : ''}`}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="tab-group">
              {['overview', 'orders'].map(v => (
                <button
                  key={v}
                  className={`tab-btn ${view === v ? 'active' : ''}`}
                  onClick={() => setView(v)}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="dash-content">

          {/* KPIs */}
          <div className="kpi-grid">
            <KpiCard
              label="Total revenue"
              value={`KES ${Math.round(totalRevenue).toLocaleString()}`}
              delta="12.4% vs yesterday"
              deltaType="up"
              accentColor="#1D9E75"
              icon="💰"
            />
            <KpiCard
              label="Orders today"
              value={orders.length}
              delta={`${activeOrders} active now`}
              deltaType="up"
              accentColor="#378ADD"
              icon="📋"
            />
            <KpiCard
              label="Active riders"
              value={liveRiders.length}
              delta={`${allRiders.filter(r => r.is_available).length} available`}
              deltaType="up"
              accentColor="#BA7517"
              icon="🏍️"
            />
            <KpiCard
              label="Delivered today"
              value={deliveredToday}
              delta="Avg 24 min"
              deltaType={deliveredToday > 80 ? 'up' : 'down'}
              accentColor="#7F77DD"
              icon="✅"
            />
          </div>

          {view === 'overview' && (
            <>
              {/* Chart + Feed */}
              <div className="two-col">
                <div className="dash-card">
                  <div className="card-head">
                    <div className="card-title">Revenue &amp; orders — {range}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#0F6E56', background: '#E1F5EE', padding: '3px 10px', borderRadius: 20 }}>
                        KES {Math.round(totalRevenue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    <RevenueChart data={chartData} type="area" />
                  </div>
                </div>

                <div className="dash-card">
                  <div className="card-head">
                    <div className="card-title">Live activity feed</div>
                    <span className="pulse" />
                  </div>
                  <div className="feed-list">
                    {orders.slice(0, 6).map((order, i) => {
                      const dots = {
                        delivered: '#1D9E75',
                        picked_up: '#378ADD',
                        assigned:  '#7F77DD',
                        paid:      '#BA7517',
                        pending:   '#9CA3AF',
                        cancelled: '#E24B4A',
                      };
                      return (
                        <div className="feed-row" key={order.id}>
                          <div className="feed-dot" style={{ background: dots[order.status] }} />
                          <div>
                            <div className="feed-text">
                              Order #{order.id} — {order.status.replace('_', ' ')}
                              {i === 0 && <span className="new-chip">new</span>}
                            </div>
                            <div className="feed-time">
                              {order.customer?.username} · {order.delivery_address}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {orders.length === 0 && (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>
                        No activity yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Kanban */}
              <div className="dash-card">
                <div className="card-head">
                  <div className="card-title">Orders kanban</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {orders.length} total · drag to move (Phase 2)
                  </div>
                </div>
                <div className="kanban-board">
                  {KANBAN_COLS.map(col => {
                    const colOrders = byStatus(col.key);
                    const colors = STATUS_COLORS[col.key];
                    return (
                      <div className="kanban-col" key={col.key}>
                        <div className="kanban-col-head">
                          {col.label}
                          <div className="k-count" style={{ background: colors.bg, color: colors.text }}>
                            {colOrders.length}
                          </div>
                        </div>
                        {colOrders.slice(0, 3).map(order => (
                          <div className="k-card" key={order.id}>
                            <div className="k-card-id">#{order.id}</div>
                            <div className="k-card-name">{order.customer?.username}</div>
                            <div className="k-card-meta">
                              KES {parseFloat(order.total_amount).toLocaleString()}
                            </div>
                            {order.rider && (
                              <div style={{ fontSize: 10, color: '#0F6E56', marginTop: 3 }}>
                                🏍 {order.rider.username}
                              </div>
                            )}
                            {col.key === 'picked_up' && (
                              <div style={{ fontSize: 10, color: '#0F6E56', marginTop: 3 }}>
                                ETA ~{Math.round(Math.random() * 8 + 2)} min
                              </div>
                            )}
                            <div className="k-bar"
                              style={{ background: colors.bg, width: col.key === 'delivered' ? '100%' : col.key === 'picked_up' ? '65%' : '100%' }}
                            />
                          </div>
                        ))}
                        {colOrders.length > 3 && (
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', padding: '4px 0' }}>
                            +{colOrders.length - 3} more
                          </div>
                        )}
                        {colOrders.length === 0 && (
                          <div style={{ border: '0.5px dashed var(--gray-200)', borderRadius: 8, padding: '16px', textAlign: 'center', fontSize: 11, color: 'var(--gray-400)' }}>
                            Empty
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Riders */}
              <div className="dash-card">
                <div className="card-head">
                  <div className="card-title">Active riders</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {liveRiders.length} live · {allRiders.filter(r => r.is_available).length} available
                  </div>
                </div>
                {liveRiders.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)' }}>
                    No riders online. Riders appear here when they push a location update.
                  </div>
                ) : (
                  <div className="rider-grid">
                    {liveRiders.map((rider, i) => {
                      const color = RIDER_COLORS[i % RIDER_COLORS.length];
                      const initials = rider.rider_name?.slice(0, 2).toUpperCase() || '??';
                      const isAvailable = !rider.active_order_id;
                      return (
                        <div className="rider-tile" key={rider.rider_id}>
                          <div className="rider-tile-top">
                            <div className="r-avatar" style={{ background: color.bg, color: color.text }}>
                              {initials}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{rider.rider_name}</div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{rider.vehicle_type}</div>
                            </div>
                            <div className="r-status">
                              <div className="status-dot" style={{ background: isAvailable ? '#1D9E75' : '#378ADD' }} />
                              <span style={{ color: isAvailable ? '#0F6E56' : '#185FA5', fontSize: 11 }}>
                                {isAvailable ? 'Available' : 'En route'}
                              </span>
                            </div>
                          </div>
                          {rider.active_order_id && (
                            <div style={{ fontSize: 11, background: '#E6F1FB', color: '#0C447C', padding: '4px 8px', borderRadius: 6, marginBottom: 8 }}>
                              Order #{rider.active_order_id} · {rider.latitude?.slice(0, 7)}, {rider.longitude?.slice(0, 7)}
                            </div>
                          )}
                          <div className="r-stats">
                            <div className="r-stat">
                              <div className="r-stat-val">{rider.active_order_id ? '1' : '0'}</div>
                              <div className="r-stat-lab">Active</div>
                            </div>
                            <div className="r-stat">
                              <div className="r-stat-val">—</div>
                              <div className="r-stat-lab">Avg time</div>
                            </div>
                            <div className="r-stat">
                              <div className="r-stat-val">—</div>
                              <div className="r-stat-lab">Rating</div>
                            </div>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            {isAvailable ? (
                              <button className="btn btn-green" style={{ width: '100%', fontSize: 12 }}>
                                Assign order
                              </button>
                            ) : (
                              <button className="btn btn-blue" style={{ width: '100%', fontSize: 12 }}>
                                Track live
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {view === 'orders' && (
            <div className="dash-card">
              <div className="card-head">
                <div className="card-title">All orders</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    style={{ padding: '5px 10px', border: '0.5px solid var(--gray-200)', borderRadius: 8, fontSize: 12, background: '#fff' }}
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    {['pending','paid','assigned','picked_up','delivered','cancelled'].map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={refresh}>
                    Refresh
                  </button>
                </div>
              </div>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading...</div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No orders found.</div>
              ) : (
                <OrdersTable orders={filteredOrders} onRefresh={refresh} />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}