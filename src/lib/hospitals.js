import { haversineKm } from './geo'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

export const EMERGENCY_HELPLINES = [
  { id: 'helpline-911', name: 'United States Emergency', phone: '911', telHref: 'tel:911' },
  { id: 'helpline-112', name: 'Europe / International', phone: '112', telHref: 'tel:112' },
  { id: 'helpline-999', name: 'United Kingdom Emergency', phone: '999', telHref: 'tel:999' },
  { id: 'helpline-000', name: 'Australia Emergency', phone: '000', telHref: 'tel:000' },
]

export function buildHospitalAddress(tags = {}) {
  const street = tags['addr:street']
  const city = tags['addr:city']
  const combined = [street, city].filter(Boolean).join(', ')
  return combined || tags['addr:full'] || tags['addr:place'] || 'Address not listed'
}

function parseRating(value) {
  if (value == null) return null
  const rating = parseFloat(String(value).replace(',', '.'))
  if (!Number.isFinite(rating) || rating <= 0) return null
  return Math.min(5, Math.max(0, rating))
}

export function parseOverpassElements(elements, userLat, userLng) {
  if (!Array.isArray(elements)) return []

  return elements
    .filter((el) => el.type === 'node' && el.lat != null && el.lon != null)
    .map((el) => {
      const tags = el.tags || {}
      const km = haversineKm(userLat, userLng, el.lat, el.lon)
      const rating = parseRating(tags.rating ?? tags.stars)
      return {
        id: `hospital-${el.id}`,
        name: tags.name || 'Unnamed Emergency Facility',
        address: buildHospitalAddress(tags),
        lat: el.lat,
        lng: el.lon,
        rating,
        ratingDisplay: rating != null ? `${rating.toFixed(1)}★` : 'Unrated',
        distanceKm: km,
        distance: `${km.toFixed(1)} km away`,
        mapsHref: `https://www.google.com/maps/dir/?api=1&destination=${el.lat},${el.lon}`,
      }
    })
    .sort((a, b) => {
      if (a.rating != null || b.rating != null) {
        if (a.rating == null) return 1
        if (b.rating == null) return -1
        if (b.rating !== a.rating) return b.rating - a.rating
      }
      return a.distanceKm - b.distanceKm
    })
}

export async function fetchHospitalsNearby(lat, lng) {
  try {
    const query = `[out:json][timeout:25];
node["amenity"="hospital"](around:10000, ${lat}, ${lng});
out body;`

    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query,
    })

    if (!res.ok) {
      throw new Error(`Overpass API responded with ${res.status}`)
    }

    const data = await res.json()
    return parseOverpassElements(data.elements, lat, lng)
  } catch {
    return []
  }
}
