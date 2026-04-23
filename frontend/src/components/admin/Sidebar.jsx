import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  {
    section: 'Main',
    items: [
      { to: '/admin',         label: 'Overview',      icon: '▦', badge: null },
      { to: '/admin/orders',  label: 'Orders',        icon: '≡',  badge: 4 },
      { to: '/admin/riders',  label: 'Riders',        icon: '◉',  badge: null },
      { to: '/admin/customers', label: 'Customers',   icon: '◎',  badge: null },
    ]
  },
  {
    section: 'Analytics',
    items: [
      { to: '/admin/revenue', label: 'Revenue',       icon: '↗',  badge: null },
      { to: '/admin/dispatch-logs', label: 'Dispatch logs', icon: '◷', badge: null },
    ]
  },
  {
    section: 'System',
    items: [
      { to: '/admin/settings', label: 'Settings',    icon: '⚙',  badge: null },
    ]
  },
];

export default function Sidebar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'AD';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">🛵</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Scott Delivery</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Operations</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(group => (
          <div key={group.section}>
            <div className="nav-section">{group.section}</div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <span style={{ fontSize: 14, width: 16, textAlign: 'center' }}>
                  {item.icon}
                </span>
                {item.label}
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
          <div className="avatar" style={{ background: '#E6F1FB', color: '#0C447C' }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.username}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Super admin</div>
          </div>
          <button
            className="btn"
            style={{ padding: '4px 8px', fontSize: 11 }}
            onClick={logoutUser}
          >
            Out
          </button>
        </div>
      </div>
    </aside>
  );
}