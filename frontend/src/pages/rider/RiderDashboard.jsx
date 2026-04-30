import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/shared/Toast';
import { getAvailableOrders, acceptOrder, rejectOrder, updateOrderStatus } from '../../api/orders';
import { updateLocation, getMyRatings } from '../../api/tracking';
import NotificationBell from '../../components/shared/NotificationBell';
import api from '../../api/axios';
import '../../styles/app.css';

const SLA_MINUTES = 30;

function SlaTimer({ assignedAt }) {
  const [left, setLeft] = useState(SLA_MINUTES * 60);

  useEffect(() => {
    if (!assignedAt) return;
    const start = new Date(assignedAt).getTime();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setLeft(Math.max(0, SLA_MINUTES * 60 - elapsed));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [assignedAt]);

  const mins = Math.floor(left / 60);
  const secs = left % 60;
  const pct  = left / (SLA_MINUTES * 60);
  const bg   = pct > 0.5 ? '#E8521A' : pct > 0.25 ? '#BA7517' : '#E24B4A';

  return (
    <div style={{
      fontSize:11, background:bg,
      color:'#fff', padding:'3px 10px',
      borderRadius:20, fontWeight:700,
    }}>
      SLA: {mins}:{String(secs).padStart(2,'0')}
    </div>
  );
}

export default function RiderDashboard() {
  const { user, logoutUser } = useAuth();
  const toast = useToast();

  const [profile,     setProfile]     = useState(null);
  const [isOnline,    setIsOnline]    = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [available,   setAvailable]   = useState([]);
  const [history,     setHistory]     = useState([]);
  const [ratingData,  setRatingData]  = useState(null);
  const [tab,         setTab]         = useState('active');
  const [loading,     setLoading]     = useState(true);
  const locationRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [profRes, availRes, mineRes] = await Promise.all([
        api.get('/riders/profile/'),
        getAvailableOrders(),
        api.get('/orders/rider/'),
      ]);
      setProfile(profRes.data);
      setIsOnline(profRes.data.is_available);
      setAvailable(availRes.data);
      const mine    = mineRes.data;
      const active  = mine.find(o => ['assigned','picked_up'].includes(o.status));
      setActiveOrder(active || null);
      setHistory(mine.filter(o => o.status === 'delivered').slice(0,10));
    } catch {}
    setLoading(false);
  }, []);

  const fetchRatings = useCallback(async () => {
    try {
      const res = await api.get('/orders/my-ratings/');
      setRatingData(res.data);
    } catch {}
  }, []);

  useEffect(() => { refresh(); fetchRatings(); }, [refresh, fetchRatings]);
  useEffect(() => {
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);
  useEffect(() => () => clearInterval(locationRef.current), []);

  const startLocation = () => {
    if (locationRef.current) return;
    locationRef.current = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        updateLocation({
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          order_id:  activeOrder?.id || null,
        }).catch(() => {});
      }, () => {});
    }, 5000);
  };

  const stopLocation = () => {
    clearInterval(locationRef.current);
    locationRef.current = null;
  };

  const toggleOnline = async () => {
    const next = !isOnline;
    try {
      await api.put('/riders/profile/', {
        is_available: next,
        vehicle_type: profile?.vehicle_type || 'motorcycle',
      });
      setIsOnline(next);
      if (next) { startLocation(); toast.success('You are now online.'); }
      else       { stopLocation();  toast.info('You are offline.');       }
    } catch { toast.error('Could not update status.'); }
  };

  const handleAccept = async (orderId) => {
    try {
      await acceptOrder(orderId);
      toast.success('Order accepted!');
      await refresh();
      setTab('active');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not accept order.');
    }
  };

  const handleReject = async (orderId) => {
    try { await rejectOrder(orderId); toast.info('Order rejected.'); await refresh(); }
    catch {}
  };

  const handleStatus = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      if (nextStatus === 'delivered') toast.success('Delivery complete! Great work. 🎉');
      else toast.success('Status updated.');
      await refresh();
    } catch (err) { toast.error(err.response?.data?.error || 'Update failed.'); }
  };

  const todayEarnings = history.reduce((s,o) => s + parseFloat(o.total_amount)*0.15, 0);
  const initials      = user?.username?.slice(0,2).toUpperCase() || 'RD';

  return (
    <div style={{ background:'#1A1207', minHeight:'100vh' }}>
      <div style={{ maxWidth:480, margin:'0 auto', background:'#FFF8F3', minHeight:'100vh', display:'flex', flexDirection:'column' }}>

        {/* ── TOPBAR ── */}
        <div style={{
          background:'#1A1207',
          padding:'16px 18px 14px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:36, height:36, borderRadius:'50%',
              background:'rgba(255,255,255,0.1)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:700, color:'#fff',
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>
                Scott<span style={{ color:'#E8521A' }}>.</span> Rider
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:1 }}>
                {user?.username} · {profile?.vehicle_type || 'Rider'}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <NotificationBell />
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ fontSize:11, color: isOnline ? '#9FE1CB' : 'rgba(255,255,255,0.35)', fontWeight:600 }}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <div
                onClick={toggleOnline}
                style={{
                  width:44, height:24, borderRadius:12, cursor:'pointer',
                  background: isOnline ? '#1D9E75' : 'rgba(255,255,255,0.15)',
                  position:'relative', transition:'background 0.2s',
                }}
              >
                <div style={{
                  width:20, height:20, borderRadius:'50%', background:'#fff',
                  position:'absolute', top:2,
                  left: isOnline ? 22 : 2,
                  transition:'left 0.2s',
                }}/>
              </div>
            </div>
          </div>
        </div>

        {/* Online notice */}
        {isOnline && (
          <div style={{
            background:'#E1F5EE', padding:'8px 18px',
            display:'flex', alignItems:'center', gap:7,
            fontSize:12, color:'#085041', fontWeight:600,
          }}>
            <div style={{
              width:7, height:7, borderRadius:'50%', background:'#1D9E75',
              animation:'pulse 2s infinite',
            }}/>
            Location sharing active — updating every 5 seconds
          </div>
        )}

        {/* ── EARNINGS GRID ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'14px 18px 4px' }}>
          {[
            { label:"Today's earnings", value:`KES ${Math.round(todayEarnings).toLocaleString()}`, accent:'#E8521A' },
            { label:'Deliveries today', value:history.length,                                        accent:'#1D9E75' },
            { label:'Avg delivery',     value:`${profile ? 21 : '—'} min`,                          accent:'#378ADD' },
            { label:'Your rating',      value: ratingData?.average ? `${ratingData.average} ★` : '—', accent:'#BA7517' },
          ].map(s => (
            <div key={s.label} style={{
              background:'#fff', border:'1px solid #F0EBE3',
              borderRadius:14, padding:'12px 14px',
              display:'flex', gap:10,
            }}>
              <div style={{ width:3, borderRadius:2, background:s.accent, alignSelf:'stretch' }}/>
              <div>
                <div style={{ fontSize:20, fontWeight:700, color:'#1A1207', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11, color:'#B0A396', marginTop:4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{
          display:'flex', gap:4,
          background:'#F5EDE4', borderRadius:10,
          padding:4, margin:'12px 18px 4px',
        }}>
          {[
            { key:'active',    label:'Active order'           },
            { key:'available', label:`Available (${available.length})` },
            { key:'history',   label:'History'                },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex:1, padding:'8px 4px',
                borderRadius:8, border:'none',
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? '#1A1207' : '#B0A396',
                fontSize:12, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit',
                boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ACTIVE TAB ── */}
        {tab === 'active' && (
          <div style={{ padding:'12px 18px', flex:1 }}>
            {!activeOrder ? (
              <div style={{ textAlign:'center', padding:'48px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🏍️</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#1A1207', marginBottom:6 }}>
                  No active order
                </div>
                <div style={{ fontSize:13, color:'#B0A396', marginBottom:20 }}>
                  {isOnline
                    ? 'Switch to Available to pick up an order'
                    : 'Go online to start receiving orders'}
                </div>
                {!isOnline && (
                  <button
                    onClick={toggleOnline}
                    style={{
                      padding:'12px 28px', background:'#E8521A',
                      color:'#fff', border:'none', borderRadius:12,
                      fontSize:15, fontWeight:700, cursor:'pointer',
                    }}
                  >
                    Go online →
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                background:'#fff', border:'2px solid #E8521A',
                borderRadius:18, overflow:'hidden',
              }}>
                {/* Card header */}
                <div style={{
                  background:'#1A1207', padding:'12px 16px',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                }}>
                  <div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>Active order</div>
                    <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>
                      #{activeOrder.id} · KES {parseFloat(activeOrder.total_amount).toLocaleString()}
                    </div>
                  </div>
                  <SlaTimer assignedAt={activeOrder.updated_at}/>
                </div>

                {/* Route */}
                <div style={{ padding:16 }}>
                  <div style={{ display:'flex', gap:12, marginBottom:14 }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:4 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:'#BA7517' }}/>
                      <div style={{ width:1, height:28, background:'#F0EBE3', margin:'4px 0' }}/>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:'#E8521A' }}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ marginBottom:10 }}>
                        <div style={{ fontSize:11, color:'#B0A396', marginBottom:1 }}>Pickup</div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#1A1207' }}>{activeOrder.pickup_address}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:11, color:'#B0A396', marginBottom:1 }}>Deliver to</div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#1A1207' }}>{activeOrder.delivery_address}</div>
                      </div>
                    </div>
                  </div>

                  {/* Customer */}
                  <div style={{
                    background:'#FFF8F3', borderRadius:10,
                    padding:'10px 14px', display:'flex',
                    alignItems:'center', gap:10, marginBottom:14,
                  }}>
                    <div style={{
                      width:34, height:34, borderRadius:'50%',
                      background:'#E1F5EE', color:'#085041',
                      display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:12, fontWeight:700,
                    }}>
                      {activeOrder.customer?.username?.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700 }}>{activeOrder.customer?.username}</div>
                      <div style={{ fontSize:11, color:'#B0A396' }}>{activeOrder.customer?.phone_number}</div>
                    </div>
                    <a                    
                      href={`tel:${activeOrder.customer?.phone_number}`}
                      style={{
                        width:36, height:36, borderRadius:'50%',
                        background:'#E1F5EE', display:'flex',
                        alignItems:'center', justifyContent:'center',
                        fontSize:18, textDecoration:'none',
                      }}
                      >
                    
                      📞
                    </a>
                  </div>

                  {/* Items */}
                  <div style={{ fontSize:12, color:'#B0A396', marginBottom:16 }}>
                    {activeOrder.items?.map(i => `${i.quantity}× ${i.name}`).join(' · ')}
                  </div>

                  {/* CTA */}
                  {activeOrder.status === 'assigned' && (
                    <button
                      onClick={() => handleStatus(activeOrder.id, 'picked_up')}
                      style={{
                        width:'100%', padding:14,
                        background:'#E8521A', color:'#fff',
                        border:'none', borderRadius:12,
                        fontSize:15, fontWeight:700, cursor:'pointer',
                      }}
                    >
                      ✓ Mark as picked up
                    </button>
                  )}
                  {activeOrder.status === 'picked_up' && (
                    <button
                      onClick={() => handleStatus(activeOrder.id, 'delivered')}
                      style={{
                        width:'100%', padding:14,
                        background:'#1D9E75', color:'#fff',
                        border:'none', borderRadius:12,
                        fontSize:15, fontWeight:700, cursor:'pointer',
                      }}
                    >
                      ✓ Mark as delivered
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AVAILABLE TAB ── */}
        {tab === 'available' && (
          <div style={{ padding:'12px 0', flex:1 }}>
            {!isOnline && (
              <div style={{
                margin:'0 18px 12px',
                background:'#FAEEDA', borderRadius:12,
                padding:'12px 14px', fontSize:13, color:'#633806',
              }}>
                ⚠️ Go online to see available orders.
              </div>
            )}
            {available.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 0', color:'#B0A396' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#1A1207', marginBottom:4 }}>
                  No orders right now
                </div>
                <div style={{ fontSize:13 }}>New orders appear here automatically</div>
              </div>
            ) : (
              available.map(order => (
                <div key={order.id} style={{ margin:'0 18px 10px' }}>
                  <div style={{
                    background:'#fff', border:'1px solid #F0EBE3',
                    borderRadius:16, padding:16,
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:11, color:'#B0A396' }}>Order #{order.id}</div>
                        <div style={{ fontSize:20, fontWeight:700, color:'#E8521A', marginTop:2 }}>
                          KES {parseFloat(order.total_amount).toLocaleString()}
                        </div>
                      </div>
                      <div style={{
                        background:'#E8521A', color:'#fff',
                        fontSize:11, fontWeight:700,
                        padding:'3px 10px', borderRadius:20,
                      }}>
                        ~0.8 km
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:3 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'#BA7517' }}/>
                        <div style={{ width:1, height:20, background:'#F0EBE3', margin:'2px 0' }}/>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'#E8521A' }}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, color:'#6B5E52', marginBottom:6, fontWeight:500 }}>
                          {order.pickup_address}
                        </div>
                        <div style={{ fontSize:12, color:'#6B5E52', fontWeight:500 }}>
                          {order.delivery_address}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize:12, color:'#B0A396', marginBottom:12 }}>
                      {order.items?.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                    </div>

                    <div style={{ display:'flex', gap:8 }}>
                      <button
                        onClick={() => handleAccept(order.id)}
                        style={{
                          flex:2, padding:11, background:'#E8521A',
                          color:'#fff', border:'none', borderRadius:10,
                          fontSize:14, fontWeight:700, cursor:'pointer',
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(order.id)}
                        style={{
                          flex:1, padding:11, background:'#FFF0E8',
                          color:'#E8521A', border:'1px solid #F0EBE3',
                          borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer',
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div style={{ padding:'12px 0', flex:1 }}>
            {/* Earnings card */}
            <div style={{
              margin:'0 18px 16px',
              background:'#1A1207', borderRadius:16, padding:18,
            }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>
                This week's earnings
              </div>
              <div style={{ fontSize:30, fontWeight:900, color:'#fff', marginBottom:14 }}>
                KES {(Math.round(todayEarnings) * 5).toLocaleString()}
              </div>
              {/* Mini bars */}
              <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:40 }}>
                {[0.4,0.7,0.5,0.9,0.6,1.0,0.8].map((h,i) => (
                  <div key={i} style={{
                    flex:1, borderRadius:'3px 3px 0 0',
                    background: i===6 ? '#E8521A' : 'rgba(255,255,255,0.15)',
                    height:`${h*100}%`,
                  }}/>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                {['M','T','W','T','F','S','S'].map((d,i) => (
                  <div key={i} style={{
                    flex:1, textAlign:'center',
                    fontSize:10,
                    color: i===6 ? '#E8521A' : 'rgba(255,255,255,0.3)',
                    fontWeight: i===6 ? 700 : 400,
                  }}>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Ratings summary */}
            {ratingData && ratingData.count > 0 && (
              <div style={{
                margin:'0 18px 16px',
                background:'#fff', border:'1px solid #F0EBE3',
                borderRadius:16, padding:16,
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#1A1207' }}>Your ratings</div>
                  <div style={{ fontSize:12, color:'#B0A396' }}>{ratingData.count} reviews</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:36, fontWeight:900, color:'#1A1207', lineHeight:1 }}>
                      {ratingData.average}
                    </div>
                    <div style={{ fontSize:11, color:'#B0A396', marginTop:2 }}>out of 5</div>
                  </div>
                  <div style={{ flex:1 }}>
                    {[5,4,3,2,1].map(star => {
                      const count = ratingData.ratings?.filter(r => r.stars === star).length || 0;
                      const pct   = ratingData.count > 0 ? (count/ratingData.count)*100 : 0;
                      return (
                        <div key={star} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                          <div style={{ fontSize:11, color:'#B0A396', width:12 }}>{star}</div>
                          <div style={{ flex:1, height:4, background:'#F0EBE3', borderRadius:2 }}>
                            <div style={{ width:`${pct}%`, height:4, background:'#BA7517', borderRadius:2 }}/>
                          </div>
                          <div style={{ fontSize:11, color:'#B0A396', width:20 }}>{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Delivery history */}
            {history.length === 0 ? (
              <div style={{ textAlign:'center', padding:32, color:'#B0A396', fontSize:13 }}>
                No completed deliveries yet
              </div>
            ) : (
              history.map(order => (
                <div key={order.id} style={{
                  margin:'0 18px 8px',
                  background:'#fff', border:'1px solid #F0EBE3',
                  borderRadius:14, padding:'12px 16px',
                  display:'flex', alignItems:'center', gap:12,
                }}>
                  <div style={{
                    width:36, height:36, borderRadius:'50%',
                    background:'#E1F5EE', display:'flex',
                    alignItems:'center', justifyContent:'center',
                    fontSize:18, flexShrink:0,
                  }}>
                    ✓
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#1A1207' }}>
                      Order #{order.id}
                    </div>
                    <div style={{
                      fontSize:12, color:'#B0A396', marginTop:1,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>
                      {order.delivery_address}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#E8521A' }}>
                      KES {Math.round(parseFloat(order.total_amount)*0.15).toLocaleString()}
                    </div>
                    <div style={{ fontSize:10, color:'#B0A396', marginTop:2 }}>
                      {new Date(order.updated_at).toLocaleTimeString('en-KE',{ hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── BOTTOM NAV ── */}
        <nav style={{
          background:'#fff', borderTop:'1px solid #F0EBE3',
          display:'flex', padding:'8px 0 4px',
          position:'sticky', bottom:0,
        }}>
          {[
            { key:'active',    icon:'🏍️', label:'Active'    },
            { key:'available', icon:'📋', label:'Available' },
            { key:'history',   icon:'📊', label:'History'   },
          ].map(item => (
            <div
              key={item.key}
              onClick={() => setTab(item.key)}
              style={{
                flex:1, display:'flex', flexDirection:'column',
                alignItems:'center', gap:3, cursor:'pointer', padding:'4px 0',
              }}
            >
              {tab === item.key && (
                <div style={{ width:4, height:4, borderRadius:'50%', background:'#E8521A', marginBottom:1 }}/>
              )}
              <div style={{ fontSize:20 }}>{item.icon}</div>
              <div style={{
                fontSize:10, fontWeight: tab === item.key ? 700 : 500,
                color: tab === item.key ? '#E8521A' : '#B0A396',
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </nav>

      </div>
    </div>
  );
}