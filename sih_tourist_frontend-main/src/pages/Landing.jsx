import { Link } from 'react-router-dom'
import BgImg from '../assets/bg1.png'

const features = [
  ['01', 'Live geofencing', 'Monitor tourist coordinates against permitted and restricted areas in real time.'],
  ['02', 'Tamper-evident blockchain', 'Verify the integrity and history of safety events through the linked audit chain.'],
  ['03', 'Ticket verification', 'Issue, trace and verify safety tickets with a visible ticket code and QR record.'],
]

export default function Landing() {
  return <div className="landing" style={{ backgroundImage: `linear-gradient(90deg, rgba(249,252,255,.97) 0%, rgba(249,252,255,.84) 48%, rgba(249,252,255,.34) 100%), url(${BgImg})` }}>
    <header className="landing-nav">
      <div className="brand"><div className="brand-mark"><span className="brand-mark-dot"/><span className="brand-mark-ring"/><span className="brand-mark-line"/></div><div><div className="brand-name">SafeRoute</div><div className="brand-subtitle">Smart tourist safety network</div></div></div>
      <div className="landing-nav-links"><Link to="/verify">Verify ticket</Link><Link to="/admin">Admin control</Link></div>
    </header>
    <main className="landing-main">
      <div className="hero-copy">
        <div className="hero-kicker"><span className="live-dot" /> Geofence + blockchain safety</div>
        <h1>Safety that reacts when the journey changes.</h1>
        <p className="hero-lede">SafeRoute combines live geofencing, ticketed enforcement and a tamper-evident audit chain so tourist safety events can be detected, acted on and verified.</p>
        <div className="hero-actions"><Link className="primary-button large" to="/register">Start as tourist <span>↗</span></Link><Link className="secondary-button large" to="/login">Tourist sign in</Link></div>
        <div className="hero-note"><span>✓</span> Verification works from the browser with no separate app.</div>
      </div>
      <div className="hero-panel"><div className="hero-panel-top"><div><div className="eyebrow">Protection status</div><div className="hero-panel-title">Safety operations online</div></div><span className="status-badge success">Operational</span></div><div className="hero-metric"><div className="metric-orbit"><span>⬡</span></div><div><div className="metric-value">LIVE</div><div className="metric-label">geofence + audit ready</div></div></div><div className="mini-grid"><div><strong>GPS</strong><span>Geofence monitoring</span></div><div><strong>ZONE</strong><span>Restricted areas</span></div><div><strong>TKT</strong><span>Ticket enforcement</span></div><div><strong>HASH</strong><span>Audit verification</span></div></div></div>
    </main>
    <section className="feature-grid">{features.map(([num, title, copy]) => <article key={num} className="feature-card"><div className="feature-num">{num}</div><h3>{title}</h3><p>{copy}</p></article>)}</section>
    <footer className="landing-footer"><span>SafeRoute · Smart Tourist Safety Monitoring</span><span>Backend-backed geofencing · tickets · blockchain audit</span></footer>
  </div>
}
