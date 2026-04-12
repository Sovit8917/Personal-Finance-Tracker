import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  IconLayoutDashboard,
  IconReceipt,
  IconWallet,
  IconTarget,
  IconHistory,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: <IconLayoutDashboard size={18} />, end: true },
  { to: '/expenses', label: 'Expenses', icon: <IconReceipt size={18} /> },
  { to: '/income', label: 'Income', icon: <IconWallet size={18} /> },
  { to: '/budgets', label: 'Budgets', icon: <IconTarget size={18} /> },
  { to: '/transactions', label: 'History', icon: <IconHistory size={18} /> },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const ThemeToggle = () => (
    <button
      onClick={toggle}
      className="btn btn-ghost btn-sm"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ width: '100%', justifyContent: 'center', gap: 8, marginBottom: 8 }}
    >
      {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );

  return (
    <div className="layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
            Fin<span style={{ color: 'var(--accent)' }}>Track</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Personal Finance</div>
        </div>

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

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{user?.email}</div>
          <ThemeToggle />
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
          Fin<span style={{ color: 'var(--accent)' }}>Track</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Icon-only toggle for mobile */}
          <button onClick={toggle} className="btn btn-ghost btn-sm" title="Toggle theme">
            {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}