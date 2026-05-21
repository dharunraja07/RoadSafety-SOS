import { haversineKm, formatDistance, estimateEtaMinutes } from './geo'

const POI_TEMPLATES = {
  police: [
    { name: 'District 7 Highway Patrol', phone: '+15550202001', offset: [0.007, -0.012] },
    { name: 'Central Police Precinct', phone: '+15550202002', offset: [-0.014, 0.019] },
    { name: 'Interstate Response Unit', phone: '+15550202003', offset: [0.025, 0.006] },
    { name: 'South Metro Sheriff Station', phone: '+15550202004', offset: [-0.021, -0.008] },
    { name: 'Rapid Response Patrol Hub', phone: '+15550202005', offset: [0.011, 0.022] },
  ],
  towing: [
    { name: '24/7 Road Rescue Towing', phone: '+15550303001', offset: [0.005, 0.009] },
    { name: 'Highway Heroes Tow Service', phone: '+15550303002', offset: [-0.008, -0.013] },
    { name: 'Express Lane Recovery', phone: '+15550303003', offset: [0.017, -0.007] },
    { name: 'All-State Emergency Tow', phone: '+15550303004', offset: [-0.016, 0.011] },
    { name: 'Crash & Dash Towing Co.', phone: '+15550303005', offset: [0.028, -0.019] },
  ],
}

export function getPoisForCategory(category, lat, lng) {
  const templates = POI_TEMPLATES[category] || []
  return templates
    .map((t) => {
      const poiLat = lat + t.offset[0]
      const poiLng = lng + t.offset[1]
      const km = haversineKm(lat, lng, poiLat, poiLng)
      const eta = estimateEtaMinutes(km)
      return {
        id: `${category}-${t.name}`,
        name: t.name,
        phone: t.phone,
        lat: poiLat,
        lng: poiLng,
        distance: formatDistance(km),
        distanceKm: km,
        eta: `${eta} min`,
        telHref: `tel:${t.phone.replace(/\D/g, '')}`,
      }
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

export const POI_TABS = [
  { id: 'trauma', label: 'Trauma Centers', emoji: '🚑' },
  { id: 'police', label: 'Police Stations', emoji: '🚓' },
  { id: 'towing', label: 'Towing Services', emoji: '🛞' },
]
