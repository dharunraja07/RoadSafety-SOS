import { useEffect, useState, useCallback } from 'react'
import { Siren, X } from 'lucide-react'
import { logAction, ACTION_TYPES } from '../../lib/usageLogger'

export default function CrashAlertOverlay({ open, onClose, coords, onDispatched }) {
  const [countdown, setCountdown] = useState(10)
  const [dispatched, setDispatched] = useState(false)

  const handleDispatch = useCallback(async () => {
    setDispatched(true)
    await logAction({
      action_type: ACTION_TYPES.CRASH_DISPATCHED,
      latitude: coords?.lat,
      longitude: coords?.lng,
    })
    onDispatched?.()
  }, [coords, onDispatched])

  useEffect(() => {
    if (!open) {
      setCountdown(10)
      setDispatched(false)
      return
    }

    if (dispatched) return

    if (countdown <= 0) {
      handleDispatch()
      return
    }

    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [open, countdown, dispatched, handleDispatch])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-traffic-red/95 p-6 backdrop-blur-sm"
      role="alertdialog"
      aria-labelledby="crash-alert-title"
      aria-live="assertive"
    >
      <div className="absolute inset-0 animate-pulse bg-traffic-red/30" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/40">
          <Siren className="h-14 w-14 animate-bounce text-white" />
        </div>

        <h2 id="crash-alert-title" className="text-3xl font-black uppercase tracking-tight text-white">
          {dispatched ? 'Emergency Team Dispatched' : 'Crash Detected!'}
        </h2>

        {!dispatched ? (
          <>
            <p className="mt-2 text-lg text-white/90">Auto-dispatch in</p>
            <div
              className="mt-4 font-mono text-8xl font-black tabular-nums text-white drop-shadow-lg"
              aria-live="polite"
            >
              {countdown}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-10 w-full max-w-sm rounded-2xl border-4 border-white bg-white px-8 py-5 text-xl font-black uppercase text-traffic-red shadow-2xl transition hover:scale-[1.02] active:scale-95"
            >
              <span className="flex items-center justify-center gap-2">
                <X className="h-7 w-7" />
                Cancel (False Alarm)
              </span>
            </button>
          </>
        ) : (
          <p className="mt-6 max-w-xs text-lg font-semibold text-white">
            First responders notified at your GPS coordinates.
          </p>
        )}
      </div>
    </div>
  )
}
