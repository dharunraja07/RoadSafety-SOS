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

  const [hospitals, setHospitals] = useState([])

  const [loadingHospitals, setLoadingHospitals] = useState(false)

  const [crashOpen, setCrashOpen] = useState(false)

  const [dispatched, setDispatched] = useState(false)



  const fetchNearbyHospitals = useCallback(async (lat, lng) => {

    setLoadingHospitals(true)

    try {

      const query = `[out:json][timeout:25]; node["amenity"="hospital"](around:5000, ${lat}, ${lng}); out body;`

      const res = await fetch('https://overpass-api.de/api/interpreter', {

        method: 'POST',

        headers: { 'Content-Type': 'text/plain' },

        body: query,

      })

      if (!res.ok) throw new Error(`Overpass API responded with ${res.status}`)

      const data = await res.json()

      setHospitals(Array.isArray(data.elements) ? data.elements : [])

    } catch {

      setHospitals([])

    } finally {

      setLoadingHospitals(false)

    }

  }, [])



  useEffect(() => {

    if (coords?.lat == null || coords?.lng == null) {

      setHospitals([])

      return

    }

    fetchNearbyHospitals(coords.lat, coords.lng)

  }, [coords?.lat, coords?.lng, fetchNearbyHospitals])



  const simulateCrash = async () => {

    await logAction({

      action_type: ACTION_TYPES.CRASH_SIMULATED,

      latitude: coords?.lat,

      longitude: coords?.lng,

    })

    setCrashOpen(true)

    setDispatched(false)

  }



  const traumaCenters = hospitals

    .filter((el) => el.lat != null && el.lon != null)

    .map((el) => {

      const km =

        coords != null

          ? parseFloat(calculateDistance(coords.lat, coords.lng, el.lat, el.lon))

          : Infinity

      return {

        id: el.id,

        name: el.tags?.name || 'Emergency Medical Facility',

        lat: el.lat,

        lon: el.lon,

        km,

        distance: coords != null ? `${km} km` : '—',

      }

    })

    .sort((a, b) => a.km - b.km)

    .slice(0, 5)



  const awaitingGps = !coords && !loadingGps && !gpsError

  const latDisplay = coords?.lat != null ? coords.lat.toFixed(6) : loadingGps ? '…' : '—'

  const lngDisplay =
    coords?.lng != null ? coords.lng.toFixed(6) : loadingGps ? '…' : awaitingGps ? 'Awaiting GPS' : '—'



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

        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">

          Medical / Trauma Centers

        </h3>



        {!coords && !loadingHospitals && (

          <div className="rounded-xl border border-warning-amber/30 bg-warning-amber/5 p-4">

            <p className="text-sm leading-relaxed text-slate-300">

              Enable GPS to scan top-rated hospitals within 10 km.

            </p>

          </div>

        )}



        {loadingHospitals && (

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">

            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">

              Scanning nearby hospitals…

            </p>

            <SkeletonLoader lines={3} pulsing />

          </div>

        )}



        {coords && !loadingHospitals && traumaCenters.length === 0 && (

          <div className="rounded-xl border border-warning-amber/30 bg-warning-amber/5 p-4">

            <p className="text-sm leading-relaxed text-slate-300">

              No hospitals found within 10 km. Use emergency helplines below or check Crisis POI

              tabs.

            </p>

            <div className="mt-4 space-y-2">

              {EMERGENCY_HELPLINES.slice(0, 2).map((line) => (

                <div

                  key={line.id}

                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3"

                >

                  <p className="font-semibold text-white">{line.name}</p>

                  <a

                    href={line.telHref}

                    className="rounded-full bg-traffic-red px-4 py-2 text-sm font-bold text-white"

                  >

                    {line.phone}

                  </a>

                </div>

              ))}

            </div>

          </div>

        )}



        {coords && !loadingHospitals && (

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

      </div>



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

    </div>

  )

}


