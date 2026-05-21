import { useState, useEffect } from 'react'
import { AlertOctagon, Plus, Trash2, Phone } from 'lucide-react'
import { useLocation } from '../../contexts/LocationContext'
import { logAction, ACTION_TYPES } from '../../lib/usageLogger'

const CONTACTS_KEY = 'roadsos_contacts'

function loadContacts() {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function PanicSMS() {
  const { coords, gpsError, permissionDeclined, loadingGps, requestGps } = useLocation()
  const [contacts, setContacts] = useState(loadContacts)
  const [newPhone, setNewPhone] = useState('')
  const [newName, setNewName] = useState('')

  useEffect(() => {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts))
  }, [contacts])

  const buildSosBody = () => {
    const lat = coords?.lat?.toFixed(6) ?? 'unknown'
    const lng = coords?.lng?.toFixed(6) ?? 'unknown'
    return `EMERGENCY: I have been in a road accident. My active coordinates: https://maps.google.com/?q=${lat},${lng}`
  }

  const triggerSos = async () => {
    await logAction({
      action_type: ACTION_TYPES.SOS_TRIGGERED,
      latitude: coords?.lat,
      longitude: coords?.lng,
    })

    const body = encodeURIComponent(buildSosBody())
    const href = `sms:?body=${body}`

    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
    if (isMobile) {
      window.location.href = href
    } else {
      navigator.clipboard?.writeText(decodeURIComponent(body))
      alert(
        'SOS message copied to clipboard (desktop). On mobile, this opens your SMS app.\n\n' +
          decodeURIComponent(body),
      )
    }
  }

  const addContact = () => {
    const phone = newPhone.replace(/\D/g, '')
    if (phone.length < 10) return
    setContacts((c) => [...c, { id: Date.now(), name: newName || 'Family', phone }])
    setNewPhone('')
    setNewName('')
  }

  const removeContact = (id) => {
    setContacts((c) => c.filter((x) => x.id !== id))
  }

  const smsContact = (phone) => {
    const body = encodeURIComponent(buildSosBody())
    window.location.href = `sms:${phone}?body=${body}`
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col px-4 pb-28 pt-4">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">Panic SMS</h1>
        <p className="text-sm text-slate-400">One tap alerts your emergency contacts</p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center">
        <button
          type="button"
          onClick={triggerSos}
          disabled={!coords}
          className="relative flex h-48 w-48 items-center justify-center rounded-full bg-traffic-red text-white shadow-[0_0_60px_rgba(239,68,68,0.6)] animate-sos-pulse transition active:scale-95 disabled:opacity-40 disabled:animate-none"
          aria-label="Send SOS SMS"
        >
          <div className="absolute inset-2 rounded-full border-4 border-white/30" />
          <div className="flex flex-col items-center gap-1">
            <AlertOctagon className="h-14 w-14" />
            <span className="text-xl font-black uppercase tracking-widest">SOS</span>
          </div>
        </button>
        <p className="mt-6 max-w-xs text-center text-xs text-slate-500">
          {coords
            ? 'Sends distress SMS with live Google Maps coordinates'
            : gpsError
              ? 'GPS required — allow location in your browser, then tap Retry GPS on Emergency Hub'
              : permissionDeclined
                ? 'Location paused — tap Allow Location Access at the top of the app to enable SOS'
                : loadingGps
                  ? 'Acquiring GPS lock…'
                  : 'Allow location access when prompted to enable SOS with live coordinates'}
        </p>
        {!coords && (permissionDeclined || gpsError) && (
          <button
            type="button"
            onClick={() => requestGps()}
            disabled={loadingGps}
            className="mt-4 rounded-lg border border-warning-amber/40 bg-warning-amber/10 px-4 py-2 text-xs font-semibold text-warning-amber transition hover:bg-warning-amber/20 disabled:opacity-50"
            aria-label="Request location for SOS"
          >
            {loadingGps ? 'Getting location…' : 'Enable location for SOS'}
          </button>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
          Emergency Contacts
        </h3>

        <div className="mb-3 flex gap-2">
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            onClick={addContact}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <ul className="space-y-2">
          {contacts.length === 0 && (
            <li className="text-sm text-slate-500">No contacts saved yet.</li>
          )}
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2"
            >
              <button
                type="button"
                onClick={() => smsContact(c.phone)}
                className="flex flex-1 items-center gap-2 text-left text-sm text-white"
              >
                <Phone className="h-4 w-4 text-emerald-400" />
                <span className="font-medium">{c.name}</span>
                <span className="text-slate-500">{c.phone}</span>
              </button>
              <button
                type="button"
                onClick={() => removeContact(c.id)}
                className="p-2 text-slate-500 hover:text-traffic-red"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
