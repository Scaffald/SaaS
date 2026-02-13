# API Reference

Complete reference for the Scaffald SDK - explore documentation by resource type.

## Quick Navigation

Browse the API documentation organized by resource:

<div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', margin: '2rem 0'}}>

<div style={{padding: '1.5rem', borderRadius: '12px', border: '2px solid rgba(251, 97, 42, 0.15)', background: 'rgba(251, 97, 42, 0.03)'}}>

### 🔧 [Client Configuration](/docs/api/client)

Configure the SDK client with API keys, OAuth tokens, retry settings, and custom headers.

**Topics:**
- Authentication methods
- Base URL configuration
- Retry and timeout settings
- Custom HTTP headers

[View Documentation →](/docs/api/client)

</div>

<div style={{padding: '1.5rem', borderRadius: '12px', border: '2px solid rgba(251, 97, 42, 0.15)', background: 'rgba(251, 97, 42, 0.03)'}}>

### 💼 [Jobs API](/docs/api/jobs)

Search, retrieve, and filter job listings with advanced querying capabilities.

**Methods:**
- `list()` - Search and filter jobs
- `retrieve()` - Get job details
- `similar()` - Find similar jobs
- `filterOptions()` - Get filter values

[View Documentation →](/docs/api/jobs)

</div>

<div style={{padding: '1.5rem', borderRadius: '12px', border: '2px solid rgba(251, 97, 42, 0.15)', background: 'rgba(251, 97, 42, 0.03)'}}>

### 📝 [Applications API](/docs/api/applications)

Submit quick or full applications and manage application lifecycle.

**Methods:**
- `create()` / `createQuick()` - Quick apply
- `createFull()` - Full application
- `retrieve()` - Get application status
- `update()` - Update application
- `withdraw()` - Withdraw application

[View Documentation →](/docs/api/applications)

</div>

<div style={{padding: '1.5rem', borderRadius: '12px', border: '2px solid rgba(251, 97, 42, 0.15)', background: 'rgba(251, 97, 42, 0.03)'}}>

### 👤 [Profiles API](/docs/api/profiles)

Retrieve public user, organization, and employer profiles.

**Methods:**
- `user()` - Get user profile
- `organization()` - Get organization
- `employer()` - Get employer profile

**Rate Limit:** 100 requests / 15 min

[View Documentation →](/docs/api/profiles)

</div>

<div style={{padding: '1.5rem', borderRadius: '12px', border: '2px solid rgba(251, 97, 42, 0.15)', background: 'rgba(251, 97, 42, 0.03)'}}>

### 🔐 [OAuth API](/docs/api/oauth)

Implement OAuth 2.0 with PKCE for secure user authentication.

**Methods:**
- `getAuthorizationUrl()` - Start OAuth
- `exchangeCode()` - Get access token
- `refreshToken()` - Refresh tokens

**Flow:** Authorization Code + PKCE

[View Documentation →](/docs/api/oauth)

</div>

<div style={{padding: '1.5rem', borderRadius: '12px', border: '2px solid rgba(251, 97, 42, 0.15)', background: 'rgba(251, 97, 42, 0.03)'}}>

### ⏱️ [Rate Limiting](/docs/api/rate-limiting)

Monitor and manage API rate limits to ensure optimal usage.

**Methods:**
- `getRateLimitInfo()` - Check status
- `isRateLimitApproaching()` - Monitor
- `getSecondsUntilReset()` - Time to reset
- `onRateLimitUpdate()` - Subscribe

[View Documentation →](/docs/api/rate-limiting)

</div>

<div style={{padding: '1.5rem', borderRadius: '12px', border: '2px solid rgba(251, 97, 42, 0.15)', background: 'rgba(251, 97, 42, 0.03)'}}>

### 📘 [Type Definitions](/docs/api/types)

Complete TypeScript type reference for all SDK interfaces and types.

**Types:**
- Job, Application, Profile
- Request/Response interfaces
- OAuth types
- Error types

[View Documentation →](/docs/api/types)

</div>

</div>

## Getting Started

### 1. Install the SDK

```bash
npm install @scaffald/sdk
```

### 2. Initialize Client

```typescript
import Scaffald from '@scaffald/sdk'

// Server-side (API key)
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY
})

// Client-side (OAuth)
const client = new Scaffald({
  accessToken: userAccessToken
})
```

### 3. Make Your First Request

```typescript
// Search for jobs
const jobs = await client.jobs.list({
  employmentType: 'full_time',
  remoteOption: 'remote',
  limit: 20
})

// Submit a quick application
const application = await client.applications.create({
  jobId: jobs.data[0].id,
  currentLocation: 'San Francisco, CA'
})
```

## Common Use Cases

### Search and Filter Jobs

```typescript
// Get remote full-time jobs in tech
const jobs = await client.jobs.list({
  status: 'published',
  employmentType: 'full_time',
  remoteOption: 'remote',
  limit: 50
})

console.log(`Found ${jobs.pagination.total} jobs`)
```

[Full Jobs API Documentation →](/docs/api/jobs)

---

### Submit an Application

```typescript
// Quick application
const app = await client.applications.create({
  jobId: 'job_abc123',
  currentLocation: 'San Francisco, CA',
  availableStartDate: '2025-03-01'
})

// Full application with details
const fullApp = await client.applications.createFull({
  jobId: 'job_abc123',
  currentLocation: 'San Francisco, CA',
  coverLetter: 'I am excited...',
  resumeUrl: 'https://example.com/resume.pdf',
  yearsExperience: 5
})
```

[Full Applications API Documentation →](/docs/api/applications)

---

### Implement OAuth

```typescript
// Step 1: Get authorization URL
const { url, codeVerifier, state } = await client.oauth.getAuthorizationUrl({
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback',
  scope: ['read:jobs', 'write:applications']
})

// Store and redirect
sessionStorage.setItem('pkce_verifier', codeVerifier)
window.location.href = url

// Step 2: Exchange code for token (in callback)
const tokens = await client.oauth.exchangeCode({
  code,
  codeVerifier: sessionStorage.getItem('pkce_verifier'),
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback'
})
```

[Full OAuth API Documentation →](/docs/api/oauth)

---

### Monitor Rate Limits

```typescript
// Subscribe to rate limit updates
client.onRateLimitUpdate((info) => {
  console.log(`${info.remaining}/${info.limit} requests remaining`)

  if (client.isRateLimitApproaching(0.1)) {
    console.warn('Less than 10% remaining - slow down!')
  }
})

// Make requests
await client.jobs.list()
```

[Full Rate Limiting Documentation →](/docs/api/rate-limiting)

---

## API Resources

| Resource | Endpoint | Description |
|----------|----------|-------------|
| [Client](/docs/api/client) | - | SDK configuration and initialization |
| [Jobs](/docs/api/jobs) | `/api/v1/jobs` | Search and retrieve job listings |
| [Applications](/docs/api/applications) | `/api/v1/applications` | Submit and manage applications |
| [Profiles](/docs/api/profiles) | `/api/v1/profiles` | User and organization profiles |
| [OAuth](/docs/api/oauth) | `/oauth` | OAuth 2.0 authentication |
| [Types](/docs/api/types) | - | TypeScript type definitions |

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Standard endpoints | 1000 requests / hour |
| Profile endpoints | 100 requests / 15 min |
| OAuth endpoints | 20 requests / min |

[Learn more about rate limiting →](/docs/api/rate-limiting)

## Authentication

The SDK supports two authentication methods:

**API Key (Server-side)**
```typescript
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY
})
```

**OAuth Token (Client-side)**
```typescript
const client = new Scaffald({
  accessToken: userAccessToken
})
```

[View OAuth API documentation →](/docs/api/oauth)

## Error Handling

The SDK throws typed errors for easy handling:

```typescript
import { APIError } from '@scaffald/sdk'

try {
  const jobs = await client.jobs.list()
} catch (error) {
  if (error instanceof APIError) {
    if (error.status === 429) {
      console.log('Rate limited')
    } else if (error.status === 401) {
      console.log('Unauthorized')
    }
  }
}
```

[View rate limiting documentation →](/docs/api/rate-limiting)

## TypeScript Support

The SDK is written in TypeScript with full type definitions:

```typescript
import type {
  Job,
  Application,
  JobsListParams,
  JobsListResponse
} from '@scaffald/sdk'

const params: JobsListParams = {
  employmentType: 'full_time',
  limit: 20
}

const response: JobsListResponse = await client.jobs.list(params)
const jobs: Job[] = response.data
```

[View all type definitions →](/docs/api/types)

## Next Steps

- 📖 [Getting Started Guide](/docs/intro) - Complete SDK tutorial
- 🔐 [OAuth API](/docs/api/oauth) - OAuth 2.0 authentication setup
- 📘 [Type Definitions](/docs/api/types) - TypeScript type reference
- ⏱️ [Rate Limiting](/docs/api/rate-limiting) - Manage API limits

## Need Help?

- 💬 [GitHub Discussions](https://github.com/Scaffald/sdk/discussions) - Ask questions
- 🐛 [Report Issues](https://github.com/Scaffald/sdk/issues) - Bug reports
- 📚 [View on GitHub](https://github.com/Scaffald/sdk) - Source code
- 📦 [npm Package](https://www.npmjs.com/package/@scaffald/sdk) - Package page
