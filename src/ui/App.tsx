import { NavLink, Outlet } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Inventory', copy: 'Monitor menu & availability', end: true },
  { to: '/orders', label: 'Orders', copy: 'Track live fulfilment', end: false },
  { to: '/dashboard', label: 'Insights', copy: 'Forecast & health', end: false },
];

export default function App() {
  return (
    <div className="app-shell">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <nav className="nav-panel">
        {NAV_LINKS.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `nav-card${isActive ? ' active' : ''}`}
          >
            <span className="nav-card-label">{link.label}</span>
            <span className="nav-card-copy">{link.copy}</span>
            <span className="pill">{link.end ? 'Live' : 'Focus'}</span>
          </NavLink>
        ))}
      </nav>

      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
