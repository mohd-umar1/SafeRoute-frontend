import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, getApiError } from '../lib/api'

const initial = { name: '', email: '', phone: '', nationality: '', emergencyContact: '' }

export default function TouristRegistration() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await api.post('/tourists/register', formData)
      localStorage.setItem('touristId', data.touristId)
      navigate(`/dashboard/${data.touristId}`)
    } catch (err) { setError(getApiError(err, 'Registration could not be completed.')) }
    finally { setLoading(false) }
  }

  return <div className="auth-page"><div className="auth-aside"><Link to="/" className="back-link">← Home</Link><div className="auth-visual"><div className="auth-kicker">SAFE TOURIST IDENTITY</div><h1>Create your safety pass.</h1><p>Your identity is linked to every ticket, location check and incident so responders can act with the right context.</p><div className="auth-checks"><span>✓ Unique tourist ID</span><span>✓ Emergency contact on file</span><span>✓ Ready for QR ticketing</span></div></div></div><div className="auth-main"><div className="auth-card"><div className="eyebrow">New traveller</div><h2>Register securely</h2><p className="muted">Complete your profile once. You can issue and manage safety passes from your dashboard.</p>{error && <div className="alert error">{error}</div>}<form onSubmit={submit} className="form-grid"><label>Full name<input required value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} placeholder="e.g. Aisha Khan" /></label><label>Email address<input type="email" required value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} placeholder="you@example.com" /></label><label>Phone number<input value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} placeholder="+91 …" /></label><label>Nationality<input value={formData.nationality} onChange={e=>setFormData({...formData,nationality:e.target.value})} placeholder="India" /></label><label className="full">Emergency contact<input value={formData.emergencyContact} onChange={e=>setFormData({...formData,emergencyContact:e.target.value})} placeholder="Name + phone number" /></label><button className="primary-button full large" disabled={loading}>{loading ? 'Creating identity…' : 'Create safety identity ↗'}</button></form><p className="auth-foot">Already registered? <Link to="/login">Sign in</Link></p></div></div></div>
}
