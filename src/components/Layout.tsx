import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Handshake, Kanban, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/deals', label: 'Deals', icon: Handshake },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban }
];

export function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={17} />
          </div>
          <div>
            <div className="brand-name">Personal CRM</div>
            <div className="brand-sub">Your private sales desk</div>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="nav-item">
              <item.icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">Local · SQLite · no cloud</div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
    </div>
  );
}