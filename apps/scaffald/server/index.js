/**
 * Production web server for the Expo SSR build.
 *
 * `expo export --platform web` with `web.output: 'server'` emits:
 *   dist/client — hashed static assets, favicon, robots.txt, public/
 *   dist/server — the SSR bundle, API routes, and _expo/routes.json
 *
 * This mirrors what `npx expo serve` does (static first, then the SSR
 * handler), but adds compression, long-lived caching for immutable assets,
 * and a health check so it can sit behind a load balancer / CloudFront.
 *
 * EAS Hosting is not used because its runtime drops `generateMetadata` output,
 * which is the whole point of moving marketing onto the app.
 */

const path = require('node:path')
const express = require('express')
const compression = require('compression')
const { createRequestHandler } = require('expo-server/adapter/express')

const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'
const DIST = path.resolve(__dirname, '..', 'dist')
const CLIENT_DIR = path.join(DIST, 'client')
const SERVER_DIR = path.join(DIST, 'server')

const app = express()

app.disable('x-powered-by')
app.use(compression())

// Load balancers terminate TLS, so trust the forwarding headers for
// req.protocol / req.ip.
app.set('trust proxy', true)

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true })
})

// Fingerprinted bundles and assets never change under a given name.
app.use(
  '/_expo',
  express.static(path.join(CLIENT_DIR, '_expo'), {
    immutable: true,
    maxAge: '1y',
    fallthrough: true,
  })
)

// Everything else in the client dir (favicon, robots.txt, public/ assets).
app.use(
  express.static(CLIENT_DIR, {
    maxAge: '1h',
    // Never let a stale index.html shadow an SSR route.
    index: false,
    extensions: ['html'],
  })
)

app.all(
  '*',
  createRequestHandler({
    build: SERVER_DIR,
  })
)

const server = app.listen(PORT, HOST, () => {
  console.log(`[server] scaffald listening on http://${HOST}:${PORT}`)
})

/** Let in-flight requests finish when the orchestrator recycles the task. */
const shutdown = (signal) => () => {
  console.log(`[server] ${signal} received, closing`)
  server.close((err) => {
    if (err) {
      console.error('[server] error during shutdown:', err)
      process.exit(1)
    }
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown('SIGTERM'))
process.on('SIGINT', shutdown('SIGINT'))
