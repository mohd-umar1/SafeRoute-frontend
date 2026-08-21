import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode.react'
import AppShell, { EmptyState, PageLoader, StatusBadge } from '../components/AppShell'
import StatCard from '../components/StatCard'
import { toBackendLocalDateTime } from '../lib/backendDate'
import { api, getApiError } from '../lib/api'

const freshTicket = { type: '', validFrom: '', validUntil: '', centerLat: '', centerLng: '', radiusMeters: 5000 }

function parseLocalDate(value) {
  if (!value) return null
  const raw = String(value)
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] || 0))
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function ticketState(ticket) {
  const from = parseLocalDate(ticket?.validFrom)
  const until = parseLocalDate(ticket?.validUntil)
  const now = new Date()
  if (!from || !until) return 'UNKNOWN'
  if (now < from) return 'SCHEDULED'
  if (now > until) return 'EXPIRED'
  return 'ACTIVE'
}

export default function TouristDashboard() {
  const { touristId } = useParams()
  const navigate = useNavigate()
  const [tourist, setTourist] = useState(null)
  const [tickets, setTickets] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [location, setLocation] = useState({ latitude: '', longitude: '' })
  const [locationResult, setLocationResult] = useState(null)
  const [monitoring, setMonitoring] = useState(false)
  const [sosLoading, setSosLoading] = useState(false)
  const [ticketForm, setTicketForm] = useState(freshTicket)
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [notice, setNotice] = useState('')
  const watchId = useRef(null)
  const lastCheck = useRef(0)

  const normalTickets = useMemo(() => tickets.filter(t => !(t.type || '').startsWith('RESTRICTED_ZONE:')), [tickets])
  const violationTickets = useMemo(() => tickets.filter(t => (t.type || '').startsWith('RESTRICTED_ZONE:')), [tickets])
  const activeTicket = useMemo(() => normalTickets.find(t => ticketState(t) === 'ACTIVE'), [normalTickets])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [t, ts, ins] = await Promise.all([
        api.get(`/tourists/${touristId}`),
        api.get(`/tickets/tourist/${touristId}`),
        api.get(`/incidents/tourist/${touristId}`),
      ])
      setTourist(t.data); setTickets(ts.data || []); setIncidents(ins.data || [])
    } catch (err) {
      setError(getApiError(err, 'Unable to load the tourist safety center.'))
    } finally { setLoading(false) }
  }, [touristId])

  useEffect(() => {
    load()
    return () => { if (watchId.current) navigator.geolocation?.clearWatch(watchId.current) }
  }, [load])

  const checkLocation = useCallback(async (coords) => {
    if (coords?.latitude == null || coords?.longitude == null) return
    const lat = Number(coords.latitude); const lng = Number(coords.longitude)
    setLocation({ latitude: lat, longitude: lng }); setNotice('')
    try {
      const response = await api.post('/locations/geofence', { touristId, latitude: lat, longitude: lng })
      const data = response.data || {}
      setLocationResult(data)
      if (data.violation) {
        const created = data.ticketCreated === true
        if (data.ticket) setTickets(prev => [data.ticket, ...prev.filter(t => t.ticketCode !== data.ticket.ticketCode)])
        if (data.incident) setIncidents(prev => [data.incident, ...prev.filter(i => i.id !== data.incident.id)])
        setNotice(created ? `Restricted-zone violation detected. Ticket ${data.ticket?.ticketCode || ''} created and added to the audit chain.` : data.message || 'You are inside a restricted zone.')
      }
    } catch (err) {
      setLocationResult({ violation: false, safe: false, message: getApiError(err, 'Geofence check failed.') })
    }
  }, [touristId])

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setNotice('Geolocation is not supported by this browser.'); return }
    setNotice('Requesting current location…')
    navigator.geolocation.getCurrentPosition(p => checkLocation(p.coords), e => setNotice(e.message || 'Location permission was denied.'), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
  }

  useEffect(() => {
    if (!monitoring) {
      if (watchId.current) navigator.geolocation?.clearWatch(watchId.current)
      watchId.current = null
      return
    }
    if (!navigator.geolocation) { setMonitoring(false); setNotice('Live monitoring requires browser geolocation.'); return }
    watchId.current = navigator.geolocation.watchPosition(p => {
      const now = Date.now()
      if (now - lastCheck.current < 12000) return
      lastCheck.current = now
      checkLocation(p.coords)
    }, e => setNotice(e.message || 'Live location monitoring failed.'), { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 })
    return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current) }
  }, [monitoring, checkLocation])

  const createTicket = async (e) => {
    e.preventDefault(); setCreatingTicket(true); setError('')
    try {
      const payload = {
        touristId,
        type: ticketForm.type,
        validFrom: toBackendLocalDateTime(ticketForm.validFrom),
        validUntil: toBackendLocalDateTime(ticketForm.validUntil),
        centerLat: Number(ticketForm.centerLat),
        centerLng: Number(ticketForm.centerLng),
        radiusMeters: Number(ticketForm.radiusMeters),
      }
      const { data } = await api.post('/tickets/create', payload)
      setTickets(prev => [data, ...prev]); setTicketForm(freshTicket)
      setNotice(`Ticket ${data.ticketCode} created and recorded in the audit chain.`)
    } catch (err) { setError(getApiError(err, 'Ticket creation failed.')) }
    finally { setCreatingTicket(false) }
  }

  const sendSOS = async () => {
    if (!tourist) return
    if (!window.confirm('Send an emergency SOS alert to the safety system?')) return
    setSosLoading(true)
    try {
      let coords = location
      if (coords.latitude === '' && navigator.geolocation) {
        try {
          const p = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 }))
          coords = { latitude: p.coords.latitude, longitude: p.coords.longitude }; setLocation(coords)
        } catch {}
      }
      await api.post('/incidents/create', { touristId: tourist.touristId, type: 'SOS', severity: 'HIGH', latitude: coords.latitude === '' ? null : Number(coords.latitude), longitude: coords.longitude === '' ? null : Number(coords.longitude), description: 'SOS emergency triggered by tourist' })
      setNotice('SOS sent. The safety operations team can now see the incident.'); await load()
    } catch (err) { setError(getApiError(err, 'SOS could not be sent.')) }
    finally { setSosLoading(false) }
  }

  if (loading) return <PageLoader label="Loading tourist safety center…" />
  if (!tourist) return <div className="center-page"><div className="alert error">{error || 'Tourist profile not found.'}</div><button className="primary-button" onClick={() => navigate('/')}>Return home</button></div>

  const geofenceDanger = Boolean(locationResult?.violation)

  return <AppShell role="tourist" title={`Safety center for ${tourist.name.split(' ')[0]}`} subtitle="Live geofence status, tickets and incident visibility in one place." actions={<button className="secondary-button" onClick={load}>↻ Refresh</button>}>
    {error && <div className="alert error page-alert">{error}</div>}
    {notice && <div className={`alert ${geofenceDanger ? 'error' : 'info'} page-alert`}>{notice}</div>}

    <section className={`monitor-hero ${geofenceDanger ? 'danger' : ''}`}>
      <div className="monitor-copy"><div className="eyebrow">PRIMARY PROTECTION</div><h2>{geofenceDanger ? 'Restricted-zone alert' : monitoring ? 'Live geofence monitoring is on' : 'Your live safety perimeter'}</h2><p>{geofenceDanger ? (locationResult.message || 'You are currently inside a restricted zone.') : 'Your location is checked against the backend geofence engine. Restricted-zone matches can generate an incident and enforcement ticket automatically.'}</p><div className="monitor-actions"><button className={`toggle ${monitoring ? 'on' : ''}`} onClick={() => setMonitoring(v => !v)}><span />{monitoring ? 'Monitoring active' : 'Start live monitoring'}</button><button className="primary-button" onClick={useCurrentLocation}>Check my location</button></div></div>
      <div className="monitor-visual"><div className={`radar ${geofenceDanger ? 'danger' : ''}`}><span className="radar-ring r1"/><span className="radar-ring r2"/><span className="radar-dot"/></div><div className="monitor-status"><span className="live-dot" /> {geofenceDanger ? 'ALERT' : locationResult ? 'LOCATION CHECKED' : 'READY'}</div></div>
    </section>

    <div className="stats-grid three">
      <StatCard label="Geofence state" value={geofenceDanger ? 'ALERT' : locationResult ? 'SAFE' : 'READY'} hint={locationResult?.message || 'Run a location check'} icon="◎" tone={geofenceDanger ? 'red' : 'green'} />
      <StatCard label="Tickets" value={tickets.length} hint={`${violationTickets.length} enforcement ticket${violationTickets.length === 1 ? '' : 's'}`} icon="TK" tone="blue" />
      <StatCard label="Open incidents" value={incidents.filter(i => i.status === 'OPEN').length} hint="Needs safety attention" icon="!" tone="amber" />
    </div>

    <div className="ops-grid">
      <section className="panel span-2"><div className="panel-head"><div><div className="eyebrow">Live location</div><h3>Current geofence reading</h3></div><StatusBadge tone={geofenceDanger ? 'danger' : 'success'}>{geofenceDanger ? 'RESTRICTED' : locationResult ? 'CLEAR' : 'READY'}</StatusBadge></div><div className="location-status"><div className={`pulse-map ${geofenceDanger ? 'danger' : 'safe'}`}><span className="map-cross">+</span><div className="fence-circle"/><div className="map-dot"/></div><div className="location-copy"><div className={`location-state ${geofenceDanger ? 'danger' : 'safe'}`}>{geofenceDanger ? `Restricted zone: ${locationResult.zone?.name || 'Alert'}` : locationResult?.message || 'No location check yet'}</div><p>{locationResult?.message || 'Allow browser location access to test the server-side geofence.'}</p><div className="coords">{location.latitude !== '' ? `${Number(location.latitude).toFixed(6)}, ${Number(location.longitude).toFixed(6)}` : 'No coordinates captured'}</div></div></div></section>

      <section className="panel"><div className="panel-head"><div><div className="eyebrow">Enforcement</div><h3>Violation tickets</h3></div></div>{violationTickets.length === 0 ? <EmptyState title="No violations" description="Restricted-zone tickets will appear here if the geofence engine detects an entry." /> : <div className="activity-list">{violationTickets.slice(0, 5).map(t => <div className="activity-row" key={t.ticketCode}><div className="activity-dot danger"/><div><strong>{t.ticketCode}</strong><span>{t.type}</span></div><button className="subtle-button" onClick={() => navigate(`/verify?code=${t.ticketCode}`)}>Verify</button></div>)}</div>}</section>
    </div>

    <section className="panel"><div className="panel-head"><div><div className="eyebrow">Tickets</div><h3>Your issued tickets</h3></div><span className="muted">Code + QR verification</span></div>{tickets.length === 0 ? <EmptyState title="No tickets yet" description="Your account has no issued tickets." /> : <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Type</th><th>Validity</th><th>Status</th><th></th></tr></thead><tbody>{tickets.slice(0, 10).map(t => { const state = ticketState(t); return <tr key={t.ticketCode}><td><div className="table-primary mono">{t.ticketCode}</div></td><td>{t.type}</td><td><div>{parseLocalDate(t.validFrom)?.toLocaleString()}</div><div className="table-secondary">to {parseLocalDate(t.validUntil)?.toLocaleString()}</div></td><td><StatusBadge tone={state === 'ACTIVE' ? 'success' : state === 'SCHEDULED' ? 'neutral' : 'warning'}>{state}</StatusBadge></td><td><button className="subtle-button" onClick={() => navigate(`/verify?code=${t.ticketCode}`)}>Verify</button></td></tr> })}</tbody></table></div>}</section>

    <div className="ops-grid">
      <section className="panel"><div className="panel-head"><div><div className="eyebrow">Emergency</div><h3>Need immediate help?</h3></div><StatusBadge tone="danger">SOS</StatusBadge></div><p className="panel-copy">Send your current location to the safety backend and create a high-priority incident.</p><button className="sos-button" onClick={sendSOS} disabled={sosLoading}>{sosLoading ? 'Sending…' : 'Send SOS alert'}</button></section>
      <section className="panel "><div className="panel-head"><div><div className="eyebrow">Safety pass</div><h3>Optional travel pass</h3></div><span className="muted">Secondary feature</span></div><p className="panel-copy">Issue a normal ticket with a permitted radius when your trip requires one. Geofencing remains active independently.</p>
      <form onSubmit={createTicket} className="form-grid compact-grid ">
        <label>Destination / type<input required value={ticketForm.type} onChange={e => setTicketForm({ ...ticketForm, type: e.target.value })} placeholder="e.g. Mumbai city zone" />
        </label>
        <label>Valid from<input type="datetime-local" required value={ticketForm.validFrom} onChange={e => setTicketForm({ ...ticketForm, validFrom: e.target.value })} />
        </label>
        <label>Valid until<input type="datetime-local" required value={ticketForm.validUntil} onChange={e => setTicketForm({ ...ticketForm, validUntil: e.target.value })} />
        </label>
        <label>Radius (metres)<input type="number" min="100" required value={ticketForm.radiusMeters} onChange={e => setTicketForm({ ...ticketForm, radiusMeters: e.target.value })} />
        </label>
        <label>Center latitude<input type="number" step="any" required value={ticketForm.centerLat} onChange={e => setTicketForm({ ...ticketForm, centerLat: e.target.value })} />
        </label>
        <label>Center longitude<input type="number" step="any" required value={ticketForm.centerLng} onChange={e => setTicketForm({ ...ticketForm, centerLng: e.target.value })} /></label><button className="secondary-button full" disabled={creatingTicket}>{creatingTicket ? 'Creating…' : 'Issue travel ticket'}</button>
        </form>
        </section>
    </div>

    <section className="panel"><div className="panel-head"><div><div className="eyebrow">Incident history</div><h3>Recent safety events</h3></div><span className="muted">Backend recorded</span></div>{incidents.length === 0 ? <EmptyState title="No incidents" description="Geofence and SOS events will appear here." /> : <div className="activity-list">{incidents.slice(0, 6).map(i => <div className="activity-row" key={i.id}><div className={`activity-dot ${i.status === 'OPEN' ? 'danger' : 'ok'}`} /><div><strong>{i.type.replaceAll('_', ' ')}</strong><span>{i.description || 'Safety event recorded'}</span></div><time>{new Date(i.createdAt).toLocaleString()}</time></div>)}</div>}</section>

    <section className="identity-banner compact"><div className="identity-avatar">{tourist.name.split(' ').map(v => v[0]).slice(0, 2).join('')}</div><div><div className="eyebrow">Verified traveller</div><h3>{tourist.name}</h3><p>{tourist.email} · {tourist.touristId}</p></div><button className="subtle-button" onClick={() => navigate(`/verify?code=${activeTicket?.ticketCode || ''}`)} disabled={!activeTicket}>Open ticket verifier</button></section>
  </AppShell>
}
