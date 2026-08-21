export default function StatCard({ label, value, hint, icon, tone = 'blue', onClick }) {
  return (
    <button type="button" className={`stat-card stat-${tone}`} onClick={onClick} disabled={!onClick}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-main"><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>
    </button>
  )
}
