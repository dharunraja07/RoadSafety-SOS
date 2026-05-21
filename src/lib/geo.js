const EARTH_RADIUS_KM = 6371

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function estimateEtaMinutes(km) {
  return Math.max(3, Math.round(km * 2.5))
}

export async function reverseGeocode(lat, lng) {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('format', 'json')

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error('Geocode failed')
    const data = await res.json()
    return data.display_name || null
  } catch {
    return null
  }
}

export const geoOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

export function detectBrowser() {
  const ua = navigator.userAgent
  if (/Edg\//i.test(ua)) return 'edge'
  if (/Chrome|CriOS/i.test(ua) && !/Edg/i.test(ua)) return 'chrome'
  if (/Firefox|FxiOS/i.test(ua)) return 'firefox'
  if (/Safari/i.test(ua) && !/Chrome|CriOS|Edg/i.test(ua)) return 'safari'
  return 'other'
}

export function getPermissionDeniedBrowserGuidance() {
  const browser = detectBrowser()
  switch (browser) {
    case 'chrome':
      return 'Chrome: tap the lock icon in the address bar → Site settings → Location → Allow, then tap Retry GPS.'
    case 'edge':
      return 'Edge: tap the lock icon in the address bar → Permissions for this site → Location → Allow, then tap Retry GPS.'
    case 'firefox':
      return 'Firefox: tap the padlock in the address bar → Connection secure → More information → Permissions → Access your location → Allow, then Retry GPS.'
    case 'safari':
      return 'Safari: Safari menu → Settings for This Website → Location → Allow, then reload and tap Retry GPS.'
    default:
      return 'Open your browser site settings, allow location for this page, then tap Retry GPS.'
  }
}

export async function queryGeolocationPermission() {
  if (!navigator.permissions?.query) {
    return 'unknown'
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    return status.state
  } catch {
    return 'unknown'
  }
}

export function getGeolocationErrorMessage(err) {
  if (!err) {
    return 'GPS unavailable. Enable location permission to use emergency features.'
  }
  if (err.code === 1) {
    return `Location permission denied. ${getPermissionDeniedBrowserGuidance()}`
  }
  if (err.code === 3) {
    return 'Location request timed out. Move to an open area or retry for a high-accuracy GPS lock.'
  }
  if (err.message === 'Geolocation not supported') {
    return 'Geolocation is not supported on this device. Emergency routing requires a GPS-capable browser.'
  }
  return 'GPS unavailable. Enable location permission to use emergency features.'
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(err),
      geoOptions,
    )
  })
}
