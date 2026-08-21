import { useCallback, useEffect, useMemo, useState } from 'react'
import AppShell, { EmptyState, PageLoader, StatusBadge } from '../components/AppShell'
import { api, getApiError } from '../lib/api'

const blank = { name: '', description: '', latitude: '', longitude: '', radiusMeters: 100 }

export default function RestrictedZones() {
  const [zones, setZones] = useState([])
  const [form, setForm] = useState(blank)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { data } = await api.get('http://localhost:8000/api/locations/get-all-restricted-zone')
      setZones(Array.isArray(data) ? data : [])
    } catch (err) {
      // The user's backend currently guarantees add-restricted-zone; keep the page usable
      // when GET is not available yet without pretending browser storage is the source of truth.
      const message = getApiError(err, 'Restricted-zone registry could not be loaded.')
      setError(message)
      setZones([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radiusMeters: Number(form.radiusMeters),
    }
    if (!payload.name || !Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude) || !Number.isFinite(payload.radiusMeters) || payload.radiusMeters <= 0) {
      setError('Enter a zone name, valid coordinates and a positive radius.'); setSaving(false); return
    }
    try {
      // User-provided backend endpoint. This persists the zone in the Restricted_Zone table.
      const { data } = await api.post('/locations/add-restricted-zone', payload)
      setZones((prev) => [data, ...prev.filter((z) => z.id !== data.id)])
      setForm(blank)
      setNotice(`Restricted zone “${data?.name || payload.name}” saved to the backend database.`)
    } catch (err) {
      setError(getApiError(err, 'Restricted zone could not be saved.'))
    } finally { setSaving(false) }
  }

  const sorted = useMemo(() => [...zones].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [zones])

  if (loading) return <PageLoader label="Loading geofence registry…" />

  return <AppShell title="Geofencing control" subtitle="Create persistent restricted zones that the live backend geofence engine checks against tourist coordinates." actions={<button className="secondary-button" onClick={load}>↻ Refresh zones</button>}>
    {error && <div className="alert error page-alert">{error}</div>}
    {notice && <div className="alert success page-alert">{notice}</div>}

    <div className="feature-hero geofence-hero">
      <div><div className="eyebrow">Primary protection layer</div><h2>Restricted zones are stored in the backend database.</h2><p>Every zone created here becomes available to the server-side geofence check used by tourist monitoring. Zone creation is also an auditable admin action in the updated backend.</p></div>
      <div className="hero-stat"><strong>{sorted.length}</strong><span>database zones</span></div>
    </div>

    <div className="ops-grid">
      <section className="panel">
        <div className="panel-head"><div><div className="eyebrow">Admin action</div><h3>Add restricted zone</h3></div><StatusBadge tone="success">DB-backed</StatusBadge></div>
        <form onSubmit={submit} className="form-grid compact-grid">
          <label>Zone name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Marine restricted area" /></label>
          <label>Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Why is this area restricted?" /></label>
          <label>Latitude<input type="number" step="any" required value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="19.0760" /></label>
          <label>Longitude<input type="number" step="any" required value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="72.8777" /></label>
          <label>Radius (metres)<input type="number" min="1" max="1000" required value={form.radiusMeters} onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })} /></label>
          <button className="primary-button full" type="submit" disabled={saving}>{saving ? 'Saving to database…' : 'Save restricted zone'}</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head"><div><div className="eyebrow">Automatic response</div><h3>What happens on entry?</h3></div><StatusBadge tone="success">Live</StatusBadge></div>
        <div className="workflow-steps">
          <div><span>01</span><strong>GPS coordinate</strong><p>Tourist monitoring posts latitude and longitude.</p></div>
          <div><span>02</span><strong>Geofence match</strong><p>Backend compares the point with active database zones.</p></div>
          <div><span>03</span><strong>Ticket + incident</strong><p>A violation ticket and high-severity incident are created.</p></div>
          <div><span>04</span><strong>Blockchain audit</strong><p>Critical events are added to the tamper-evident audit chain.</p></div>
        </div>
      </section>
    </div>

    <section className="panel">
      <div className="panel-head"><div><div className="eyebrow">Database registry</div><h3>{sorted.length} restricted zone{sorted.length === 1 ? '' : 's'}</h3></div><span className="muted">Source: backend Restricted_Zone table</span></div>
      {sorted.length === 0 ? <EmptyState title="No zones in the database" description="Add your first zone above. The tourist geofence engine cannot match an area until a zone exists here." /> : <div className="zone-grid">{sorted.map((zone) => <article key={zone.id} className="zone-card"><div className="zone-card-head"><div><StatusBadge tone={zone.active === false ? 'neutral' : 'danger'}>{zone.active === false ? 'INACTIVE' : 'RESTRICTED'}</StatusBadge><h3>{zone.name}</h3></div><div className="zone-radius">{Number(zone.radiusMeters || 100).toLocaleString()} m</div></div><p>{zone.description || 'Restricted area used by the SafeRoute geofence engine.'}</p><div className="coords mono">{Number(zone.latitude).toFixed(6)}, {Number(zone.longitude).toFixed(6)}</div><div className="zone-meta"><span>DB ID</span><strong>{zone.id}</strong></div></article>)}</div>}
    </section>
  </AppShell>
}
