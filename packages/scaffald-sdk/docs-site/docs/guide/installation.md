# Getting Started with Scaffald SDK

This guide will walk you through setting up and using the Scaffald SDK in your application.

## Table of Contents

- [Installation](#installation)
- [Authentication](#authentication)
- [Making Your First Request](#making-your-first-request)
- [Error Handling](#error-handling)
- [Next Steps](#next-steps)

## Installation

Install the SDK using your preferred package manager:

```bash
npm install @scaffald/sdk
# or
pnpm add @scaffald/sdk
# or
yarn add @scaffald/sdk
```

### Requirements

- **Node.js**: 18 or higher
- **Browser**: Modern browsers with ES2020+ support
- **React Native**: 0.74 or higher (optional, for mobile apps)
- **React**: 18 or higher (optional, for React hooks)

## Authentication

The Scaffald SDK supports two authentication methods:

### 1. API Keys (Server-Side)

**Best for**: Server-side applications, background jobs, CI/CD pipelines

```typescript
import Scaffald from '@scaffald/sdk'

const client = new Scaffald({
  apiKey: 'sk_live_...' // Get from https://app.scaffald.com/api-keys
})
```

**Getting an API Key:**

1. Log in to [Scaffald Dashboard](https://app.scaffald.com)
2. Navigate to **Settings > API Keys**
3. Click **Create API Key**
4. Name your key and select permissions
5. Copy the key (shown only once!)

**Security Best Practices:**

- Never commit API keys to version control
- Store keys in environment variables
- Use different keys for development and production
- Rotate keys regularly
- Use minimal permissions (principle of least privilege)

```bash
# .env file
SCAFFALD_API_KEY=sk_live_your_key_here
```

```typescript
// Load from environment
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY
})
```

### 2. OAuth 2.0 (User-Facing Apps)

**Best for**: Web apps, mobile apps, applications that act on behalf of users

```typescript
import { OAuthClient } from '@scaffald/sdk'

const oauth = new OAuthClient()

// Step 1: Get authorization URL
const { url, codeVerifier } = await oauth.getAuthorizationUrl({
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback',
  scope: ['read:jobs', 'write:applications']
})

// Step 2: Redirect user to authorize
window.location.href = url

// Step 3: Exchange code for access token (in callback)
const tokens = await oauth.exchangeCode({
  code: urlParams.get('code'),
  codeVerifier,
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback'
})

// Step 4: Create authenticated client
const client = new Scaffald({
  accessToken: tokens.access_token
})
```

See the [OAuth Guide](./oauth.md) for a complete implementation guide.

## Making Your First Request

Let's start by fetching some jobs:

```typescript
import Scaffald from '@scaffald/sdk'

// Initialize client
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY
})

// Fetch published jobs
async function getJobs() {
  try {
    const response = await client.jobs.list({
      status: 'published',
      limit: 10,
      remoteOption: 'remote'
    })

    console.log(`Found ${response.pagination.total} total jobs`)
    console.log(`Showing ${response.data.length} jobs`)

    // Display job titles
    response.data.forEach(job => {
      console.log(`- ${job.title} at ${job.organization_name}`)
      console.log(`  Location: ${job.location || 'Remote'}`)
      console.log(`  Type: ${job.employment_type}`)
      console.log(`  Posted: ${new Date(job.created_at).toLocaleDateString()}`)
      console.log()
    })

    return response
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    throw error
  }
}

// Run it
getJobs()
```

### Understanding the Response

All list endpoints return data in this format:

```typescript
{
  data: [
    {
      id: 'job_abc123',
      title: 'Senior Software Engineer',
      organization_name: 'Acme Corp',
      location: 'San Francisco, CA',
      employment_type: 'full_time',
      remote_option: 'hybrid',
      // ... more fields
    }
  ],
  pagination: {
    total: 145,
    limit: 10,
    offset: 0,
    has_more: true
  }
}
```

## Submitting an Application

Once you find a job, you can submit an application:

```typescript
async function applyToJob(jobId: string) {
  try {
    const application = await client.applications.createQuick({
      jobId,
      currentLocation: 'San Francisco, CA',
      availableStartDate: '2025-03-01'
    })

    console.log('Application submitted successfully!')
    console.log(`Application ID: ${application.data.id}`)
    console.log(`Status: ${application.data.status}`)

    return application
  } catch (error) {
    console.error('Failed to submit application:', error)
    throw error
  }
}
```

### Full Application Example

For a more complete application, use `createFull()`:

```typescript
async function applyWithFullDetails(jobId: string) {
  const application = await client.applications.createFull({
    jobId,
    currentLocation: 'San Francisco, CA',
    availableStartDate: '2025-03-01',
    coverLetter: 'I am excited to apply for this position...',
    resumeUrl: 'https://example.com/resume.pdf',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    portfolioUrl: 'https://johndoe.com',
    yearsExperience: 5,
    salaryExpectationMinCents: 12000000, // $120,000
    salaryExpectationMaxCents: 15000000, // $150,000
    willingToRelocate: true,
    requiresSponsorship: false
  })

  return application
}
```

## Error Handling

Always wrap API calls in try-catch blocks:

```typescript
import {
  ScaffaldError,
  RateLimitError,
  AuthenticationError,
  NotFoundError,
  ValidationError
} from '@scaffald/sdk'

async function safeApiCall() {
  try {
    const jobs = await client.jobs.list()
    return jobs
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error(`Rate limited. Retry after ${error.retryAfter} seconds`)
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000))
      return client.jobs.list() // Retry
    }

    if (error instanceof AuthenticationError) {
      console.error('Invalid API key. Check your credentials.')
      // Redirect to login or refresh token
    }

    if (error instanceof NotFoundError) {
      console.error('Resource not found')
      // Show 404 page
    }

    if (error instanceof ValidationError) {
      console.error('Validation failed:', error.errors)
      // Show validation errors to user
    }

    if (error instanceof ScaffaldError) {
      console.error(`API error ${error.statusCode}: ${error.message}`)
      // Generic error handler
    }

    throw error // Re-throw if not handled
  }
}
```

See the [Error Handling Guide](./error-handling.md) for more details.

## Rate Limiting

The SDK automatically tracks rate limits. You can monitor them:

```typescript
// Check current rate limit status
const info = client.getRateLimitInfo()
console.log(`${info.remaining}/${info.limit} requests remaining`)

// Get notified when rate limit updates
const unsubscribe = client.onRateLimitUpdate((info) => {
  if (info.remaining < 10) {
    console.warn('Rate limit approaching!')
  }
})

// Check if close to limit (< 20% remaining)
if (client.isRateLimitApproaching()) {
  console.warn('Slow down!')
}
```

**Rate Limits by Tier:**

| Tier       | Limit            |
|------------|------------------|
| Free       | 100 req/15 min   |
| Pro        | 1000 req/15 min  |
| Enterprise | 10000 req/15 min |

## Next Steps

Now that you've made your first requests, explore:

1. **[API Reference](./api-reference.md)** - Complete API documentation
2. **[React Hooks](./react-hooks.md)** - Using the SDK with React
3. **[Webhooks](./webhooks.md)** - Receiving real-time events
4. **[OAuth Guide](./oauth.md)** - User authentication flow
5. **[Examples](../examples/)** - Working code examples

## Common Patterns

### Pagination

```typescript
async function getAllJobs() {
  let offset = 0
  const limit = 100
  const allJobs = []

  while (true) {
    const response = await client.jobs.list({ limit, offset })
    allJobs.push(...response.data)

    if (!response.pagination.has_more) {
      break
    }

    offset += limit
  }

  return allJobs
}
```

### Filtering Jobs

```typescript
// Remote jobs only
const remoteJobs = await client.jobs.list({
  remoteOption: 'remote',
  status: 'published'
})

// Full-time positions in San Francisco
const sfFullTime = await client.jobs.list({
  location: 'San Francisco',
  employmentType: 'full_time',
  status: 'published'
})

// Jobs at specific organization
const orgJobs = await client.jobs.list({
  organizationId: 'org_abc123',
  status: 'published'
})
```

### Handling Stale Data

```typescript
// Fetch fresh job data before applying
async function applyWithFreshData(jobId: string) {
  // Get latest job details
  const job = await client.jobs.retrieve(jobId)

  // Check if job is still accepting applications
  if (job.data.status !== 'published') {
    throw new Error('This job is no longer accepting applications')
  }

  // Submit application
  return client.applications.createQuick({
    jobId: job.data.id,
    currentLocation: 'San Francisco, CA'
  })
}
```

## Configuration Options

```typescript
const client = new Scaffald({
  // Required: One of these
  apiKey: 'sk_live_...',      // Server-side
  accessToken: 'oauth_token',  // Client-side

  // Optional
  baseUrl: 'https://api.scaffald.com', // Custom API URL
  maxRetries: 3,              // Retry attempts (0-10)
  timeout: 60000,             // Request timeout (ms)
  headers: {                  // Additional headers
    'X-Custom-Header': 'value'
  }
})
```

## TypeScript Support

The SDK is fully typed. Enable strict mode for best results:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": false
  }
}
```

Get full autocomplete and type checking:

```typescript
// Autocomplete for all parameters
const jobs = await client.jobs.list({
  // IDE will suggest: status, limit, offset, etc.
})

// Type-safe responses
jobs.data.forEach(job => {
  // job.title - string
  // job.created_at - string (ISO 8601)
  // job.employment_type - 'full_time' | 'part_time' | etc.
})
```

## Debugging

Enable debug logging:

```typescript
// Set in your environment
process.env.DEBUG = 'scaffald:*'
```

Or use your own logger:

```typescript
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY,
  onRequest: (config) => {
    console.log('Request:', config.method, config.url)
  },
  onResponse: (response) => {
    console.log('Response:', response.status, response.statusText)
  }
})
```

## Need Help?

- 📖 [Full Documentation](https://docs.scaffald.com/sdk)
- 💬 [Discord Community](https://discord.gg/scaffald)
- 🐛 [Report Issues](https://github.com/scaffald/scaffald-sdk/issues)
- 📧 [Email Support](mailto:support@scaffald.com)
