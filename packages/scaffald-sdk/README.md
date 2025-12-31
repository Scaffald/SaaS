# @scaffald/sdk

> Official JavaScript SDK for the Scaffald API

[![npm version](https://img.shields.io/npm/v/@scaffald/sdk.svg)](https://www.npmjs.com/package/@scaffald/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A complete, type-safe JavaScript/TypeScript SDK for integrating with the Scaffald job platform API.

## Features

- ✅ **Full TypeScript Support** - Auto-generated types from OpenAPI spec
- ✅ **Automatic Retries** - Exponential backoff for failed requests (1s, 2s, 4s, 8s)
- ✅ **Rate Limit Handling** - Tracks and respects API rate limits with callbacks
- ✅ **API Key Management** - Programmatically create, update, revoke, and monitor API keys
- ✅ **Zero Dependencies** - Core SDK uses native Fetch API and Web Crypto
- ✅ **Universal** - Works in Node.js 18+, modern browsers, and React Native 0.74+
- ✅ **React Integration** - Hooks powered by React Query for optimal caching
- ✅ **OAuth 2.0 + PKCE** - Secure authentication flow for user-facing apps
- ✅ **Webhook Verification** - HMAC SHA-256 signature verification utilities
- ✅ **Tree-shakeable** - Only import what you need

## Installation

```bash
npm install @scaffald/sdk
# or
pnpm add @scaffald/sdk
# or
yarn add @scaffald/sdk
```

## Quick Start

### Server-side (Node.js) with API Key

```typescript
import Scaffald from '@scaffald/sdk'

const client = new Scaffald({
  apiKey: 'sk_live_...' // Get from https://app.scaffald.com/api-keys
})

// List jobs
const jobs = await client.jobs.list({
  status: 'published',
  limit: 20,
  location: 'San Francisco',
  remoteOption: 'remote'
})

console.log(`Found ${jobs.pagination.total} jobs`)
jobs.data.forEach(job => {
  console.log(`- ${job.title} at ${job.location}`)
})

// Submit an application
const application = await client.applications.createQuick({
  jobId: jobs.data[0].id,
  currentLocation: 'San Francisco, CA',
  availableStartDate: '2025-03-01'
})
```

### Client-side with OAuth

```typescript
import Scaffald, { OAuthClient } from '@scaffald/sdk'

// Step 1: Get authorization URL
const oauth = new OAuthClient()
const { url, codeVerifier, state } = await oauth.getAuthorizationUrl({
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback',
  scope: ['read:jobs', 'write:applications']
})

// Store for later
sessionStorage.setItem('pkce_verifier', codeVerifier)
sessionStorage.setItem('oauth_state', state)

// Redirect user
window.location.href = url

// Step 2: In your callback handler
const code = new URL(window.location.href).searchParams.get('code')
const tokens = await oauth.exchangeCode({
  code,
  codeVerifier: sessionStorage.getItem('pkce_verifier'),
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback'
})

// Step 3: Create authenticated client
const client = new Scaffald({
  accessToken: tokens.access_token
})
```

### React with Hooks

```tsx
import { ScaffaldProvider, useJobs, useCreateQuickApplication } from '@scaffald/sdk/react'

function App() {
  return (
    <ScaffaldProvider config={{ apiKey: process.env.SCAFFALD_API_KEY }}>
      <JobsList />
    </ScaffaldProvider>
  )
}

function JobsList() {
  const { data: jobs, isLoading } = useJobs({
    status: 'published',
    limit: 20,
    remoteOption: 'remote'
  })

  const createApplication = useCreateQuickApplication()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {jobs?.data.map(job => (
        <div key={job.id}>
          <h3>{job.title}</h3>
          <p>{job.location || 'Remote'}</p>
          <button onClick={() => createApplication.mutate({
            jobId: job.id,
            currentLocation: 'San Francisco, CA'
          })}>
            Quick Apply
          </button>
        </div>
      ))}
    </div>
  )
}
```

## API Reference

### Jobs

```typescript
// List jobs with filtering
const jobs = await client.jobs.list({
  status: 'published',      // Filter by status
  limit: 20,                // Results per page (max 100)
  offset: 0,                // Pagination offset
  organizationId: 'org_123', // Filter by organization
  location: 'San Francisco', // Filter by location (partial match)
  employmentType: 'full_time', // full_time | part_time | contract | temp | intern
  remoteOption: 'remote'    // on_site | hybrid | remote
})

// Get a specific job
const job = await client.jobs.retrieve('job_123')

// Get similar jobs
const similar = await client.jobs.similar('job_123', { limit: 5 })

// Get available filter options
const options = await client.jobs.filterOptions()
console.log(options.data.employmentTypes)
console.log(options.data.locations)
console.log(options.data.remoteOptions)
```

### Applications

```typescript
// Quick application
const quickApp = await client.applications.createQuick({
  jobId: 'job_123',
  currentLocation: 'San Francisco, CA',
  availableStartDate: '2025-03-01'
})

// Full application
const fullApp = await client.applications.createFull({
  jobId: 'job_123',
  currentLocation: 'San Francisco, CA',
  availableStartDate: '2025-03-01',
  coverLetter: 'I am excited to apply...',
  resumeUrl: 'https://example.com/resume.pdf',
  linkedinUrl: 'https://linkedin.com/in/johndoe',
  portfolioUrl: 'https://johndoe.com',
  yearsExperience: 5,
  salaryExpectationMinCents: 12000000, // $120,000
  salaryExpectationMaxCents: 15000000, // $150,000
  willingToRelocate: true,
  requiresSponsorship: false
})

// Get application status
const app = await client.applications.retrieve('app_123')

// Update application (only pending/reviewing status)
const updated = await client.applications.update('app_123', {
  coverLetter: 'Updated cover letter...',
  resumeUrl: 'https://example.com/new-resume.pdf'
})

// Withdraw application
await client.applications.withdraw('app_123', {
  reason: 'Accepted another offer'
})
```

### Profiles (Rate-limited: 100 req/15 min)

```typescript
// Get user profile by username
const profile = await client.profiles.getUser('johndoe')
console.log(profile.data.skills)
console.log(profile.data.certifications)

// Get organization profile
const org = await client.profiles.getOrganization('acme-corp')
console.log(`${org.data.name} has ${org.data.job_count} open jobs`)

// Get employer profile
const employer = await client.profiles.getEmployer('tech-startup')
console.log(`${employer.data.active_jobs_count} active positions`)
```

### API Keys

Programmatically manage your organization's API keys for third-party integrations and SDK access.

> ⚠️ **Security Note**: API keys are sensitive credentials. Always store them securely and never commit them to version control.

```typescript
// List all API keys
const keys = await client.apiKeys.list({ limit: 50, offset: 0 })

keys.data.forEach(key => {
  console.log(`${key.name}: ${key.key_prefix}... (${key.scopes.join(', ')})`)
  console.log(`  Status: ${key.is_active ? 'Active' : 'Inactive'}`)
  console.log(`  Last used: ${key.last_used_at || 'Never'}`)
})

// Create a new API key
const newKey = await client.apiKeys.create({
  name: 'Production Integration',
  scopes: ['read:jobs', 'read:applications'],
  environment: 'live',           // 'test' or 'live'
  rate_limit_tier: 'pro',        // 'free', 'pro', or 'enterprise'
  expires_at: '2025-12-31T23:59:59Z' // Optional expiration
})

// ⚠️ IMPORTANT: Save the full key immediately!
// This is the ONLY time you'll see the complete key
console.log('Save this key securely:', newKey.data.key)
console.log(newKey.warning) // "This key will only be shown once"

// Store in environment variable or secrets manager
// process.env.SCAFFALD_API_KEY = newKey.data.key

// Retrieve a specific API key (metadata only)
const key = await client.apiKeys.retrieve('key_abc123')
console.log(`${key.data.name} has scopes: ${key.data.scopes.join(', ')}`)

// Update API key
await client.apiKeys.update('key_abc123', {
  name: 'Production - Updated',
  scopes: ['read:jobs', 'write:jobs', 'read:applications'],
  is_active: true
})

// Get usage statistics
const usage = await client.apiKeys.getUsage('key_abc123', 30) // Last 30 days

console.log(`Total requests: ${usage.data.total_requests}`)
console.log(`Success rate: ${100 - parseFloat(usage.data.error_rate)}%`)
console.log(`Avg response time: ${usage.data.avg_response_time_ms}ms`)

// Breakdown by endpoint
usage.data.usage.forEach(req => {
  console.log(`${req.method} ${req.endpoint}: ${req.status_code} (${req.response_time_ms}ms)`)
})

// Revoke an API key (permanent soft delete)
await client.apiKeys.revoke('key_abc123')
console.log('API key has been permanently revoked')
```

**Available Scopes:**
- `read:jobs` - View published job listings
- `write:jobs` - Create and manage job postings
- `read:applications` - View job applications
- `write:applications` - Submit and manage applications
- `read:profiles` - Access user profiles
- `write:profiles` - Update user profiles
- `read:organizations` - View organization data
- `write:organizations` - Manage organization settings

**Rate Limit Tiers:**
- `free` - 100 requests per 15 minutes
- `pro` - 1,000 requests per 15 minutes
- `enterprise` - 10,000 requests per 15 minutes

**Security Best Practices:**
1. **Never expose API keys in client-side code** - Only use from server-side
2. **Use test keys for development** - `sk_test_...` keys for testing, `sk_live_...` for production
3. **Rotate keys regularly** - Create new keys and revoke old ones periodically
4. **Use minimal scopes** - Only grant permissions your integration needs
5. **Monitor usage** - Check usage statistics to detect anomalies
6. **Set expiration dates** - Use short-lived keys when possible

## Rate Limiting

The SDK automatically tracks rate limits and provides helpers:

```typescript
// Get current rate limit info
const info = client.getRateLimitInfo()
console.log(`${info.remaining}/${info.limit} requests remaining`)
console.log(`Resets at: ${new Date(info.reset * 1000)}`)

// Subscribe to rate limit updates
const unsubscribe = client.onRateLimitUpdate((info) => {
  if (info.remaining < 10) {
    console.warn('Rate limit approaching!')
  }
})

// Check if rate limit is approaching (< 20% remaining)
if (client.isRateLimitApproaching()) {
  console.warn('Slow down!')
}

// Get seconds until reset
const seconds = client.getSecondsUntilRateLimitReset()
console.log(`Rate limit resets in ${seconds} seconds`)
```

## Error Handling

```typescript
import {
  ScaffaldError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ServerError,
  NetworkError
} from '@scaffald/sdk'

try {
  const job = await client.jobs.retrieve('invalid_id')
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`)
    console.log(`Limit: ${error.limit}, Remaining: ${error.remaining}`)
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key or access token')
  } else if (error instanceof NotFoundError) {
    console.log('Job not found')
  } else if (error instanceof ValidationError) {
    console.log('Validation errors:', error.errors)
  } else if (error instanceof ServerError) {
    console.log(`Server error ${error.statusCode}: ${error.message}`)
  } else if (error instanceof NetworkError) {
    console.log('Network request failed or timed out')
  } else if (error instanceof ScaffaldError) {
    console.log(`API error: ${error.message}`)
  }
}
```

## Webhooks

Verify webhook signatures to ensure requests come from Scaffald:

```typescript
import { verifyWebhookSignature, parseWebhook } from '@scaffald/sdk'
import type { WebhookPayload } from '@scaffald/sdk'

// Express example
app.post('/webhooks/scaffald', async (req, res) => {
  const signature = req.headers['x-webhook-signature']

  // Option 1: Verify and parse in one step
  const payload = await parseWebhook(
    req.body,
    signature,
    process.env.SCAFFALD_WEBHOOK_SECRET
  )

  if (!payload) {
    return res.status(401).send('Invalid signature')
  }

  // Option 2: Verify separately
  const isValid = await verifyWebhookSignature(
    req.body,
    signature,
    process.env.SCAFFALD_WEBHOOK_SECRET
  )

  // Process webhook
  switch (payload.event) {
    case 'application.created':
      console.log('New application:', payload.data)
      break
    case 'application.updated':
      console.log('Application updated:', payload.data)
      break
    case 'application.withdrawn':
      console.log('Application withdrawn:', payload.data)
      break
  }

  res.status(200).send('OK')
})
```

## OAuth 2.0 Integration

Complete OAuth flow with PKCE for secure client-side authentication:

```typescript
import { OAuthClient, generateCodeVerifier, generateCodeChallenge } from '@scaffald/sdk'

const oauth = new OAuthClient('https://api.scaffald.com')

// Get authorization URL
const { url, codeVerifier, state } = await oauth.getAuthorizationUrl({
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback',
  scope: ['read:jobs', 'write:applications', 'read:profile']
})

// Store PKCE verifier securely
sessionStorage.setItem('pkce_verifier', codeVerifier)
sessionStorage.setItem('oauth_state', state)

// Redirect user
window.location.href = url

// In your callback handler
const code = new URL(window.location.href).searchParams.get('code')
const returnedState = new URL(window.location.href).searchParams.get('state')

// Verify state to prevent CSRF
if (returnedState !== sessionStorage.getItem('oauth_state')) {
  throw new Error('Invalid state parameter')
}

// Exchange code for tokens
const tokens = await oauth.exchangeCode({
  code,
  codeVerifier: sessionStorage.getItem('pkce_verifier'),
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback'
})

// Store tokens
localStorage.setItem('access_token', tokens.access_token)
localStorage.setItem('refresh_token', tokens.refresh_token)

// Refresh token when expired
const newTokens = await oauth.refreshToken(
  localStorage.getItem('refresh_token'),
  'your_client_id'
)

// Revoke token on logout
await oauth.revokeToken(
  localStorage.getItem('access_token'),
  'access_token',
  'your_client_id'
)
```

## React Hooks

Complete list of available hooks:

### Jobs Hooks
- `useJobs(params?)` - List jobs with filtering
- `useJob(id)` - Get single job by ID
- `useSimilarJobs(id, params?)` - Get similar jobs
- `useJobFilterOptions()` - Get available filter values

### Applications Hooks
- `useCreateQuickApplication()` - Submit quick application mutation
- `useCreateFullApplication()` - Submit full application mutation
- `useApplication(id)` - Get application by ID
- `useUpdateApplication(id)` - Update application mutation
- `useWithdrawApplication(id)` - Withdraw application mutation

### Profiles Hooks
- `useUserProfile(username)` - Get user profile
- `useOrganization(slug)` - Get organization profile
- `useEmployer(slug)` - Get employer profile

### API Keys Hooks
- `useAPIKeys(params?)` - List all API keys
- `useAPIKey(id)` - Get single API key by ID
- `useCreateAPIKey()` - Create new API key mutation
- `useUpdateAPIKey()` - Update API key mutation
- `useRevokeAPIKey()` - Revoke API key mutation
- `useAPIKeyUsage(id, days?)` - Get usage statistics

All hooks automatically handle:
- Loading states
- Error handling
- Caching with React Query
- Cache invalidation on mutations
- Optimistic updates

## Configuration

```typescript
const client = new Scaffald({
  // Required: API key or access token
  apiKey: 'sk_live_...',        // For server-side
  // OR
  accessToken: 'oauth_token',   // For client-side

  // Optional
  baseUrl: 'https://api.scaffald.com', // Custom API URL
  maxRetries: 3,                // Number of retry attempts (0-10)
  timeout: 60000,               // Request timeout in ms (1s-5min)
  headers: {                    // Additional headers
    'X-Custom-Header': 'value'
  }
})
```

## Platform Support

- **Node.js**: 18+
- **Browsers**: Modern browsers with ES2020+ support
- **React Native**: 0.74+
- **Deno**: Full support via npm specifiers

## Examples

See the [`examples/`](./examples) directory for complete working examples:

- **[Node.js](./examples/node-js)** - Server-side API usage with webhook handling
- **[Browser](./examples/browser)** - Vanilla JavaScript browser app
- **[React](./examples/react)** - React app with hooks and React Query

## Bundle Size

- **Core SDK**: ~11 KB (minified + gzipped)
- **React package**: ~12 KB (minified + gzipped)
- **Zero runtime dependencies** (except React Query for React package)

## Development

```bash
# Install dependencies
pnpm install

# Type check
pnpm typecheck

# Build
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## License

MIT © Scaffald Team

## Support

- 📖 [Full Documentation](https://docs.scaffald.com/sdk)
- 💬 [Discord Community](https://discord.gg/scaffald)
- 🐛 [Report Issues](https://github.com/scaffald/scaffald-sdk/issues)
- 📧 [Email Support](mailto:support@scaffald.com)
