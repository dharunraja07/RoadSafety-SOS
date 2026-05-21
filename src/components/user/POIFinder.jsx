import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Phone, MapPin } from 'lucide-react'
import { POI_TABS, getPoisForCategory } from '../../lib/poiData'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export default function POIFinder({ lat, lng, excludeTrauma = false }) {
  const tabs = excludeTrauma ? POI_TABS.filter((t) => t.id !== 'trauma') : POI_TABS
  const [tab, setTab] = useState(tabs[0]?.id ?? 'police')

  const mockPois = useMemo(() => {
    if (lat == null || lng == null) return []
    return getPoisForCategory(tab, lat, lng)
  }, [tab, lat, lng])

  if (lat == null || lng == null) {
    return (
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
          Crisis Points of Interest
        </h3>
        <p className="text-sm text-slate-500">
          Enable GPS to see nearby police, towing, and other crisis POIs.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
        Crisis Points of Interest
      </h3>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-900 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              tab === t.id
                ? 'bg-traffic-red text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {t.emoji} {t.label.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="mb-4 h-40 overflow-hidden rounded-xl border border-slate-800">
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]}>
            <Popup>You are here</Popup>
          </Marker>
          {mockPois.slice(0, 3).map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]}>
              <Popup>{p.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="space-y-3">
        {mockPois.map((poi) => (
          <div
            key={poi.id}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-white">{poi.name}</h4>
                <p className="mt-1 text-sm text-slate-400">
                  <span className="font-mono text-warning-amber">{poi.distance}</span>
                  <span className="mx-2 text-slate-600">·</span>
                  ETA <span className="text-emerald-400">{poi.eta}</span>
                </p>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-500">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Near your GPS lock</span>
                </p>
              </div>
              <a
                href={poi.telHref}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-500"
                aria-label={`Call ${poi.name}`}
              >
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
