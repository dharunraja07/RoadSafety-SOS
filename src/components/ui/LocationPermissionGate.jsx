import { MapPin, RefreshCw } from 'lucide-react'
import { useLocation } from '../../contexts/LocationContext'
import { getPermissionDeniedBrowserGuidance } from '../../lib/geo'
import LocationPermissionModal from './LocationPermissionModal'
import LocationWarningBanner from './LocationWarningBanner'

export default function LocationPermissionGate() {
  const {
    coords,
    loadingGps,
    gpsError,
    gpsErrorMessage,
    permissionStatus,
    permissionDeclined,
    showPermissionModal,
    allowLocationAccess,
    declineLocationAccess,
    requestGps,
  } = useLocation()

  const showDeclinedHint =
    permissionDeclined && !coords && permissionStatus !== 'granted' && !loadingGps

  const showDeniedBanner =
    (permissionStatus === 'denied' || (gpsError && !showPermissionModal)) &&
    !coords &&
    !showPermissionModal

  return (
    <>
      <LocationPermissionModal
        open={showPermissionModal}
        onAllow={allowLocationAccess}
        onDecline={declineLocationAccess}
        loading={loadingGps}
      />

      {showDeniedBanner && (
        <div className="px-4 pt-3" role="region" aria-label="Location permission blocked">
          <LocationWarningBanner
            message={
              permissionStatus === 'denied'
                ? getPermissionDeniedBrowserGuidance()
                : gpsErrorMessage
            }
          />
        </div>
      )}

      {showDeclinedHint && (
        <div
          className="mx-4 mt-3 rounded-xl border border-slate-800 bg-slate-900/90 p-4"
          role="region"
          aria-label="Location access postponed"
        >
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Location not enabled yet</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                Emergency SOS, hospital search, and live GPS need your location. Tap below when you
                are ready — your browser will ask for permission.
              </p>
              <button
                type="button"
                onClick={() => requestGps()}
                disabled={loadingGps}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-warning-amber/40 bg-warning-amber/10 px-3 py-2.5 text-sm font-semibold text-warning-amber transition hover:bg-warning-amber/20 disabled:opacity-50"
                aria-label="Retry location access"
              >
                <RefreshCw className={`h-4 w-4 ${loadingGps ? 'animate-spin' : ''}`} />
                Allow Location Access
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
