# API Keys Management

Comprehensive guide to managing API keys programmatically using the Scaffald SDK.

## Overview

API keys provide a simple, secure way to authenticate third-party integrations and SDK access to the Scaffald API. Unlike OAuth access tokens, API keys:

- **Are organization-scoped** - Access organization data, not individual user data
- **Are long-lived** - Don't expire unless you set an expiration date
- **Support fine-grained permissions** - Control access with specific scopes
- **Are server-side only** - Should never be exposed in client-side code
- **Support usage tracking** - Monitor API calls, response times, and error rates

## Table of Contents

- [Quick Start](#quick-start)
- [Creating API Keys](#creating-api-keys)
- [Listing API Keys](#listing-api-keys)
- [Retrieving a Key](#retrieving-a-key)
- [Updating Keys](#updating-keys)
- [Revoking Keys](#revoking-keys)
- [Usage Analytics](#usage-analytics)
- [Scopes Reference](#scopes-reference)
- [Rate Limit Tiers](#rate-limit-tiers)
- [Security Best Practices](#security-best-practices)
- [Common Use Cases](#common-use-cases)

## Quick Start

```typescript
import Scaffald from '@scaffald/sdk'

// Initialize client with your API key
const client = new Scaffald({
  apiKey: 'sk_live_your_api_key_here'
})

// Create a new API key for a third-party integration
const newKey = await client.apiKeys.create({
  name: 'Production Integration',
  scopes: ['read:jobs', 'read:applications'],
  environment: 'live',
  rate_limit_tier: 'pro',
  expires_at: '2026-12-31T23:59:59Z'
})

// ⚠️ CRITICAL: Save this key immediately!
console.log('API Key:', newKey.data.key)
console.log('Warning:', newKey.warning)

// The full key will NEVER be shown again
// Store it in your environment variables or secrets manager
```

## Creating API Keys

### Basic Creation

```typescript
const key = await client.apiKeys.create({
  name: 'My Integration',
  scopes: ['read:jobs']
})

// Response includes the full key (only time it's visible)
console.log('Key ID:', key.data.id)
console.log('Full Key:', key.data.key)
console.log('Prefix:', key.data.key_prefix)
```

### With All Options

```typescript
const key = await client.apiKeys.create({
  // Required fields
  name: 'Production API Key',
  scopes: [
    'read:jobs',
    'write:jobs',
    'read:applications',
    'write:applications'
  ],

  // Optional fields
  environment: 'live',              // 'test' or 'live' (default: 'live')
  rate_limit_tier: 'pro',           // 'free', 'pro', or 'enterprise' (default: 'free')
  expires_at: '2026-12-31T23:59:59Z' // ISO 8601 date (default: null = never expires)
})
```

### Understanding the Response

```typescript
interface CreatedAPIKeyResponse {
  data: {
    id: string                      // Unique key ID
    organization_id: string         // Your organization ID
    name: string                    // Key name
    key: string                     // ⚠️ FULL KEY - SAVE THIS NOW!
    key_prefix: string              // First 16 chars (sk_live_abc...)
    scopes: string[]                // Granted permissions
    rate_limit_tier: 'free' | 'pro' | 'enterprise'
    is_active: boolean              // Always true for new keys
    last_used_at: string | null     // Always null for new keys
    created_at: string              // ISO 8601 timestamp
    expires_at: string | null       // ISO 8601 timestamp or null
  }
  warning?: string                  // "This key will only be shown once"
}
```

### Test vs Live Keys

```typescript
// Test key (for development)
const testKey = await client.apiKeys.create({
  name: 'Development Key',
  scopes: ['read:jobs'],
  environment: 'test'  // Generates sk_test_...
})

// Live key (for production)
const liveKey = await client.apiKeys.create({
  name: 'Production Key',
  scopes: ['read:jobs'],
  environment: 'live'  // Generates sk_live_...
})
```

## Listing API Keys

### List All Keys

```typescript
const response = await client.apiKeys.list()

response.data.forEach(key => {
  console.log(`${key.name} (${key.key_prefix}...)`)
  console.log(`  Scopes: ${key.scopes.join(', ')}`)
  console.log(`  Status: ${key.is_active ? 'Active' : 'Inactive'}`)
  console.log(`  Created: ${new Date(key.created_at).toLocaleDateString()}`)
  console.log(`  Last used: ${key.last_used_at || 'Never'}`)
})
```

### With Pagination

```typescript
// Get first 10 keys
const page1 = await client.apiKeys.list({ limit: 10, offset: 0 })

// Get next 10 keys
const page2 = await client.apiKeys.list({ limit: 10, offset: 10 })
```

### Filter Active Keys

```typescript
const allKeys = await client.apiKeys.list()
const activeKeys = allKeys.data.filter(key => key.is_active)
const expiredKeys = allKeys.data.filter(key =>
  key.expires_at && new Date(key.expires_at) < new Date()
)
```

## Retrieving a Key

Retrieve metadata for a specific API key (does NOT return the full key).

```typescript
const key = await client.apiKeys.retrieve('key_abc123')

console.log('Name:', key.data.name)
console.log('Scopes:', key.data.scopes)
console.log('Tier:', key.data.rate_limit_tier)
console.log('Active:', key.data.is_active)

// Note: key.data.key is NOT included in retrieve response
// Full keys are only shown during creation
```

## Updating Keys

### Update Name

```typescript
await client.apiKeys.update('key_abc123', {
  name: 'Updated Integration Name'
})
```

### Update Scopes

```typescript
// Add write permissions to a read-only key
await client.apiKeys.update('key_abc123', {
  scopes: ['read:jobs', 'write:jobs', 'read:applications', 'write:applications']
})
```

### Deactivate a Key

```typescript
// Temporarily disable a key without revoking it
await client.apiKeys.update('key_abc123', {
  is_active: false
})

// Re-activate it later
await client.apiKeys.update('key_abc123', {
  is_active: true
})
```

### Update Multiple Fields

```typescript
await client.apiKeys.update('key_abc123', {
  name: 'Updated Name',
  scopes: ['read:jobs', 'write:jobs'],
  is_active: true
})
```

## Revoking Keys

Permanently revoke an API key (soft delete - cannot be undone).

```typescript
const response = await client.apiKeys.revoke('key_abc123')

console.log(response.data.message)
// "API key 'Production Key' has been revoked"

// Attempting to use a revoked key will result in 401 Unauthorized
```

**Important Notes:**
- Revoked keys **cannot be re-activated**
- Revocation is **permanent** (you must create a new key)
- The key will immediately stop working for all API calls
- Revoked keys are not deleted from the database (audit trail)

## Usage Analytics

Get detailed usage statistics for an API key.

### Basic Usage

```typescript
// Get last 30 days of usage
const usage = await client.apiKeys.getUsage('key_abc123', 30)

console.log(`Total requests: ${usage.data.total_requests}`)
console.log(`Success requests: ${usage.data.success_requests}`)
console.log(`Error requests: ${usage.data.error_requests}`)
console.log(`Error rate: ${usage.data.error_rate}%`)
console.log(`Avg response time: ${usage.data.avg_response_time_ms}ms`)
```

### Different Time Ranges

```typescript
// Last 7 days
const weekly = await client.apiKeys.getUsage('key_abc123', 7)

// Last 60 days
const twoMonths = await client.apiKeys.getUsage('key_abc123', 60)

// Last 90 days (maximum)
const quarterly = await client.apiKeys.getUsage('key_abc123', 90)
```

### Detailed Request Log

```typescript
const usage = await client.apiKeys.getUsage('key_abc123', 30)

// Iterate through individual requests
usage.data.usage.forEach(request => {
  console.log(`${request.method} ${request.endpoint}`)
  console.log(`  Status: ${request.status_code}`)
  console.log(`  Response time: ${request.response_time_ms}ms`)
  console.log(`  Timestamp: ${new Date(request.timestamp).toLocaleString()}`)
})
```

### Calculate Metrics

```typescript
const usage = await client.apiKeys.getUsage('key_abc123', 30)

// Average requests per day
const avgPerDay = usage.data.total_requests / usage.data.period_days

// Success rate
const successRate = (usage.data.success_requests / usage.data.total_requests) * 100

// Group by endpoint
const byEndpoint = usage.data.usage.reduce((acc, req) => {
  const key = `${req.method} ${req.endpoint}`
  acc[key] = (acc[key] || 0) + 1
  return acc
}, {} as Record<string, number>)

console.log('Requests by endpoint:', byEndpoint)
```

## Scopes Reference

### Read Scopes

| Scope | Description | Access |
|-------|-------------|--------|
| `read:jobs` | View published job listings | GET /jobs, GET /jobs/:id |
| `read:applications` | View job applications | GET /applications/:id |
| `read:profiles` | Access user profiles | GET /profiles/user/:username |
| `read:organizations` | View organization data | GET /profiles/organization/:slug |

### Write Scopes

| Scope | Description | Access |
|-------|-------------|--------|
| `write:jobs` | Create and manage jobs | POST /jobs, PATCH /jobs/:id |
| `write:applications` | Submit applications | POST /applications |
| `write:profiles` | Update user profiles | PATCH /profiles/user |
| `write:organizations` | Manage organization | PATCH /organizations/:id |

### Scope Dependencies

Some scopes require other scopes:
- `write:jobs` requires `read:jobs`
- `write:applications` requires `read:applications`
- `write:profiles` requires `read:profiles`
- `write:organizations` requires `read:organizations`

The SDK and API will automatically enforce these dependencies.

## Rate Limit Tiers

### Free Tier
- **Limit**: 100 requests per 15 minutes
- **Best for**: Development, testing, small integrations
- **Cost**: Free

### Pro Tier
- **Limit**: 1,000 requests per 15 minutes
- **Best for**: Production integrations, medium traffic
- **Cost**: Contact sales

### Enterprise Tier
- **Limit**: 10,000 requests per 15 minutes
- **Best for**: High-volume integrations, large organizations
- **Cost**: Contact sales

### Monitoring Rate Limits

```typescript
// Check current rate limit status
const info = client.getRateLimitInfo()

if (info) {
  console.log(`${info.remaining}/${info.limit} requests remaining`)
  console.log(`Resets at: ${new Date(info.reset * 1000)}`)
}

// Subscribe to rate limit updates
client.onRateLimitUpdate((info) => {
  if (info.remaining < 10) {
    console.warn('Rate limit approaching!')
  }
})
```

## Security Best Practices

### 1. Never Expose Keys Client-Side

❌ **DON'T:**
```typescript
// Never hardcode keys in frontend code
const client = new Scaffald({
  apiKey: 'sk_live_abc123...'  // ❌ Exposed in browser!
})
```

✅ **DO:**
```typescript
// Use environment variables on server-side
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY
})
```

### 2. Use Test Keys for Development

```typescript
// Development
const devClient = new Scaffald({
  apiKey: process.env.SCAFFALD_TEST_KEY  // sk_test_...
})

// Production
const prodClient = new Scaffald({
  apiKey: process.env.SCAFFALD_LIVE_KEY  // sk_live_...
})
```

### 3. Rotate Keys Regularly

```typescript
async function rotateApiKey() {
  // 1. Create new key
  const newKey = await client.apiKeys.create({
    name: 'Production Key (2025)',
    scopes: ['read:jobs', 'write:applications'],
    environment: 'live',
    rate_limit_tier: 'pro'
  })

  // 2. Update environment variable
  process.env.SCAFFALD_API_KEY = newKey.data.key

  // 3. Wait for new key to be fully deployed
  await sleep(60000) // 1 minute

  // 4. Revoke old key
  await client.apiKeys.revoke(oldKeyId)
}
```

### 4. Use Minimal Scopes

```typescript
// ❌ DON'T: Grant all permissions
const key = await client.apiKeys.create({
  name: 'Integration',
  scopes: [
    'read:jobs', 'write:jobs',
    'read:applications', 'write:applications',
    'read:profiles', 'write:profiles',
    'read:organizations', 'write:organizations'
  ]
})

// ✅ DO: Only grant what's needed
const key = await client.apiKeys.create({
  name: 'Job Listings Integration',
  scopes: ['read:jobs']  // Only needs to read jobs
})
```

### 5. Set Expiration Dates

```typescript
// For temporary integrations
const tempKey = await client.apiKeys.create({
  name: 'Conference Demo',
  scopes: ['read:jobs'],
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  // Expires in 7 days
})
```

### 6. Monitor Usage

```typescript
// Set up daily monitoring
async function checkKeyUsage() {
  const keys = await client.apiKeys.list()

  for (const key of keys.data) {
    if (!key.is_active) continue

    const usage = await client.apiKeys.getUsage(key.id, 1) // Last 24h

    // Alert on suspicious activity
    if (usage.data.error_rate > 10) {
      console.error(`High error rate for ${key.name}: ${usage.data.error_rate}%`)
    }

    if (usage.data.total_requests > 1000) {
      console.warn(`Unusual traffic for ${key.name}: ${usage.data.total_requests} requests`)
    }
  }
}

// Run daily
setInterval(checkKeyUsage, 24 * 60 * 60 * 1000)
```

## Common Use Cases

### Use Case 1: Job Board Integration

```typescript
// Create a read-only key for displaying jobs
const jobBoardKey = await client.apiKeys.create({
  name: 'Job Board Widget',
  scopes: ['read:jobs'],
  environment: 'live',
  rate_limit_tier: 'pro'
})

// Use the key
const jobBoardClient = new Scaffald({
  apiKey: jobBoardKey.data.key
})

const jobs = await jobBoardClient.jobs.list({ limit: 50 })
```

### Use Case 2: Application Submission Integration

```typescript
// Create key that can read jobs and submit applications
const atsKey = await client.apiKeys.create({
  name: 'ATS Integration',
  scopes: ['read:jobs', 'write:applications'],
  environment: 'live',
  rate_limit_tier: 'enterprise'
})
```

### Use Case 3: Analytics Dashboard

```typescript
// Create key for reading organization data
const analyticsKey = await client.apiKeys.create({
  name: 'Analytics Dashboard',
  scopes: ['read:jobs', 'read:applications', 'read:organizations'],
  environment: 'live',
  rate_limit_tier: 'pro'
})
```

### Use Case 4: Temporary Partner Access

```typescript
// Create time-limited key for a partner
const partnerKey = await client.apiKeys.create({
  name: 'Partner XYZ - Q1 2025',
  scopes: ['read:jobs'],
  environment: 'live',
  expires_at: '2025-03-31T23:59:59Z'
})

// Send key securely to partner
// Key automatically becomes invalid after expiration
```

### Use Case 5: Multi-Environment Setup

```typescript
// Development environment
const devKey = await client.apiKeys.create({
  name: 'Development',
  scopes: ['read:jobs', 'write:applications'],
  environment: 'test',
  rate_limit_tier: 'free'
})

// Staging environment
const stagingKey = await client.apiKeys.create({
  name: 'Staging',
  scopes: ['read:jobs', 'write:applications'],
  environment: 'test',
  rate_limit_tier: 'pro'
})

// Production environment
const prodKey = await client.apiKeys.create({
  name: 'Production',
  scopes: ['read:jobs', 'write:applications'],
  environment: 'live',
  rate_limit_tier: 'enterprise'
})
```

## Error Handling

```typescript
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError
} from '@scaffald/sdk'

try {
  const key = await client.apiKeys.create({
    name: 'Test Key',
    scopes: ['invalid:scope']
  })
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid parameters:', error.errors)
  } else if (error instanceof AuthenticationError) {
    console.error('Invalid API key')
  } else if (error instanceof AuthorizationError) {
    console.error('Insufficient permissions')
  } else if (error instanceof NotFoundError) {
    console.error('Key not found')
  }
}
```

## TypeScript Support

All API key methods are fully typed:

```typescript
import type {
  APIKey,
  CreatedAPIKey,
  APIKeyScope,
  APIKeyEnvironment,
  RateLimitTier,
  APIKeyListResponse,
  APIKeyResponse,
  CreatedAPIKeyResponse,
  APIKeyUsageResponse
} from '@scaffald/sdk'

// Type-safe scope array
const scopes: APIKeyScope[] = ['read:jobs', 'write:jobs']

// Type-safe environment
const env: APIKeyEnvironment = 'live'

// Type-safe tier
const tier: RateLimitTier = 'pro'
```

## Next Steps

- [Getting Started Guide](./getting-started.md)
- [API Reference](./api-reference.md)
- [OAuth 2.0 Guide](./oauth.md)
- [Webhook Guide](./webhooks.md)
- [React Hooks Guide](./react-hooks.md)

## Support

- 📖 [Full Documentation](https://docs.scaffald.com)
- 💬 [Discord Community](https://discord.gg/scaffald)
- 🐛 [Report Issues](https://github.com/scaffald/scaffald-sdk/issues)
- 📧 [Email Support](mailto:support@scaffald.com)
