const OVERPASS_MIRRORS = [
    'https://overpass.openstreetmap.fr/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass-api.de/api/interpreter',
]

module.exports = async (req, res) => {
    try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
        }

        let body = ''
        await new Promise((resolve) => {
            req.on('data', (chunk) => (body += chunk))
            req.on('end', resolve)
        })

        if (!body) {
            // no body provided
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing request body' }))
            return
        }

        for (const url of OVERPASS_MIRRORS) {
            try {
                const r = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                        Accept: 'application/json',
                        'User-Agent': 'RoadSoS/1.0 (+https://github.com/dharunraja07/RoadSafety-SOS)'
                    },
                    body,
                })

                if (!r.ok) {
                    // log and try next mirror
                    console.error('Overpass mirror error', url, r.status)
                    continue
                }

                const text = await r.text()
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(text)
                return
            } catch (e) {
                console.error('Overpass proxy request failed for', url, e && e.message)
                continue
            }
        }

        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'All Overpass mirrors failed' }))
    } catch (err) {
        console.error('Overpass proxy unexpected error', err && err.stack)
        try {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Internal server error' }))
        } catch (e) {
            // ignore
        }
    }
}
