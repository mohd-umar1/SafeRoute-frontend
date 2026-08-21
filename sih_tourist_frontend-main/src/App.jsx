import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import TouristRegistration from './pages/TouristRegistration'
import TouristDashboard from './pages/TouristDashboard'
import TicketVerification from './pages/TicketVerification'
import AdminDashboard from './pages/AdminDashboard'
import Incidents from './pages/Incidents'
import AuditTrail from './pages/AuditTrail'
import RestrictedZones from './pages/RestrictedZones'
import Login from './pages/login'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<TouristRegistration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/:touristId" element={<TouristDashboard />} />
        <Route path="/verify" element={<TicketVerification />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/audit" element={<AuditTrail />} />
        <Route path="/restricted-zones" element={<RestrictedZones />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
