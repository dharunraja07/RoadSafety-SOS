import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { URL } from 'url'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-overpass-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/overpass')) {
            try {
              const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
              const lat = urlObj.searchParams.get('lat')
              const lng = urlObj.searchParams.get('lng')
              const radius = urlObj.searchParams.get('radius')

              // Attach query helper for standard request mapping
              req.query = { lat, lng, radius }

              // Dynamically import local function handler with a cache-buster
              const apiPath = path.resolve(process.cwd(), 'api/overpass.js')
              // Use file:// protocol for absolute Windows paths to prevent import failures in ESM
              const fileUrl = `file://${apiPath.replace(/\\/g, '/')}`
              const { default: handler } = await import(`${fileUrl}?update=${Date.now()}`)

              await handler(req, res)
            } catch (err) {
              console.error('Error in local API middleware:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Internal Server Error in Local Middleware', details: err.message }))
            }
            return
          }
          next()
        })
      }
    }
  ],
  assetsInclude: ['**/*.png'],
})
