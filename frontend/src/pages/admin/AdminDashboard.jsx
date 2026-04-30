import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import Sidebar from '../../components/admin/Sidebar';
import OrdersTable from '../../components/admin/OrdersTable';
import { getAllOrders, autoDispatch } from '../../api/orders';
import { getLiveRiders } from '../../api/tracking';
import NotificationBell from '../../components/shared/NotificationBell';
import api from '../../api/axios';
import '../../styles/dashboard.css';

const STATUS_COLORS = {
  pending:   { bg: '#FAEEDA', tc: '#633806',  bar: '#BA7517' },
  paid:      { bg: '#E1F5EE', tc: '#085041',  bar: '#1D9E75' },
  assigned:  { bg: '#EEEDFE', tc: '#3C3489',  bar: '#7F77DD' },
  picked_up: { bg: '#FBEAF0', tc: '#72243E',  bar: '#D4537E' },
  delivered: { bg: '#E1F5EE', tc: '#085041',  bar: '#1D9E75' },
  cancelled: { bg: '#FCEBEB', tc: '#791F1F',  bar: '#E24B4A' },
};

const RIDER_COLORS = [
  { bg:'#E1F5EE', tc:'#085041' },
  { bg:'#E6F1FB', tc:'#0C447C' },
  { bg:'#EEEDFE', tc:'#3C3489' },
  { bg:'#FAEEDA', tc:'#633806' },
  { bg:'#FBEAF0', tc:'#72243E' },
];

const KANBAN_COLS = [
  { key:'pending',   label:'Pending'  },
  { key:'paid',      label:'Paid'     },
  { key:'assigned',  label:'Assigned' },
  { key:'picked_up', label:'Transit'  },
  { key:'delivered', label:'Done'     },
];

function genChartData(range) {
  const days  = range === '7d' ? 7 : 30;
  const labels = range === '7d'
    ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    : Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - 29 + i);
        return `${d.getDate()}/${d.getMonth()+1}`;
      });
  return labels.map(l => ({
    date:    l,
    revenue: Math.round(30000 + Math.random() * 70000),
    orders:  Math.round(40 + Math.random() * 90),
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'#fff', border:'1px solid #F0EBE3',
      borderRadius:10, padding:'10px 14px', fontSize:12,
    }}>
      <div style={{ fontWeight:700, marginBottom:6, color:'#1A1207' }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, marginBottom:2 }}>
          {p.name}: {p.name === 'Revenue'
            ? `KES ${Math.round(p.value).toLocaleString()}`
            : p.value}
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [orders,      setOrders]      = useState([]);
  const [liveRiders,  setLiveRiders]  = useState([]);
  const [allRiders,   setAllRiders]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [range,       setRange]       = useState('7d');
  const [statusFilter,setStatusFilter]= useState('all');
  const [view,        setView]        = useState('overview');
  const [chartData,   setChartData]   = useState(() => genChartData('7d'));
  const [dispatching, setDispatching] = useState(null);

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
  useEffect(() => { setChartData(genChartData(range)); }, [range]);

  const byStatus  = s => orders.filter(o => o.status === s);
  const totalRev  = orders.filter(o => o.status === 'delivered')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const activeOrd = orders.filter(o =>
    ['assigned','picked_up'].includes(o.status)
  ).length;

  const handleAutoDispatch = async (orderId) => {
    setDispatching(orderId);
    try {
      const res = await autoDispatch(orderId);
      alert(`Dispatched to ${res.data.rider_name} · ${res.data.distance_km}km away`);
      await refresh();
    } catch (err) {
      alert(err.response?.data?.reason || 'No riders available.');
    } finally { setDispatching(null); }
  };

  return (
    <div className="dashboard-shell">
      <Sidebar />

      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="topbar-brand">
              Scott<span>.</span> Operations
            </div>
            <div className="topbar-sub">
              {format(new Date(), "EEEE d MMMM yyyy")} · Nairobi
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6B5E52' }}>
              <span className="pulse-live" />
              Live
            </div>
            <div className="tab-group">
              {['Today','7 days','30 days'].map(r => (
                <button
                  key={r}
                  className={`tab-btn ${range === (r==='Today'?'7d':r==='7 days'?'7d':'30d') ? 'active' : ''}`}
                  onClick={() => setRange(r === '30 days' ? '30d' : '7d')}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="tab-group">
              {['overview','orders'].map(v => (
                <button
                  key={v}
                  className={`tab-btn ${view === v ? 'active' : ''}`}
                  onClick={() => setView(v)}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <NotificationBell />
          </div>
        </div>

        {/* Content */}
        <div className="dash-content">

          {/* KPI row */}
          <div className="kpi-grid">
            {[
              { label:'Total revenue',    value:`KES ${Math.round(totalRev).toLocaleString()}`, delta:'12.4% vs yesterday', type:'up',   accent:'#E8521A', icon:'💰' },
              { label:'Orders today',     value:orders.length,                                  delta:`${activeOrd} active`, type:'up',   accent:'#1D9E75', icon:'📋' },
              { label:'Active riders',    value:liveRiders.length,                              delta:`${allRiders.filter(r=>r.is_available).length} available`, type:'up', accent:'#378ADD', icon:'🏍️' },
              { label:'Delivered today',  value:byStatus('delivered').length,                   delta:'Avg 24 min',          type:'up',   accent:'#BA7517', icon:'✅' },
            ].map(k => (
              <div className="kpi-card" key={k.label}>
                <div className="kpi-accent" style={{ background:k.accent }} />
                <div style={{ flex:1 }}>
                  <div className="kpi-label">{k.icon} {k.label}</div>
                  <div className="kpi-value">{k.value}</div>
                  <div className={`kpi-delta delta-${k.type}`}>
                    {k.type === 'up' ? '↑' : '↓'} {k.delta}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {view === 'overview' && (
            <>
              {/* Chart + Feed */}
              <div className="two-col">
                <div className="dash-card">
                  <div className="card-head">
                    <div className="card-title">Revenue trend</div>
                    <div className="tab-group">
                      {['7d','30d'].map(r => (
                        <button
                          key={r}
                          className={`tab-btn ${range === r ? 'active' : ''}`}
                          onClick={() => setRange(r)}
                        >
                          {r === '7d' ? '7 days' : '30 days'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={chartData} margin={{ top:4, right:4, left:0, bottom:0 }}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#E8521A" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#E8521A" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#1D9E75" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#1D9E75" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE3"/>
                        <XAxis dataKey="date" tick={{ fontSize:11, fill:'#B0A396' }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fontSize:11, fill:'#B0A396' }} axisLine={false} tickLine={false}
                          tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Area type="monotone" dataKey="revenue" name="Revenue"
                          stroke="#E8521A" strokeWidth={2} fill="url(#revGrad)" dot={false}/>
                        <Area type="monotone" dataKey="orders" name="Orders"
                          stroke="#1D9E75" strokeWidth={1.5} fill="url(#ordGrad)" dot={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="dash-card">
                  <div className="card-head">
                    <div className="card-title">Live activity</div>
                    <span className="pulse-live"/>
                  </div>
                  <div className="feed-list">
                    {orders.slice(0, 6).map((order, i) => {
                      const dots = { delivered:'#1D9E75', picked_up:'#378ADD', assigned:'#7F77DD', paid:'#BA7517', pending:'#B0A396', cancelled:'#E24B4A' };
                      return (
                        <div className="feed-row" key={order.id}>
                          <div className="feed-dot" style={{ background:dots[order.status] }}/>
                          <div>
                            <div className="feed-text">
                              Order #{order.id} — {order.status.replace('_',' ')}
                              {i===0 && <span className="new-chip">new</span>}
                            </div>
                            <div className="feed-time">
                              {order.customer?.username} · {order.delivery_address}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {orders.length === 0 && (
                      <div style={{ padding:24, textAlign:'center', color:'#B0A396', fontSize:13 }}>
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
                  <div style={{ fontSize:12, color:'#B0A396' }}>{orders.length} total</div>
                </div>
                <div className="kanban-board">
                  {KANBAN_COLS.map(col => {
                    const colOrders = byStatus(col.key);
                    const c = STATUS_COLORS[col.key] || {};
                    return (
                      <div className="kanban-col" key={col.key}>
                        <div className="kanban-col-head">
                          {col.label}
                          <div className="k-count" style={{ background:c.bg, color:c.tc }}>
                            {colOrders.length}
                          </div>
                        </div>
                        {colOrders.slice(0,3).map(order => (
                          <div className="k-card" key={order.id}>
                            <div className="k-card-id">#{order.id}</div>
                            <div className="k-card-name">{order.customer?.username}</div>
                            <div className="k-card-meta">
                              KES {parseFloat(order.total_amount).toLocaleString()}
                            </div>
                            {order.rider && (
                              <div style={{ fontSize:10, color:'#1D9E75', marginTop:3 }}>
                                🏍 {order.rider.username}
                              </div>
                            )}
                            {col.key === 'picked_up' && (
                              <div style={{ fontSize:10, color:'#E8521A', marginTop:3 }}>
                                ETA ~{Math.round(Math.random()*8+2)} min
                              </div>
                            )}
                            {col.key === 'paid' && (
                              <button
                                onClick={() => handleAutoDispatch(order.id)}
                                disabled={dispatching === order.id}
                                style={{
                                  width:'100%', marginTop:6,
                                  padding:'5px', background:'#E8521A',
                                  border:'none', borderRadius:6,
                                  color:'#fff', fontSize:10,
                                  fontWeight:700, cursor:'pointer',
                                }}
                              >
                                {dispatching === order.id ? '...' : 'Auto dispatch'}
                              </button>
                            )}
                            <div className="k-bar" style={{ background:c.bg, width:'100%' }}/>
                          </div>
                        ))}
                        {colOrders.length > 3 && (
                          <div style={{ fontSize:11, color:'#B0A396', textAlign:'center', padding:'4px 0' }}>
                            +{colOrders.length - 3} more
                          </div>
                        )}
                        {colOrders.length === 0 && (
                          <div style={{
                            border:'1px dashed #F0EBE3', borderRadius:8,
                            padding:16, textAlign:'center',
                            fontSize:11, color:'#B0A396',
                          }}>
                            Empty
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live riders */}
              <div className="dash-card">
                <div className="card-head">
                  <div className="card-title">Active riders</div>
                  <div style={{ fontSize:12, color:'#B0A396' }}>
                    {liveRiders.length} live · {allRiders.filter(r=>r.is_available).length} available
                  </div>
                </div>
                {liveRiders.length === 0 ? (
                  <div style={{ padding:32, textAlign:'center', color:'#B0A396', fontSize:13 }}>
                    No riders online right now
                  </div>
                ) : (
                  <div className="rider-grid">
                    {liveRiders.map((rider, i) => {
                      const color = RIDER_COLORS[i % RIDER_COLORS.length];
                      const isAvail = !rider.active_order_id;
                      return (
                        <div className="rider-tile" key={rider.rider_id}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                            <div style={{
                              width:36, height:36, borderRadius:'50%',
                              background:color.bg, color:color.tc,
                              display:'flex', alignItems:'center',
                              justifyContent:'center', fontSize:12,
                              fontWeight:700, flexShrink:0,
                            }}>
                              {rider.rider_name?.slice(0,2).toUpperCase()}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:700 }}>{rider.rider_name}</div>
                              <div style={{ fontSize:11, color:'#B0A396' }}>{rider.vehicle_type}</div>
                            </div>
                            <div style={{
                              display:'flex', alignItems:'center', gap:4,
                              fontSize:11,
                              color: isAvail ? '#1D9E75' : '#378ADD',
                            }}>
                              <div style={{
                                width:7, height:7, borderRadius:'50%',
                                background: isAvail ? '#1D9E75' : '#378ADD',
                              }}/>
                              {isAvail ? 'Available' : 'En route'}
                            </div>
                          </div>
                          {rider.active_order_id && (
                            <div style={{
                              fontSize:11, background:'#E6F1FB',
                              color:'#0C447C', padding:'4px 8px',
                              borderRadius:6, marginBottom:8,
                            }}>
                              Order #{rider.active_order_id}
                            </div>
                          )}
                          <button
                            className={`btn ${isAvail ? 'btn-green' : 'btn'}`}
                            style={{ width:'100%', fontSize:12 }}
                          >
                            {isAvail ? 'Assign order' : 'Track live'}
                          </button>
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
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <select
                    style={{
                      padding:'6px 12px',
                      border:'1px solid #F0EBE3',
                      borderRadius:8, fontSize:12,
                      background:'#fff', color:'#1A1207',
                      fontFamily:'inherit',
                    }}
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    {['pending','paid','assigned','picked_up','delivered','cancelled'].map(s => (
                      <option key={s} value={s}>{s.replace('_',' ')}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary" style={{ fontSize:12 }} onClick={refresh}>
                    Refresh
                  </button>
                </div>
              </div>
              {loading ? (
                <div style={{ padding:40, textAlign:'center', color:'#B0A396' }}>Loading...</div>
              ) : (
                <OrdersTable
                  orders={statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)}
                  onRefresh={refresh}
                />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}