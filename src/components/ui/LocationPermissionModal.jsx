import { useEffect, useRef, useCallback } from 'react'
import { MapPin, X } from 'lucide-react'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function LocationPermissionModal({
  open,
  onAllow,
  onDecline,
  loading,
}) {
  const dialogRef = useRef(null)
  const allowRef = useRef(null)

  const trapFocus = useCallback((e) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const nodes = dialogRef.current.querySelectorAll(FOCUSABLE)
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.activeElement
    allowRef.current?.focus()
    document.addEventListener('keydown', trapFocus)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', trapFocus)
      document.body.style.overflow = prevOverflow
      if (prev instanceof HTMLElement) prev.focus()
    }
  }, [open, trapFocus])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDecline()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-permission-title"
        aria-describedby="location-permission-desc"
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/50"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-traffic-red/20">
            <MapPin className="h-6 w-6 text-traffic-red" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={onDecline}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
            aria-label="Dismiss location request for now"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 id="location-permission-title" className="text-xl font-bold text-white">
          Enable your location
        </h2>
        <p id="location-permission-desc" className="mt-2 text-sm leading-relaxed text-slate-400">
          RoadSoS needs your location for emergency services and nearby hospitals. Your coordinates
          are only used when you use SOS, crash alerts, or hospital search.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            ref={allowRef}
            type="button"
            onClick={onAllow}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-traffic-red py-3.5 text-sm font-bold text-white shadow-lg shadow-traffic-red/30 transition hover:bg-red-500 disabled:opacity-50"
            aria-label="Allow location access"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {loading ? 'Getting location…' : 'Allow Location Access'}
          </button>
          <button
            type="button"
            onClick={onDecline}
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:opacity-50"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
