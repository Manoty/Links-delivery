import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin',           icon: '⊞',  label: 'Overview',      end: true  },
  { to: '/admin/orders',    icon: '≡',  label: 'Orders',        badge: null },
  { to: '/admin/riders',    icon: '◉',  label: 'Riders'                    },
  { to: '/admin/analytics', icon: '↗',  label: 'Analytics'                 },
  { to: '/admin/settings',  icon: '⚙',  label: 'Settings'                  },
];

export default function Sidebar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'AD';

  return (
    <aside className="sidebar">
      {/* Scott logo mark */}
      <div
        className="sidebar-logo"
        onClick={() => navigate('/admin')}
        title="Scott. Operations"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10l4 4 8-8" stroke="#fff" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Nav items */}
      {NAV.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          title={item.label}
          className={({ isActive }) =>
            `nav-icon-item ${isActive ? 'active' : ''}`
          }
        >
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          {item.badge && <span className="nav-badge">{item.badge}</span>}
        </NavLink>
      ))}

      <div className="sidebar-spacer" />

      {/* Logout avatar */}
      <div
        className="sidebar-avatar"
        onClick={logoutUser}
        title={`${user?.username} — click to sign out`}
      >
        {initials}
      </div>
    </aside>
  );
}