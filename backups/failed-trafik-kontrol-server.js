import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './src/index.js'

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// Health check specific to Node.js environment
app.get('/api/node-health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    service: 'Traffic Management Platform Node.js',
    version: '3.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: 'node'
  })
})

const port = 3000
console.log(`Starting Traffic Management Platform on port ${port}`)

serve({
  fetch: app.fetch,
  port
})

console.log(`🚀 Server is running on http://localhost:${port}`)