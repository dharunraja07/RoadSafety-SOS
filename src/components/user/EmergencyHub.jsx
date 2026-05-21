import { useState, useEffect, useCallback } from 'react'

import { MapPin, Shield, Zap, CheckCircle2, Navigation, RefreshCw } from 'lucide-react'

import SkeletonLoader from '../ui/SkeletonLoader'

import CrashAlertOverlay from './CrashAlertOverlay'

import POIFinder from './POIFinder'

import { useLocation } from '../../contexts/LocationContext'

import { logAction, ACTION_TYPES } from '../../lib/usageLogger'

import { EMERGENCY_HELPLINES, fetchHospitalsNearby } from '../../lib/hospitals'



const calculateDistance = (lat1, lon1, lat2, lon2) => {

  const R = 6371

  const dLat = (lat2 - lat1) * (Math.PI / 180)

  const dLon = (lon2 - lon1) * (Math.PI / 180)

  const a =

    Math.sin(dLat / 2) * Math.sin(dLat / 2) +

    Math.cos(lat1 * (Math.PI / 180)) *

    Math.cos(lat2 * (Math.PI / 180)) *

    Math.sin(dLon / 2) *

    Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return (R * c).toFixed(1)

}



export default function EmergencyHub() {

  const { coords, address, gpsError, gpsErrorMessage, loadingGps, requestGps } = useLocation()

  const [radius, setRadius] = useState(5000)
  const [hospitals, setHospitals] = useState([])

  const [loadingHospitals, setLoadingHospitals] = useState(false)
  const [hospitalError, setHospitalError] = useState(null)

  const [crashOpen, setCrashOpen] = useState(false)

  const [dispatched, setDispatched] = useState(false)



  const fetchNearbyHospitals = useCallback(async (lat, lng, searchRadius = 5000) => {

    setLoadingHospitals(true)
    setHospitalError(null)

    try {

      const data = await fetchHospitalsNearby(lat, lng, searchRadius)
      setHospitals(data)

    } catch (err) {

      setHospitals([])
      setHospitalError(err.message || 'Failed to fetch nearby hospitals')

    } finally {

      setLoadingHospitals(false)

    }

  }, [])



  const handleRadiusChange = (event) => {
    const nextRadius = Number(event.target.value)
    setRadius(nextRadius)
    setHospitals([])
    setHospitalError(null)
  }


  useEffect(() => {

    if (coords?.lat == null || coords?.lng == null) {

      setHospitals([])
      setHospitalError(null)
      setLoadingHospitals(false)
      return

    }

    fetchNearbyHospitals(coords.lat, coords.lng, radius)

  }, [coords?.lat, coords?.lng, radius, fetchNearbyHospitals])



  const simulateCrash = async () => {

    await logAction({

      action_type: ACTION_TYPES.CRASH_SIMULATED,

      latitude: coords?.lat,

      longitude: coords?.lng,

    })

    setCrashOpen(true)

    setDispatched(false)

  }



  const traumaCenters = hospitals.slice(0, 5)



  const awaitingGps = !coords && !loadingGps && !gpsError

  const latDisplay = coords?.lat != null ? coords.lat.toFixed(6) : loadingGps ? '…' : '—'

  const lngDisplay =
    coords?.lng != null ? coords.lng.toFixed(6) : loadingGps ? '…' : awaitingGps ? 'Awaiting GPS' : '—'

  const renderEmergencyNumbers = (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3">
        <p className="font-semibold text-white">Ambulance Dispatch</p>
        <a
          href="tel:108"
          className="rounded-full bg-traffic-red px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
        >
          108
        </a>
      </div>
      {EMERGENCY_HELPLINES.filter((line) => line.id !== 'helpline-108')
        .slice(0, 2)
        .map((line) => (
          <div
            key={line.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3"
          >
            <p className="font-semibold text-white">{line.name}</p>
            <a
              href={line.telHref}
              className="rounded-full bg-traffic-red px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
            >
              {line.phone}
            </a>
          </div>
        ))}
    </div>
  )



  return (

    <div className="px-4 pb-28 pt-4">

      <header className="mb-6">

        <h1 className="text-2xl font-bold text-white">Emergency Hub</h1>

        <p className="text-sm text-slate-400">Your live safety command center</p>

      </header>



      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl">

        <div className="mb-3 flex items-center gap-2">

          <MapPin className={`h-5 w-5 ${gpsError ? 'text-warning-amber' : 'text-emerald-400'}`} />

          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">

            Live GPS Lock

          </span>

        </div>



        {gpsError && (

          <button

            type="button"

            onClick={() => requestGps()}

            disabled={loadingGps}

            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-warning-amber/40 bg-warning-amber/10 px-3 py-2 text-sm font-semibold text-warning-amber transition hover:bg-warning-amber/20 disabled:opacity-50"

          >

            <RefreshCw className={`h-4 w-4 ${loadingGps ? 'animate-spin' : ''}`} />

            Retry GPS

          </button>

        )}



        {!gpsError && !loadingGps && coords && (

          <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">

            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />

            <p className="text-sm font-semibold text-emerald-400">Live GPS Location Confirmed</p>

          </div>

        )}



        {loadingGps ? (

          <SkeletonLoader lines={4} pulsing />

        ) : (

          <>

            <div className="grid grid-cols-2 gap-3 font-mono text-sm">

              <div className="rounded-lg bg-slate-950 px-3 py-2">

                <span className="text-slate-500">LAT</span>

                <p

                  className={`font-bold ${coords ? 'text-emerald-400' : 'text-slate-500'}`}

                >

                  {latDisplay}

                </p>

              </div>

              <div className="rounded-lg bg-slate-950 px-3 py-2">

                <span className="text-slate-500">LNG</span>

                <p

                  className={`font-bold ${coords ? 'text-emerald-400' : 'text-slate-500'}`}

                >

                  {lngDisplay}

                </p>

              </div>

            </div>

            {address && coords && (

              <p className="mt-3 text-sm leading-relaxed text-slate-300">{address}</p>

            )}

          </>

        )}

      </div>



      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-5">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-amber/20">

              <Shield className="h-6 w-6 text-warning-amber" />

            </div>

            <div>

              <h3 className="font-bold text-white">Drive Guardian</h3>

              <p className="flex items-center gap-2 text-sm text-emerald-400">

                <span className="relative flex h-2 w-2">

                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />

                </span>

                System Active

              </p>

            </div>

          </div>

        </div>



        {dispatched && (

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-400">

            <CheckCircle2 className="h-5 w-5" />

            EMERGENCY TEAM DISPATCHED

          </div>

        )}



        <button

          type="button"

          onClick={simulateCrash}

          disabled={!coords}

          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-traffic-red py-4 font-bold text-white shadow-lg shadow-traffic-red/30 transition hover:bg-red-500 disabled:opacity-40"

        >

          <Zap className="h-5 w-5" />

          Simulate Crash Impact

        </button>

      </div>



      <div className="mt-6">

        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">

              Medical / Trauma Centers

            </h3>
            <p className="text-sm text-slate-500">
              Search nearby hospitals within your selected radius.
            </p>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Radius</span>
            <select
              value={radius}
              onChange={handleRadiusChange}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-700 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
            >
              <option value={5000}>Urban Range (5 km)</option>
              <option value={15000}>Suburban Range (15 km)</option>
              <option value={30000}>Highway/Rural Range (30 km)</option>
            </select>
          </label>
        </div>

        {/* Case 1: Loading Hospitals */}
        {loadingHospitals && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Scanning nearby hospitals…
            </p>
            <SkeletonLoader lines={3} pulsing />
          </div>
        )}

        {/* Case 2: No Coordinates / GPS Denied (Not loading) */}
        {!coords && !loadingHospitals && (
          <div className="rounded-xl border border-warning-amber/30 bg-warning-amber/5 p-4">
            <p className="text-sm leading-relaxed text-slate-300 font-semibold">
              {gpsError 
                ? `GPS access denied or coordinates unavailable: ${gpsErrorMessage || 'Permission denied'}` 
                : `Enable GPS to scan top-rated hospitals within ${radius / 1000} km.`
              }
            </p>
            <p className="mt-2 text-xs text-slate-400">
              In case of an emergency, please use one of the helpline numbers below:
            </p>
            {renderEmergencyNumbers}
          </div>
        )}

        {/* Case 3: Hospital Fetch Error (Not loading) */}
        {coords && !loadingHospitals && hospitalError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm leading-relaxed text-red-400 font-semibold">
                Failed to scan nearby hospitals: {hospitalError}
              </p>
              <p className="text-xs text-slate-400">
                All Overpass API mirrors returned errors or timed out.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => fetchNearbyHospitals(coords.lat, coords.lng, radius)}
                  className="mt-1 flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition border border-slate-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry Scan
                </button>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Emergency dispatcher helpline numbers:
            </p>
            {renderEmergencyNumbers}
          </div>
        )}

        {/* Case 4: Success, but 0 hospitals found (Not loading, no error) */}
        {coords && !loadingHospitals && !hospitalError && traumaCenters.length === 0 && (
          <div className="rounded-xl border border-warning-amber/30 bg-warning-amber/5 p-4">
            <p className="text-sm leading-relaxed text-slate-300 font-semibold">
              No hospitals found within {radius / 1000} km.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Call ambulance dispatch on 108 now, or use one of the emergency lines below:
            </p>
            {renderEmergencyNumbers}
          </div>
        )}

        {/* Case 5: Success with hospitals (Not loading, no error, has elements) */}
        {coords && !loadingHospitals && !hospitalError && traumaCenters.length > 0 && (
          <div className="space-y-3">
            {traumaCenters.map((hospital) => (
              <div
                key={hospital.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-white">{hospital.name}</h4>
                      {hospital.isPriority && (
                        <span className="rounded-full bg-traffic-red/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-traffic-red">
                          ⭐ Critical/Speciality Facility
                        </span>
                      )}
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
                        {hospital.ratingDisplay}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">
                      <span className="font-mono text-warning-amber">{hospital.distance}</span>
                      <span className="text-slate-500"> away</span>
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-emerald-500"
                  >
                    <Navigation className="h-4 w-4" />
                    Navigate
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

      </div >



      <POIFinder lat={coords?.lat} lng={coords?.lng} excludeTrauma />



      <CrashAlertOverlay

        open={crashOpen}

        onClose={() => setCrashOpen(false)}

        coords={coords}

        onDispatched={() => {

          setDispatched(true)

          setCrashOpen(false)

        }}

      />

    </div >

  )

}


