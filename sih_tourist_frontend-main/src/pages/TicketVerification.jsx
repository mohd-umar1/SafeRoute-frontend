import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, getApiError } from '../lib/api'
import { StatusBadge } from '../components/AppShell'
import { getTicketTiming } from '../lib/ticketStatus'

export default function TicketVerification() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [code, setCode] = useState(params.get('code') || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const verify = async (e) => {
    e.preventDefault()
    const normalized = code.trim().toUpperCase()
    if (!normalized) return
    setLoading(true); setResult(null)
    try {
      const { data: ticket } = await api.get(`/tickets/${normalized}`)
      const timing = getTicketTiming(ticket)
      if (timing.state === 'SCHEDULED') {
        setResult({ ...ticket, status: 'SCHEDULED', message: `This ticket becomes active on ${timing.from.toLocaleString()}.` })
        return
      }
      const { data } = await api.post('/tickets/verify', { ticketCode: normalized })
      const finalTiming = getTicketTiming(data)
      setResult({ ...data, status: finalTiming.state })
    } catch (err) {
      setResult({ error: getApiError(err, 'Ticket not found or unavailable.') })
    } finally { setLoading(false) }
  }

  return <div className="verification-page"><div className="verification-card"><button className="back-link button-reset" onClick={() => navigate('/')}>← Back</button><div className="verify-badge">TICKET VERIFICATION</div><h1>Verify a safety ticket.</h1><p>Use the ticket code to confirm the server record, validity window and verification state.</p><form onSubmit={verify} className="verify-form"><input autoFocus value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="TKT-XXXXXXXX" /><button className="primary-button" disabled={loading}>{loading ? 'Checking…' : 'Verify ticket'}</button></form>{result && <div className={`verify-result ${result.error ? 'bad' : result.status === 'ACTIVE' ? 'good' : result.status === 'SCHEDULED' ? 'scheduled' : 'warn'}`}>{result.error ? <><div className="result-title">Ticket not verified</div><p>{result.error}</p></> : <><div className="result-head"><div><div className="result-title">{result.status === 'ACTIVE' ? 'Ticket verified' : result.status === 'SCHEDULED' ? 'Ticket scheduled' : 'Ticket requires attention'}</div><div className="muted mono">{result.ticketCode}</div></div><StatusBadge tone={result.status === 'ACTIVE' ? 'success' : result.status === 'SCHEDULED' ? 'neutral' : 'warning'}>{result.status}</StatusBadge></div>{result.message && <div className="verify-notice scheduled-notice">{result.message}</div>}<div className="result-grid"><span>Tourist ID</span><strong>{result.touristId}</strong><span>Type</span><strong>{result.type || result.destination || '—'}</strong><span>Valid from</span><strong>{new Date(result.validFrom).toLocaleString()}</strong><span>Valid until</span><strong>{new Date(result.validUntil).toLocaleString()}</strong></div></>}</div>}
 <div className="verify-trust"><span>⬡</span><div><strong>Server-backed verification</strong><small>The ticket is read from the backend before its timing state is determined. Verification is recorded in the audit chain.</small></div></div></div></div>
}
