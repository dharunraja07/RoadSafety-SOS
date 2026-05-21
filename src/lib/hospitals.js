import { haversineKm } from './geo'

const OVERPASS_URLS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

export const EMERGENCY_HELPLINES = [
  { id: 'helpline-911', name: 'United States Emergency', phone: '911', telHref: 'tel:911' },
  { id: 'helpline-112', name: 'Europe / International', phone: '112', telHref: 'tel:112' },
  { id: 'helpline-108', name: 'Ambulance Hotline', phone: '108', telHref: 'tel:108' },
  { id: 'helpline-999', name: 'United Kingdom Emergency', phone: '999', telHref: 'tel:999' },
  { id: 'helpline-000', name: 'Australia Emergency', phone: '000', telHref: 'tel:000' },
]

export function buildHospitalAddress(tags = {}) {
  const street = tags['addr:street']
  const city = tags['addr:city']
  const combined = [street, city].filter(Boolean).join(', ')
  return combined || tags['addr:full'] || tags['addr:place'] || 'Address not listed'
}

const PRIORITY_KEYWORDS = [
  'speciality',
  'specialty',
  'multi-specialty',
  'multispecialty',
  'trauma',
  'general',
  'medical college',
]

function parseRating(value) {
  if (value == null) return null
  const rating = parseFloat(String(value).replace(',', '.'))
  if (!Number.isFinite(rating) || rating <= 0) return null
  return Math.min(5, Math.max(0, rating))
}

function isPriorityHospital(name = '', tags = {}) {
  const normalized = String(name).toLowerCase()
  if (PRIORITY_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return true
  }

  const specialityTag = String(tags.speciality || '').toLowerCase()
  if (PRIORITY_KEYWORDS.some((keyword) => specialityTag.includes(keyword))) {
    return true
  }

  return false
}

export function parseOverpassElements(elements, userLat, userLng) {
  if (!Array.isArray(elements)) return []

  return elements
    .map((el) => {
      const tags = el.tags || {}
      let lat = null
      let lon = null

      if (el.type === 'node' && el.lat != null && el.lon != null) {
        lat = el.lat
        lon = el.lon
      } else if (
        (el.type === 'way' || el.type === 'relation') &&
        el.center?.lat != null &&
        el.center?.lon != null
      ) {
        lat = el.center.lat
        lon = el.center.lon
      }

      if (lat == null || lon == null) {
        return null
      }

      const km = haversineKm(userLat, userLng, lat, lon)
      const rating = parseRating(tags.rating ?? tags.stars)
      const name = tags.name || 'Unnamed Emergency Facility'
      const priority = isPriorityHospital(name, tags)
      return {
        id: `hospital-${el.id}`,
        name,
        address: buildHospitalAddress(tags),
        lat,
        lng: lon,
        rating,
        ratingDisplay: rating != null ? `${rating.toFixed(1)}★` : 'Unrated',
        distanceKm: km,
        distance: `${km.toFixed(1)} km away`,
        mapsHref: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
        isPriority: priority,
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.isPriority !== b.isPriority) {
        return b.isPriority ? 1 : -1
      }
      if (a.rating != null || b.rating != null) {
        if (a.rating == null) return 1
        if (b.rating == null) return -1
        if (b.rating !== a.rating) return b.rating - a.rating
      }
      return a.distanceKm - b.distanceKm
    })
}

async function executeOverpassQuery(query) {
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          Accept: 'application/json',
        },
        body: query,
      })

      if (!res.ok) {
        continue
      }

      return await res.json()
    } catch {
      continue
    }
  }

  throw new Error('All Overpass mirrors failed')
}

export async function fetchHospitalsNearby(lat, lng, radius = 10000) {
  try {
    const query = `[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radius},${lat},${lng});
  way["amenity"="hospital"](around:${radius},${lat},${lng});
  relation["amenity"="hospital"](around:${radius},${lat},${lng});
);
out center;`

    const data = await executeOverpassQuery(query)
    return parseOverpassElements(data.elements, lat, lng)
  } catch {
    return []
  }
}
