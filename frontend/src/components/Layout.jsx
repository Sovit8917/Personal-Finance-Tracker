import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/expenses', label: 'Expenses', icon: '💸' },
  { to: '/income', label: 'Income', icon: '💰' },
  { to: '/budgets', label: 'Budgets', icon: '🎯' },
  { to: '/transactions', label: 'History', icon: '📋' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff' }}>
            Fin<span style={{ color: 'var(--accent)' }}>Track</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Personal Finance</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 4,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                transition: 'all 0.18s',
              })}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{user?.email}</div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
