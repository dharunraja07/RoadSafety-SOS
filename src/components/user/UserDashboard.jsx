import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { LocationProvider } from '../../contexts/LocationContext'
import LocationPermissionGate from '../ui/LocationPermissionGate'
import BottomNav from './BottomNav'
import EmergencyHub from './EmergencyHub'
import FirstAid from './FirstAid'
import PanicSMS from './PanicSMS'

export default function UserDashboard() {
  const [tab, setTab] = useState('hub')
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <LocationProvider>
      <div className="mx-auto min-h-screen max-w-lg bg-slate-950">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-xs text-slate-500">RoadSoS</p>
            <p className="text-sm font-semibold text-white">
              {profile?.full_name || 'Emergency User'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <LocationPermissionGate />

        {tab === 'hub' && <EmergencyHub />}
        {tab === 'firstaid' && <FirstAid />}
        {tab === 'sos' && <PanicSMS />}

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </LocationProvider>
  )
}
