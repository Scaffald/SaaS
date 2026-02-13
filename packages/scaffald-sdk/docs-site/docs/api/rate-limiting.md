# Rate Limiting

Understand and manage API rate limits.

## Overview

The Scaffald API implements rate limiting to ensure fair usage and system stability. The SDK provides built-in methods to monitor and respond to rate limits.

**Default Limits:**
- **Standard endpoints**: 1000 requests per hour
- **Profile endpoints**: 100 requests per 15 minutes
- **OAuth endpoints**: 20 requests per minute

## Methods

### `client.getRateLimitInfo()`

Get current rate limit information from the last API request.

```typescript
const info = client.getRateLimitInfo()
```

**Returns:**

```typescript
{
  limit: number      // Total requests allowed
  remaining: number  // Requests remaining
  reset: number      // Unix timestamp when limit resets
  resetAt: Date      // Date object of reset time
}
```

**Example:**

```typescript
const jobs = await client.jobs.list()
const info = client.getRateLimitInfo()

console.log(`${info.remaining}/${info.limit} requests remaining`)
console.log(`Resets at: ${info.resetAt.toLocaleString()}`)
```

---

### `client.isRateLimitApproaching(threshold?)`

Check if rate limit is approaching a threshold.

```typescript
const isClose = client.isRateLimitApproaching(threshold?: number)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `threshold` | `number` | `0.2` | Warning threshold (0.2 = 20% remaining) |

**Returns:** `boolean`

**Example:**

```typescript
await client.jobs.list()

if (client.isRateLimitApproaching()) {
  console.warn('Slow down! Less than 20% of rate limit remaining')
}

if (client.isRateLimitApproaching(0.1)) {
  console.error('Critical! Less than 10% remaining')
  // Consider implementing backoff or caching
}
```

---

### `client.getSecondsUntilRateLimitReset()`

Get seconds until rate limit resets.

```typescript
const seconds = client.getSecondsUntilRateLimitReset()
```

**Returns:** `number` (seconds until reset, or 0 if already reset)

**Example:**

```typescript
const seconds = client.getSecondsUntilRateLimitReset()

if (seconds > 0) {
  console.log(`Rate limit resets in ${seconds} seconds`)
  console.log(`Wait until: ${new Date(Date.now() + seconds * 1000)}`)
}
```

---

### `client.onRateLimitUpdate(callback)`

Subscribe to rate limit updates after each API request.

```typescript
const unsubscribe = client.onRateLimitUpdate(
  callback: (info: RateLimitInfo) => void
)
```

**Returns:** `() => void` (unsubscribe function)

**Example:**

```typescript
const unsubscribe = client.onRateLimitUpdate((info) => {
  console.log(`Rate limit updated: ${info.remaining}/${info.limit}`)

  if (info.remaining === 0) {
    console.error('Rate limit exceeded!')
    // Handle rate limit exceeded
  }

  if (info.remaining < info.limit * 0.1) {
    console.warn('Less than 10% remaining!')
  }
})

// Make API requests...
await client.jobs.list()
await client.jobs.retrieve('job_123')

// Clean up when done
unsubscribe()
```

## Best Practices

### 1. Cache Responses

Reduce API calls by caching responses:

```typescript
const cache = new Map()

async function getCachedJobs() {
  const cacheKey = 'jobs_list'

  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey)

    // Cache for 5 minutes
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data
    }
  }

  const jobs = await client.jobs.list()
  cache.set(cacheKey, { data: jobs, timestamp: Date.now() })

  return jobs
}
```

### 2. Implement Backoff

Use exponential backoff when rate limited:

```typescript
async function exponentialBackoff(fn, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 30000)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}
```

### 3. Monitor Usage

Track your rate limit usage:

```typescript
client.onRateLimitUpdate((info) => {
  // Log to analytics
  analytics.track('rate_limit', {
    remaining: info.remaining,
    limit: info.limit,
    percentage: (info.remaining / info.limit * 100).toFixed(2)
  })
})
```

## Rate Limit Response

When rate limited, the API returns a 429 status code:

```json
{
  "error": {
    "type": "rate_limit_exceeded",
    "message": "Too many requests. Please try again later.",
    "retry_after": 60
  }
}
```

The `retry_after` field indicates seconds to wait before retrying.

## Next Steps

- [Client Configuration](/docs/api/client) - Configure retry behavior
- [OAuth API](/docs/api/oauth) - Implement authentication
- [API Overview](/docs/api/overview) - Browse all API resources
