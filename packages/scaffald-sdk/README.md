# @scaffald/sdk

> Official JavaScript SDK for the Scaffald API

[![npm version](https://img.shields.io/npm/v/@scaffald/sdk.svg)](https://www.npmjs.com/package/@scaffald/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Documentation](https://img.shields.io/badge/docs-scaffald.github.io-blue)](https://scaffald.github.io/sdk/)

**[📚 Documentation](https://scaffald.github.io/sdk/)** | **[📦 npm Package](https://www.npmjs.com/package/@scaffald/sdk)** | **[💻 GitHub](https://github.com/Scaffald/sdk)**

A complete, type-safe JavaScript/TypeScript SDK for integrating with the Scaffald job platform API.

## Features

- ✅ **Full TypeScript Support** - Auto-generated types from OpenAPI spec
- ✅ **Automatic Retries** - Exponential backoff for failed requests (1s, 2s, 4s, 8s)
- ✅ **Rate Limit Handling** - Tracks and respects API rate limits with callbacks
- ✅ **Request/Response Interceptors** - Customize requests, responses, and error handling
- ✅ **Response Caching** - Intelligent caching with TTL and cache invalidation
- ✅ **Request Deduplication** - Prevent duplicate concurrent requests
- ✅ **API Key Management** - Programmatically create, update, revoke, and monitor API keys
- ✅ **Zero Dependencies** - Core SDK uses native Fetch API and Web Crypto
- ✅ **Universal** - Works in Node.js 18+, modern browsers, and React Native 0.74+
- ✅ **React Integration** - Hooks powered by React Query for optimal caching
- ✅ **OAuth 2.0 + PKCE** - Secure authentication flow for user-facing apps
- ✅ **Webhook Verification** - HMAC SHA-256 signature verification utilities
- ✅ **Tree-shakeable** - Only import what you need
- ✅ **Bundle Optimized** - Aggressive tree-shaking and code splitting

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

### Industries

Industry lookup and categorization for job filtering.

```typescript
// List all industries
const { data, total } = await client.industries.list()
console.log(`${total} industries available`)

data.forEach(industry => {
  console.log(`${industry.name} (${industry.slug})`)
})

// Get specific industry by slug
const industry = await client.industries.retrieve('technology')
console.log(industry?.name) // 'Technology'
console.log(industry?.description) // 'Technology and software development industry'
```

### Organizations

Manage organizations, members, documents, and settings.

```typescript
// Get organization details
const org = await client.organizations.retrieve('org_123')
console.log(`${org.name} - ${org.description}`)

// Get open jobs count
const { count } = await client.organizations.getOpenJobsCount('org_123')
console.log(`${count} open positions`)

// List organization members
const { data: members } = await client.organizations.listMembers('org_123', {
  search: 'john',
  roleNames: ['admin', 'member']
})

members.forEach(member => {
  console.log(`${member.user_profile.displayName} - ${member.role_name}`)
})

// Invite a new member
const { id, token } = await client.organizations.inviteMember('org_123', {
  email: 'newuser@example.com',
  roleName: 'member',
  message: 'Welcome to the team!'
})

// Remove a member
await client.organizations.removeMember('org_123', 'user_456', {
  reason: 'Left the company'
})

// List organization documents
const { data: docs } = await client.organizations.listDocuments('org_123', {
  category: 'policies',
  limit: 10
})

// Get a specific document
const doc = await client.organizations.getDocument('org_123', 'doc_1')

// Create document upload session
const session = await client.organizations.createDocumentUploadSession('org_123', {
  name: 'Employee Handbook',
  fileName: 'handbook.pdf',
  mimeType: 'application/pdf',
  fileSize: 2048000,
  category: 'policies'
})
// Use session.uploadUrl to upload the file

// Create download URL for a document
const { downloadUrl } = await client.organizations.createDocumentDownloadUrl('org_123', 'doc_1')

// Get organization settings
const settings = await client.organizations.getSettings('org_123')
console.log(`Timezone: ${settings.timezone}`)
console.log(`MFA enforced: ${settings.enforce_mfa}`)

// Update organization settings
await client.organizations.updateSettings('org_123', {
  timezone: 'America/Los_Angeles',
  enforceMfa: true,
  sessionTimeoutMinutes: 30
})
```

### Teams

Collaborative hiring teams for managing applications, members, and job assignments.

```typescript
// List teams for an organization
const { teams } = await client.teams.list({
  organizationId: 'org_123',
  includeArchived: false
})

teams.forEach(team => {
  console.log(`${team.name} - ${team.purpose}`)
})

// Get team details
const { team } = await client.teams.retrieve('team_123')
console.log(`${team.name} has ${team.workloadStrategy} workload strategy`)

// Create a new team
const { team: newTeam } = await client.teams.create({
  organizationId: 'org_123',
  name: 'Engineering Hiring Team',
  purpose: 'Hire software engineers',
  visibility: 'organization',
  invitationPolicy: 'invite_only',
  autoAssignJobs: true,
  workloadStrategy: 'auto_balanced'
})

// Update a team
await client.teams.update('team_123', {
  name: 'Senior Engineering Hiring',
  description: 'Focus on senior-level positions',
  allowSelfJoin: true
})

// Archive a team
await client.teams.archive('team_123', {
  reason: 'Hiring season ended'
})

// List team members
const { members } = await client.teams.listMembers('team_123')
members.forEach(member => {
  console.log(`${member.user?.displayName} - ${member.role?.name}`)
})

// Add a team member
const { member } = await client.teams.addMember('team_123', {
  userId: 'user_456',
  roleKey: 'recruiter'
})

// Update a team member's role
await client.teams.updateMember('team_123', 'user_456', {
  roleKey: 'lead',
  status: 'active'
})

// Remove a team member
await client.teams.removeMember('team_123', 'user_456', {
  reason: 'Role ended'
})

// List team invitations
const { invitations } = await client.teams.listInvitations('team_123')
const pending = invitations.filter(inv => inv.status === 'pending')

// Invite a member
const { invitation } = await client.teams.inviteMember('team_123', {
  email: 'recruiter@example.com',
  roleKey: 'recruiter',
  message: 'Join our hiring team!'
})

// Cancel an invitation
await client.teams.cancelInvitation('team_123', 'inv_456')

// List job assignments
const { assignments } = await client.teams.listJobAssignments('team_123')
assignments.forEach(assignment => {
  console.log(`${assignment.job?.title} ${assignment.isPrimary ? '(Primary)' : ''}`)
})

// Assign a job to the team
const { assignment } = await client.teams.createJobAssignment('team_123', {
  jobId: 'job_789',
  isPrimary: true
})

// Remove a job assignment
await client.teams.deleteJobAssignment('team_123', 'assignment_999')
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

### Industries Hooks
- `useIndustries()` - List all industries
- `useIndustry(slug)` - Get industry by slug

### Organizations Hooks
- `useOrganization(id)` - Get organization by ID
- `useOrganizationJobsCount(id)` - Get open jobs count
- `useOrganizationMembers(id, params?)` - List organization members
- `useInviteOrganizationMember()` - Invite member mutation
- `useOrganizationDocuments(id, params?)` - List documents
- `useCreateDocumentUpload()` - Create upload session mutation
- `useOrganizationSettings(id)` - Get organization settings
- `useUpdateOrganizationSettings()` - Update settings mutation

### Teams Hooks
- `useTeams(params?)` - List teams
- `useTeam(id)` - Get team by ID
- `useCreateTeam()` - Create team mutation
- `useUpdateTeam()` - Update team mutation
- `useArchiveTeam()` - Archive team mutation
- `useTeamMembers(teamId)` - List team members
- `useAddTeamMember()` - Add member mutation
- `useUpdateTeamMember()` - Update member mutation
- `useRemoveTeamMember()` - Remove member mutation
- `useTeamInvitations(teamId)` - List team invitations
- `useInviteTeamMember()` - Invite member mutation
- `useCancelTeamInvitation()` - Cancel invitation mutation
- `useTeamJobAssignments(teamId)` - List job assignments
- `useCreateTeamJobAssignment()` - Create assignment mutation
- `useDeleteTeamJobAssignment()` - Delete assignment mutation

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
- **OAuth standalone**: ~1.8 KB (minified + gzipped)
- **Webhooks standalone**: ~0.7 KB (minified + gzipped)
- **Zero runtime dependencies** (except React Query for React package)

Analyze bundle sizes after building:

```bash
pnpm build:analyze
```

## Advanced Features

The SDK includes powerful features for optimizing API usage and customizing behavior:

### Request/Response Interceptors

Add custom headers, log requests, or transform responses:

```typescript
const client = new Scaffald({ apiKey: 'sk_live_...' })

// Add request interceptor
client.getInterceptors().addRequestInterceptor(async (url, init) => {
  console.log('Request:', url)
  return { url, init }
})

// Add response interceptor
client.getInterceptors().addResponseInterceptor(async (response) => {
  console.log('Response:', response.status)
  return response
})
```

### Response Caching

Enable intelligent caching for GET requests:

```typescript
const client = new Scaffald({
  apiKey: 'sk_live_...',
  cache: {
    enabled: true,
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
  },
})

// First call hits the API
const jobs = await client.jobs.list()

// Second call uses cache (within TTL)
const cachedJobs = await client.jobs.list() // Instant!

// Clear cache after mutations
await client.jobs.create(/* ... */)
client.getCache().invalidate(/jobs/)
```

### Request Deduplication

Automatically prevent duplicate concurrent requests:

```typescript
// These three simultaneous calls result in only ONE HTTP request
const [job1, job2, job3] = await Promise.all([
  client.jobs.retrieve('job_123'),
  client.jobs.retrieve('job_123'),
  client.jobs.retrieve('job_123'),
])
```

### Code Splitting

Import only what you need for optimal bundle size:

```typescript
// Full SDK
import Scaffald from '@scaffald/sdk'

// OAuth only (smaller bundle)
import { OAuthClient } from '@scaffald/sdk/oauth'

// Webhooks only (smaller bundle)
import { verifyWebhookSignature } from '@scaffald/sdk/webhooks'
```

**📖 [Complete Advanced Features Guide](./docs/advanced-features.md)**

## Architecture

Scaffald uses a hybrid architecture combining REST SDK and tRPC:

- **SDK (REST API)**: User-facing data operations, public endpoints
- **tRPC**: Complex workflows, file operations, admin tools, provider integrations

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architectural decisions and guidelines.

### When to Use SDK vs tRPC

**Use SDK for:**
- User-facing CRUD operations
- Read-heavy operations
- Public API candidates
- Standard HTTP patterns

**Use tRPC for:**
- File uploads/downloads
- External provider integration (Stripe, etc.)
- Admin-only operations
- Compliance workflows

See [SDK_MIGRATION_GUIDELINES.md](./SDK_MIGRATION_GUIDELINES.md) for migration decision trees and checklists.

## Testing

The SDK has comprehensive test coverage using Vitest and MSW (Mock Service Worker).

### Running Tests

```bash
# Run all unit tests (default; uses MSW mocks)
pnpm test

# Run tests for specific resource
pnpm test teams

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Integration tests (real API and token)

Optional integration tests run against a **real** local Supabase instance and API. They verify token issuance, token validity, and per-endpoint success with a live server.

**Prerequisites:**

- Local Supabase running (`pnpm supa start` from repo root)
- API function served (e.g. `pnpm supa functions serve api` or `supabase functions serve api`)
- Test user: `test@example.com` / `test123456` (create in Supabase Studio if needed)

**Run integration tests:**

```bash
# From repo root or packages/scaffald-sdk
SCAFFALD_INTEGRATION=1 pnpm --filter @scaffald/sdk test:integration
```

If `SCAFFALD_INTEGRATION` (or `REAL_API`) is not set, integration tests are skipped. Unit tests (`pnpm test`) always use MSW and do not hit the real API.

### Test Coverage

- ✅ **93% resource coverage** (28/30 resources)
- ✅ **31 test files** including infrastructure tests
- ✅ **Comprehensive scenarios**: happy paths, edge cases, error handling
- ✅ **All error codes covered**: 401, 404, 429, 500

### Writing Tests

See existing test files in `src/__tests__/` for patterns. Each resource test should cover:

- All methods (list, get, create, update, delete)
- Happy paths with realistic data
- Edge cases (empty, null, missing)
- Validation errors (400)
- Auth errors (401)
- Not found (404)
- Rate limiting (429)
- Server errors (500)

See [SDK_MIGRATION_GUIDELINES.md#testing-patterns](./SDK_MIGRATION_GUIDELINES.md#testing-patterns) for detailed testing patterns.

## API Coverage

The SDK covers 31 resources across:

- **Core Data**: jobs, applications, profiles, user-profiles, organizations, teams
- **Profile Extensions**: skills, experience, education, certifications, portfolio, reviews, projects
- **Social**: connections, follows, engagement, profile-views
- **Supporting**: prerequisites, profile-completion, employers, onet, inquiries, notifications

See [API_COVERAGE_MATRIX.md](./API_COVERAGE_MATRIX.md) for complete coverage details.

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

# Generate types from OpenAPI spec (optional)
pnpm generate:types
```

### Type Generation

The SDK uses hand-crafted TypeScript types that are kept in sync with the API. Optionally, you can generate types from the live OpenAPI specification:

```bash
# Generate from local Supabase instance
pnpm supa start  # Start Supabase first
pnpm generate:types

# Generate from production
SUPABASE_URL=https://your-project.supabase.co pnpm generate:types

# Generate from custom URL
OPENAPI_URL=https://api.scaffald.com/openapi.json pnpm generate:types
```

See [Type Generation Guide](./docs/type-generation.md) for detailed information.

## License

MIT © Scaffald Team

## Support

- 📖 [Full Documentation](https://docs.scaffald.com/sdk)
- 💬 [Discord Community](https://discord.gg/scaffald)
- 🐛 [Report Issues](https://github.com/scaffald/scaffald-sdk/issues)
- 📧 [Email Support](mailto:support@scaffald.com)
<!-- Automated sync test Fri Feb 13 01:01:02 EST 2026 -->
