import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Inventory', copy: 'Monitor menu & availability', end: true },
  { to: '/orders', label: 'Orders', copy: 'Track live fulfilment', end: false },
  { to: '/dashboard', label: 'Insights', copy: 'AI analytics & trends', end: false },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath =
    NAV_LINKS.find(link =>
      link.end ? location.pathname === link.to : location.pathname.startsWith(link.to)
    )?.to ?? '/';

  return (
    <div className="app-shell">
      <div className="orb orb-one" />
      <div className="orb orb-two" />

      <div className="nav-mobile">
        <select
          className="nav-mobile-select"
          value={currentPath}
          onChange={e => navigate(e.target.value)}
        >
          {NAV_LINKS.map(link => (
            <option key={link.to} value={link.to}>
              {link.label}
            </option>
          ))}
        </select>
      </div>

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
