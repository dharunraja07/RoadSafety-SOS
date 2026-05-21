const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

export default async function handler(req, res) {
  const startTime = Date.now()
  const MAX_FUNCTION_TIME = 9000 // 9 seconds total budget to prevent Vercel 10s timeout

  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Content-Type', 'application/json')

    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    // Handle only GET
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.end(JSON.stringify({ error: 'Method not allowed' }))
      return
    }

    const { lat, lng, radius } = req.query

    // Validate parameters
    if (!lat || !lng || !radius) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Missing parameters: lat, lng, radius' }))
      return
    }

    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    const radiusNum = parseFloat(radius)

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || !Number.isFinite(radiusNum)) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Invalid lat/lng/radius: must be numbers' }))
      return
    }

    console.log(`[overpass-proxy] Fetching hospitals: lat=${latNum}, lng=${lngNum}, radius=${radiusNum}`)

    // Build Overpass query with a short server-side timeout of 10s
    const query = `[out:json][timeout:10];
(
  node["amenity"="hospital"](around:${radiusNum},${latNum},${lngNum});
  way["amenity"="hospital"](around:${radiusNum},${latNum},${lngNum});
  relation["amenity"="hospital"](around:${radiusNum},${latNum},${lngNum});
);
out center;`

    console.log(`[overpass-proxy] Query: ${query.replace(/\n/g, ' ')}`)

    // Try each mirror
    for (let i = 0; i < OVERPASS_MIRRORS.length; i++) {
      const url = OVERPASS_MIRRORS[i]
      const elapsed = Date.now() - startTime
      const remainingTime = MAX_FUNCTION_TIME - elapsed

      if (remainingTime <= 1000) {
        console.warn(`[overpass-proxy] Time budget exhausted (${remainingTime}ms remaining). Skipping remaining mirrors.`)
        break
      }

      const currentTimeout = Math.min(3000, remainingTime) // Max 3s timeout per mirror
      console.log(`[overpass-proxy] Mirror ${i + 1}/${OVERPASS_MIRRORS.length}: ${url} (Timeout: ${currentTimeout}ms)`)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), currentTimeout)

        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            Accept: 'application/json',
            'User-Agent': 'RoadSoS/1.0 (+https://github.com/dharunraja07/RoadSafety-SOS)',
          },
          body: query,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!r.ok) {
          console.error(`[overpass-proxy] Mirror ${url} failed with status ${r.status} ${r.statusText}`)
          continue
        }

        const text = await r.text()
        console.log(`[overpass-proxy] Mirror ${url} succeeded, response length: ${text.length}`)

        // Validate it's valid JSON and contains elements
        try {
          const parsed = JSON.parse(text)
          if (!parsed || !Array.isArray(parsed.elements)) {
            console.error(`[overpass-proxy] Mirror ${url} returned response without elements array`)
            continue
          }
        } catch (parseErr) {
          console.error(`[overpass-proxy] Mirror ${url} returned invalid JSON: ${parseErr.message}`)
          continue
        }

        res.statusCode = 200
        res.end(text)
        return
      } catch (e) {
        const errMsg = e && e.message ? e.message : String(e)
        const isAbort = e && e.name === 'AbortError'
        console.error(`[overpass-proxy] Mirror ${url} error: ${isAbort ? 'Timeout / Aborted' : errMsg}`)
        if (i < OVERPASS_MIRRORS.length - 1) {
          console.log(`[overpass-proxy] Retrying next mirror...`)
        }
      }
    }

    // All mirrors failed or timed out
    console.error('[overpass-proxy] All mirrors failed to return valid data')
    res.statusCode = 502
    res.end(JSON.stringify({ error: 'All Overpass mirrors failed or timed out' }))
  } catch (err) {
    const errStack = err && err.stack ? err.stack : String(err)
    console.error('[overpass-proxy] Unexpected error:', errStack)
    try {
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'Internal server error occurred while proxying Overpass API' }))
    } catch (e) {
      // ignore
    }
  }
}
