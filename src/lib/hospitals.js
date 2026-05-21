import { haversineKm } from './geo'

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

async function executeOverpassQuery(lat, lng, radius) {
  try {
    const params = new URLSearchParams({ lat, lng, radius })
    const url = `/api/overpass?${params.toString()}`

    console.log(`[hospitals] Fetching from proxy: ${url}`)

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      console.error(`[hospitals] Proxy returned ${res.status}: ${res.statusText}`)
      let errMsg = `Fetch failed: Server returned status ${res.status}`
      try {
        const errorJson = await res.json()
        if (errorJson && errorJson.error) {
          errMsg = errorJson.error
        }
      } catch (parseErr) {
        // ignore JSON parsing issues if response is not JSON
      }
      throw new Error(errMsg)
    }

    const data = await res.json()
    if (!data || !Array.isArray(data.elements)) {
      console.error('[hospitals] Invalid response structure from proxy:', data)
      throw new Error('Invalid response structure received from server')
    }
    console.log(`[hospitals] Proxy returned ${data.elements.length} elements`)
    return data
  } catch (err) {
    console.error('[hospitals] Proxy error:', err && err.message)
    throw err
  }
}

export async function fetchHospitalsNearby(lat, lng, radius = 10000) {
  try {
    const data = await executeOverpassQuery(lat, lng, radius)
    const results = parseOverpassElements(data.elements, lat, lng)
    console.log(`[hospitals] Parsed ${results.length} hospitals`)
    return results
  } catch (err) {
    console.error('[hospitals] Fetch failed, propagating error:', err && err.message)
    throw err
  }
}
