import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import {
  reverseGeocode,
  getGeolocationErrorMessage,
  geoOptions,
  queryGeolocationPermission,
  getIpLocation,
} from '../lib/geo'

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null)
  const [address, setAddress] = useState('')
  const [gpsError, setGpsError] = useState(false)
  const [gpsErrorMessage, setGpsErrorMessage] = useState('')
  const [loadingGps, setLoadingGps] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState('unknown')
  const [permissionDeclined, setPermissionDeclined] = useState(false)
  const [permissionChecked, setPermissionChecked] = useState(false)

  const requestGps = useCallback(async () => {
    setLoadingGps(true)
    setGpsError(false)
    setGpsErrorMessage('')
    setPermissionDeclined(false)

    if (!navigator.geolocation) {
      const fallback = await getIpLocation()
      if (fallback) {
        setCoords(fallback)
        setGpsError(false)
        setGpsErrorMessage('Using approximate location from network/IP lookup')
        setAddress('Approximate location detected')
        setPermissionStatus('prompt')
        setLoadingGps(false)
        return Promise.resolve(fallback)
      }

      const message = getGeolocationErrorMessage({ message: 'Geolocation not supported' })
      setGpsError(true)
      setGpsErrorMessage(message)
      setCoords(null)
      setAddress('')
      setLoadingGps(false)
      return Promise.resolve(null)
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          const live = { lat, lng }
          setCoords(live)
          setGpsError(false)
          setGpsErrorMessage('')
          setPermissionStatus('granted')
          setLoadingGps(false)
          const geo = await reverseGeocode(lat, lng)
          setAddress(geo || 'Live GPS Location Confirmed')
          resolve(live)
        },
        async (err) => {
          if (err?.code === 1) {
            setPermissionStatus('denied')
          }

          const fallback = await getIpLocation()
          if (fallback) {
            setCoords(fallback)
            setGpsError(false)
            setGpsErrorMessage('Using approximate location from network/IP lookup')
            setAddress('Approximate location detected')
            setLoadingGps(false)
            resolve(fallback)
            return
          }

          setGpsError(true)
          setGpsErrorMessage(getGeolocationErrorMessage(err))
          setCoords(null)
          setAddress('')
          setLoadingGps(false)
          resolve(null)
        },
        geoOptions,
      )
    })
  }, [])

  const allowLocationAccess = useCallback(() => {
    return requestGps()
  }, [requestGps])

  const declineLocationAccess = useCallback(() => {
    setPermissionDeclined(true)
  }, [])

  useEffect(() => {
    let permissionResult = null
    let cancelled = false

    async function initPermission() {
      const state = await queryGeolocationPermission()
      if (cancelled) return

      setPermissionStatus(state)
      setPermissionChecked(true)

      if (state === 'granted') {
        requestGps()
        return
      }

      if (state === 'prompt' || state === 'unknown') {
        requestGps()
        return
      }

      if (state === 'denied') {
        setGpsError(true)
        setGpsErrorMessage(getGeolocationErrorMessage({ code: 1 }))
      }

      if (navigator.permissions?.query) {
        try {
          permissionResult = await navigator.permissions.query({ name: 'geolocation' })
          permissionResult.addEventListener('change', onPermissionChange)
        } catch {
          /* Permissions API unavailable for geolocation */
        }
      }
    }

    function onPermissionChange() {
      if (!permissionResult || cancelled) return
      const next = permissionResult.state
      setPermissionStatus(next)
      if (next === 'granted') {
        setPermissionDeclined(false)
        setGpsError(false)
        setGpsErrorMessage('')
        requestGps()
      } else if (next === 'denied') {
        setGpsError(true)
        setGpsErrorMessage(getGeolocationErrorMessage({ code: 1 }))
        setCoords(null)
        setAddress('')
      }
    }

    initPermission()

    return () => {
      cancelled = true
      permissionResult?.removeEventListener('change', onPermissionChange)
    }
  }, [requestGps])

  const showPermissionModal = useMemo(() => {
    if (!permissionChecked || coords || loadingGps || permissionDeclined) {
      return false
    }
    return permissionStatus === 'prompt' || permissionStatus === 'unknown'
  }, [permissionChecked, coords, loadingGps, permissionDeclined, permissionStatus])

  return (
    <LocationContext.Provider
      value={{
        coords,
        address,
        gpsError,
        gpsErrorMessage,
        loadingGps,
        requestGps,
        permissionStatus,
        permissionDeclined,
        permissionChecked,
        showPermissionModal,
        allowLocationAccess,
        declineLocationAccess,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) {
    throw new Error('useLocation must be used within LocationProvider')
  }
  return ctx
}
