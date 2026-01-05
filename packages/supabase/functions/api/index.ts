import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import jobsRouter from './routes/jobs.ts'
import oauthRouter from './routes/oauth.ts'
import applicationsRouter from './routes/applications.ts'
import profilesRouter from './routes/profiles.ts'
import apiKeysRouter from './routes/api-keys.ts'
import openapi from './openapi.ts'
import { authMiddleware } from './middleware/auth.ts'
import { trackApiKeyUsage, rateLimitMiddleware } from './middleware/usage-tracker.ts'

const app = new Hono()

// Middleware
app.use(
  '*',
  cors({
    origin: '*', // TODO: Configure allowed origins
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 600,
    credentials: true,
  })
)
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', authMiddleware) // Global auth middleware (handles both JWT and API keys)
app.use('*', rateLimitMiddleware) // Rate limit API key requests
app.use('*', trackApiKeyUsage) // Track API key usage

// Routes
app.route('/v1/jobs', jobsRouter)
app.route('/oauth', oauthRouter) // REQ-10: OAuth 2.0 authorization server
app.route('/v1/applications', applicationsRouter)
app.route('/v1/profiles', profilesRouter)
app.route('/v1/api-keys', apiKeysRouter) // API key management

// OpenAPI documentation
app.route('/', openapi)

// Health check
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
)

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json(
    {
      error: err.message || 'Internal server error',
      ...(Deno.env.get('NODE_ENV') === 'development' && { stack: err.stack }),
    },
    500
  )
})

Deno.serve(app.fetch)
