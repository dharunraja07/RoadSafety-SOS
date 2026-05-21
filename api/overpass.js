const OVERPASS_MIRRORS = [
    'https://overpass.openstreetmap.fr/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass-api.de/api/interpreter',
]

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        res.status(204).end()
        return
    }

    let body = ''
    await new Promise((resolve) => {
        req.on('data', (chunk) => (body += chunk))
        req.on('end', resolve)
    })

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

            if (!r.ok) continue

            const text = await r.text()
            res.setHeader('Content-Type', 'application/json')
            res.status(200).send(text)
            return
        } catch (e) {
            // try next mirror
            continue
        }
    }

    res.status(502).json({ error: 'All Overpass mirrors failed' })
}
