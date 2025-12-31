# Advanced SDK Features

The Scaffald SDK includes several advanced features for optimizing API usage, customizing requests, and improving performance.

## Table of Contents

- [Request/Response Interceptors](#requestresponse-interceptors)
- [Response Caching](#response-caching)
- [Request Deduplication](#request-deduplication)
- [Rate Limit Tracking](#rate-limit-tracking)
- [Bundle Optimization](#bundle-optimization)

## Request/Response Interceptors

Interceptors allow you to transform requests before they're sent, modify responses before they're returned, or handle errors in a custom way.

### Request Interceptors

Add custom headers, log requests, or modify URLs before they're sent:

```typescript
import Scaffald from '@scaffald/sdk'

const client = new Scaffald({ apiKey: 'sk_live_...' })

// Add a request interceptor
const id = client.getInterceptors().addRequestInterceptor(async (url, init) => {
  // Add custom header
  init.headers = {
    ...init.headers,
    'X-Request-ID': crypto.randomUUID(),
  }

  // Log request
  console.log('Request:', init.method, url)

  return { url, init }
})

// Remove interceptor later
client.getInterceptors().removeRequestInterceptor(id)
```

### Response Interceptors

Transform or log responses:

```typescript
// Add a response interceptor
client.getInterceptors().addResponseInterceptor(async (response) => {
  // Log response
  console.log('Response:', response.status, response.url)

  // You can clone and modify the response if needed
  return response
})
```

### Error Interceptors

Handle errors globally:

```typescript
// Add an error interceptor
client.getInterceptors().addErrorInterceptor(async (error) => {
  // Log error to external service
  console.error('API Error:', error.message)

  // You can return a custom Response to recover from errors
  // Or re-throw the error to propagate it
  return error
})
```

### Use Cases

**Authentication Refresh**:
```typescript
client.getInterceptors().addErrorInterceptor(async (error) => {
  if (error.message.includes('401')) {
    // Refresh token
    const newToken = await refreshAccessToken()

    // Update client
    // Note: You'll need to create a new client with the new token

    // Or return a new response after retry
  }

  return error
})
```

**Request Logging**:
```typescript
client.getInterceptors().addRequestInterceptor(async (url, init) => {
  await analytics.track('api_request', {
    url,
    method: init.method,
    timestamp: Date.now(),
  })

  return { url, init }
})
```

## Response Caching

The SDK includes an intelligent response cache that can dramatically reduce API calls and improve performance.

### Enable Caching

```typescript
const client = new Scaffald({
  apiKey: 'sk_live_...',
  cache: {
    enabled: true,
    defaultTtl: 5 * 60 * 1000, // 5 minutes (default)
    maxSize: 100, // Maximum 100 cached responses (default)
  },
})
```

### Cache Control

```typescript
// Enable cache after initialization
client.getCache().enable()

// Disable cache
client.getCache().disable()

// Clear all cache
client.getCache().clear()

// Invalidate specific cache entries
client.getCache().invalidate(/jobs/) // Clear all job-related cache

// Get cache statistics
const stats = client.getCache().getStats()
console.log(`Cache: ${stats.size}/${stats.maxSize} (${stats.enabled ? 'enabled' : 'disabled'})`)
```

### How It Works

- **Only GET requests** are cached by default
- Cache keys include URL and query parameters
- Cached responses respect TTL (time-to-live)
- LRU eviction when cache is full
- Separate cache per client instance

### Example: Smart Caching Strategy

```typescript
const client = new Scaffald({
  apiKey: 'sk_live_...',
  cache: {
    enabled: true,
    defaultTtl: 5 * 60 * 1000, // 5 minutes for most endpoints
  },
})

// Fetch jobs (will be cached)
const jobs = await client.jobs.list({ limit: 20 })

// Same request within 5 minutes will use cache
const cachedJobs = await client.jobs.list({ limit: 20 }) // Instant!

// Invalidate cache after creating a new application
await client.applications.createQuick({ /* ... */ })
client.getCache().invalidate(/applications/)
```

## Request Deduplication

Request deduplication prevents multiple identical concurrent requests from being sent to the API.

### How It Works

When multiple parts of your application request the same data simultaneously, only one HTTP request is made. All callers receive a clone of the same response.

```typescript
const client = new Scaffald({
  apiKey: 'sk_live_...',
  enableDeduplication: true, // Enabled by default
})

// These three calls happen simultaneously
const [job1, job2, job3] = await Promise.all([
  client.jobs.retrieve('job_123'),
  client.jobs.retrieve('job_123'),
  client.jobs.retrieve('job_123'),
])

// Only ONE HTTP request was made!
// All three calls receive the same data
```

### Disable Deduplication

```typescript
const client = new Scaffald({
  apiKey: 'sk_live_...',
  enableDeduplication: false,
})
```

### When It Helps

- **React components**: Multiple components fetching the same data during render
- **Parallel operations**: Making multiple API calls at once
- **Real-time updates**: Polling the same endpoint from different parts of your app

### Limitations

- Only deduplicates **GET requests**
- Only prevents **concurrent** duplicate requests
- Does not deduplicate sequential requests (use caching for that)

## Rate Limit Tracking

Monitor and react to API rate limits in real-time.

### Get Rate Limit Info

```typescript
const info = client.getRateLimitInfo()

if (info) {
  console.log(`Rate limit: ${info.remaining}/${info.limit}`)
  console.log(`Resets in ${client.getSecondsUntilRateLimitReset()} seconds`)
}
```

### Subscribe to Updates

```typescript
const unsubscribe = client.onRateLimitUpdate((info) => {
  console.log(`Rate limit updated: ${info.remaining}/${info.limit}`)

  if (client.isRateLimitApproaching()) {
    console.warn('⚠️  Rate limit approaching!')
  }

  if (client.isRateLimitExceeded()) {
    console.error('❌ Rate limit exceeded!')
  }
})

// Later: clean up
unsubscribe()
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react'
import { client } from './client'

function useRateLimit() {
  const [rateLimit, setRateLimit] = useState(client.getRateLimitInfo())

  useEffect(() => {
    const unsubscribe = client.onRateLimitUpdate(setRateLimit)
    return unsubscribe
  }, [])

  return {
    rateLimit,
    isApproaching: client.isRateLimitApproaching(),
    isExceeded: client.isRateLimitExceeded(),
    secondsUntilReset: client.getSecondsUntilRateLimitReset(),
  }
}

function RateLimitBadge() {
  const { rateLimit, isApproaching } = useRateLimit()

  if (!rateLimit) return null

  return (
    <div className={isApproaching ? 'warning' : 'normal'}>
      {rateLimit.remaining}/{rateLimit.limit} requests remaining
    </div>
  )
}
```

## Bundle Optimization

The SDK is built with aggressive optimization to keep bundle sizes small.

### Bundle Sizes

The SDK is split into multiple bundles for optimal tree-shaking:

- **Core SDK** (`@scaffald/sdk`): Main client with all resources
- **React Hooks** (`@scaffald/sdk/react`): React-specific hooks
- **OAuth** (`@scaffald/sdk/oauth`): OAuth client only
- **Webhooks** (`@scaffald/sdk/webhooks`): Webhook verification only

### Import What You Need

```typescript
// Full SDK (includes everything)
import Scaffald from '@scaffald/sdk'

// OAuth only (smaller bundle)
import { OAuthClient } from '@scaffald/sdk/oauth'

// Webhooks only (smaller bundle)
import { verifyWebhookSignature } from '@scaffald/sdk/webhooks'
```

### Analyze Bundle Size

```bash
# Build and analyze bundle sizes
pnpm build:analyze

# Output:
# ┌─────────────────────────────────────────┬────────────┬──────────────┐
# │ Bundle                                  │ Size       │ Gzipped      │
# ├─────────────────────────────────────────┼────────────┼──────────────┤
# │ index.mjs                               │ 45.2 KB    │ 12.8 KB      │
# │ react/index.mjs                         │ 8.5 KB     │ 2.1 KB       │
# │ oauth/oauth.mjs                         │ 6.2 KB     │ 1.8 KB       │
# │ webhooks/verify.mjs                     │ 2.1 KB     │ 0.7 KB       │
# └─────────────────────────────────────────┴────────────┴──────────────┘
```

### Build Optimizations

The SDK uses several build optimizations:

1. **Code Splitting**: Separate bundles for optional features
2. **Tree Shaking**: Aggressive unused code removal
3. **Minification**: Property mangling and comment removal
4. **Modern Target**: ES2020+ for smaller output
5. **Dual Format**: ESM (smaller) and CJS (compatibility)

### Tree Shaking Example

```typescript
// ❌ Imports everything
import Scaffald from '@scaffald/sdk'

// ✅ Only imports OAuth (tree-shakes the rest)
import { OAuthClient } from '@scaffald/sdk'

// ✅ Even better: use the standalone OAuth bundle
import { OAuthClient } from '@scaffald/sdk/oauth'
```

## Configuration Reference

Complete configuration example with all advanced features:

```typescript
const client = new Scaffald({
  // Authentication
  apiKey: 'sk_live_...',
  // OR
  accessToken: 'oauth_token',

  // Network
  baseUrl: 'https://api.scaffald.com',
  maxRetries: 3,
  timeout: 60000, // 60 seconds

  // Custom headers
  headers: {
    'X-Custom-Header': 'value',
  },

  // Caching
  cache: {
    enabled: true,
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
  },

  // Deduplication
  enableDeduplication: true,
})

// Add interceptors
client.getInterceptors().addRequestInterceptor(async (url, init) => {
  // Custom request logic
  return { url, init }
})

client.getInterceptors().addResponseInterceptor(async (response) => {
  // Custom response logic
  return response
})

client.getInterceptors().addErrorInterceptor(async (error) => {
  // Custom error handling
  return error
})

// Subscribe to rate limits
const unsubscribe = client.onRateLimitUpdate((info) => {
  console.log('Rate limit:', info)
})
```

## Best Practices

### 1. Enable Caching for Read-Heavy Apps

```typescript
const client = new Scaffald({
  apiKey: 'sk_live_...',
  cache: {
    enabled: true,
    defaultTtl: 5 * 60 * 1000, // 5 minutes
  },
})
```

### 2. Use Request Deduplication

```typescript
// Default behavior - keep it enabled!
const client = new Scaffald({
  apiKey: 'sk_live_...',
  enableDeduplication: true,
})
```

### 3. Monitor Rate Limits Proactively

```typescript
client.onRateLimitUpdate((info) => {
  if (info.remaining < 10) {
    // Throttle requests
    console.warn('Approaching rate limit!')
  }
})
```

### 4. Use Interceptors for Cross-Cutting Concerns

```typescript
// Logging
client.getInterceptors().addRequestInterceptor(async (url, init) => {
  logger.info('API Request', { url, method: init.method })
  return { url, init }
})

// Error tracking
client.getInterceptors().addErrorInterceptor(async (error) => {
  errorTracker.captureException(error)
  return error
})
```

### 5. Invalidate Cache After Mutations

```typescript
// Create new job
await client.jobs.create(/* ... */)

// Clear job cache so next list() call fetches fresh data
client.getCache().invalidate(/jobs/)
```

## Next Steps

- [API Reference](./api-reference.md)
- [React Integration](./react.md)
- [OAuth Guide](./oauth.md)
- [Webhook Guide](./webhooks.md)
