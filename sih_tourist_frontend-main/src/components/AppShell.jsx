import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const adminNav = [
  { to: '/admin', label: 'Operations', icon: '⌂' },
  { to: '/restricted-zones', label: 'Geofencing', icon: '◎' },
  { to: '/incidents', label: 'Tickets & incidents', icon: '!' },
  { to: '/audit', label: 'Blockchain audit', icon: '⬡' },
]

const touristNav = [
  { label: 'Safety center', to: null, icon: '◎' },
]

function Logo() {
  return <div className="brand-mark" aria-label="SafeRoute"><span className="brand-mark-dot" /><span className="brand-mark-ring" /><span className="brand-mark-line" /></div>
}

export function Brand({ compact = false }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><Logo /><div><div className="brand-name">SafeRoute</div>{!compact && <div className="brand-subtitle">Tourist safety network</div>}</div></div>
}

export default function AppShell({ children, title, subtitle, actions, role = 'admin' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const touristId = localStorage.getItem('touristId')
  const isTourist = role === 'tourist'
  const navItems = isTourist ? touristNav : adminNav

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Brand />
          <div className="security-pill"><span className="live-dot" /> System protected</div>
        </div>

        <div className="role-switcher">
          <div className="role-label">Current module</div>
          <div className="role-card"><span className="role-dot" />{isTourist ? 'Tourist' : 'Admin'}<span className="role-chevron">›</span></div>
        </div>

        <nav className="side-nav" aria-label="Primary navigation">
          <div className="side-label">{isTourist ? 'My safety' : 'Admin control'}</div>
          {navItems.map((item) => item.to ? (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <span className="side-icon">{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ) : (
            <div key={item.label} className={`side-link active`}><span className="side-icon">{item.icon}</span><span>{item.label}</span></div>
          ))}

          {!isTourist && <>
            <div className="side-label">Verification</div>
            <NavLink to="/verify" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <span className="side-icon">✓</span><span>Verify ticket</span>
            </NavLink>
          </>}

          {isTourist && touristId && <>
            <div className="side-label">Tools</div>
            <NavLink to="/verify" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <span className="side-icon">✓</span><span>Verify ticket</span>
            </NavLink>
          </>}
        </nav>

        <div className="sidebar-footer">
          <button className="subtle-button wide" onClick={() => { localStorage.removeItem('touristId'); navigate('/') }}>← Exit session</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><Brand compact /></div>
          <div className="topbar-title"><div className="eyebrow">{isTourist ? 'Tourist safety' : 'Safety operations'}</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
          <div className="topbar-actions">{actions}</div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  )
}

export function PageLoader({ label = 'Loading secure data…' }) { return <div className="loader-panel"><span className="spinner" />{label}</div> }
export function EmptyState({ title, description, action }) { return <div className="empty-state"><div className="empty-icon">○</div><h3>{title}</h3><p>{description}</p>{action}</div> }
export function StatusBadge({ children, tone = 'neutral' }) { return <span className={`status-badge ${tone}`}>{children}</span> }
