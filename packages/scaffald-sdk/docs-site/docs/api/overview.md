# API Reference

Complete reference for all Scaffald SDK methods and types.

## Table of Contents

- [Client Configuration](#client-configuration)
- [Jobs](#jobs)
- [Applications](#applications)
- [Profiles](#profiles)
- [OAuth](#oauth)
- [Rate Limiting](#rate-limiting)
- [Types](#types)

## Client Configuration

### `new Scaffald(config)`

Creates a new Scaffald API client.

```typescript
const client = new Scaffald({
  apiKey?: string
  accessToken?: string
  baseUrl?: string
  maxRetries?: number
  timeout?: number
  headers?: Record<string, string>
})
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `apiKey` | `string` | Yes* | - | API key for server-side authentication |
| `accessToken` | `string` | Yes* | - | OAuth access token for client-side auth |
| `baseUrl` | `string` | No | `https://api.scaffald.com` | Base API URL |
| `maxRetries` | `number` | No | `3` | Max retry attempts (0-10) |
| `timeout` | `number` | No | `30000` | Request timeout in ms (1000-300000) |
| `headers` | `object` | No | `{}` | Additional HTTP headers |

\* Either `apiKey` or `accessToken` is required

**Example:**

```typescript
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY,
  maxRetries: 5,
  timeout: 60000
})
```

---

## Jobs

### `client.jobs.list(params?)`

List and filter jobs.

```typescript
const jobs = await client.jobs.list({
  status?: 'published' | 'draft' | 'archived'
  limit?: number
  offset?: number
  organizationId?: string
  location?: string
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'temp' | 'intern'
  remoteOption?: 'on_site' | 'hybrid' | 'remote'
})
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | `string` | Filter by job status (default: `published`) |
| `limit` | `number` | Results per page (1-100, default: 20) |
| `offset` | `number` | Pagination offset (default: 0) |
| `organizationId` | `string` | Filter by organization ID |
| `location` | `string` | Filter by location (partial match) |
| `employmentType` | `string` | Filter by employment type |
| `remoteOption` | `string` | Filter by remote work option |

**Returns:**

```typescript
{
  data: Job[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}
```

**Example:**

```typescript
// Get remote full-time jobs
const jobs = await client.jobs.list({
  status: 'published',
  employmentType: 'full_time',
  remoteOption: 'remote',
  limit: 50
})

// Paginate through all jobs
let offset = 0
while (true) {
  const response = await client.jobs.list({ limit: 100, offset })
  // Process response.data
  if (!response.pagination.has_more) break
  offset += 100
}
```

---

### `client.jobs.retrieve(id)`

Get a single job by ID.

```typescript
const job = await client.jobs.retrieve(id: string)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Job ID |

**Returns:** `{ data: Job }`

**Example:**

```typescript
const job = await client.jobs.retrieve('job_abc123')
console.log(job.data.title)
console.log(job.data.description)
console.log(job.data.requirements)
```

---

### `client.jobs.similar(id, params?)`

Get jobs similar to a given job.

```typescript
const similar = await client.jobs.similar(
  id: string,
  params?: {
    limit?: number
    offset?: number
  }
)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Job ID to find similar jobs for |
| `limit` | `number` | Results per page (1-100, default: 10) |
| `offset` | `number` | Pagination offset (default: 0) |

**Returns:**

```typescript
{
  data: Job[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}
```

**Example:**

```typescript
// Get 5 similar jobs
const similar = await client.jobs.similar('job_abc123', { limit: 5 })
```

---

### `client.jobs.filterOptions()`

Get available filter values for job search.

```typescript
const options = await client.jobs.filterOptions()
```

**Returns:**

```typescript
{
  data: {
    employmentTypes: string[]
    remoteOptions: string[]
    locations: string[]
    organizations: Array<{ id: string; name: string }>
  }
}
```

**Example:**

```typescript
const options = await client.jobs.filterOptions()
console.log('Available employment types:', options.data.employmentTypes)
console.log('Available locations:', options.data.locations)
```

---

## Applications

### `client.applications.create(input)` / `client.applications.createQuick(input)`

Submit a quick job application.

```typescript
const app = await client.applications.create({
  jobId: string
  currentLocation: string
  availableStartDate?: string
})
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | `string` | Yes | Job ID to apply for |
| `currentLocation` | `string` | Yes | Current location |
| `availableStartDate` | `string` | No | Availability (ISO 8601 date) |

**Returns:** `{ data: Application }`

**Example:**

```typescript
const application = await client.applications.create({
  jobId: 'job_abc123',
  currentLocation: 'San Francisco, CA',
  availableStartDate: '2025-03-01'
})
```

---

### `client.applications.createFull(input)`

Submit a full job application with detailed information.

```typescript
const app = await client.applications.createFull({
  jobId: string
  currentLocation: string
  availableStartDate?: string
  coverLetter?: string
  resumeUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  yearsExperience?: number
  salaryExpectationMinCents?: number
  salaryExpectationMaxCents?: number
  willingToRelocate?: boolean
  requiresSponsorship?: boolean
  customResponses?: Record<string, unknown>
})
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `jobId` | `string` | **Required.** Job ID to apply for |
| `currentLocation` | `string` | **Required.** Current location |
| `availableStartDate` | `string` | Availability (ISO 8601 date) |
| `coverLetter` | `string` | Cover letter text |
| `resumeUrl` | `string` | URL to resume PDF |
| `linkedinUrl` | `string` | LinkedIn profile URL |
| `portfolioUrl` | `string` | Portfolio website URL |
| `yearsExperience` | `number` | Years of relevant experience |
| `salaryExpectationMinCents` | `number` | Minimum salary in cents (e.g., 12000000 = $120k) |
| `salaryExpectationMaxCents` | `number` | Maximum salary in cents |
| `willingToRelocate` | `boolean` | Willing to relocate |
| `requiresSponsorship` | `boolean` | Requires visa sponsorship |
| `customResponses` | `object` | Custom application questions responses |

**Returns:** `{ data: Application }`

**Example:**

```typescript
const application = await client.applications.createFull({
  jobId: 'job_abc123',
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
```

---

### `client.applications.retrieve(id)`

Get application details by ID.

```typescript
const app = await client.applications.retrieve(id: string)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Application ID |

**Returns:** `{ data: Application }`

**Example:**

```typescript
const app = await client.applications.retrieve('app_abc123')
console.log(`Status: ${app.data.status}`)
console.log(`Applied: ${new Date(app.data.created_at).toLocaleDateString()}`)
```

---

### `client.applications.update(id, input)`

Update an application (only works for `pending` or `reviewing` status).

```typescript
const app = await client.applications.update(id: string, {
  coverLetter?: string
  resumeUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  yearsExperience?: number
  salaryExpectationMinCents?: number
  salaryExpectationMaxCents?: number
  willingToRelocate?: boolean
  requiresSponsorship?: boolean
  customResponses?: Record<string, unknown>
})
```

**Parameters:** Same as `createFull` (excluding `jobId` and `currentLocation`)

**Returns:** `{ data: Application }`

**Example:**

```typescript
const updated = await client.applications.update('app_abc123', {
  coverLetter: 'Updated cover letter...',
  resumeUrl: 'https://example.com/new-resume.pdf'
})
```

---

### `client.applications.withdraw(id, input?)`

Withdraw an application.

```typescript
const app = await client.applications.withdraw(
  id: string,
  input?: { reason?: string }
)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Application ID |
| `reason` | `string` | Optional reason for withdrawal |

**Returns:** `{ data: Application }`

**Example:**

```typescript
await client.applications.withdraw('app_abc123', {
  reason: 'Accepted another offer'
})
```

---

## Profiles

All profile endpoints are rate-limited to **100 requests per 15 minutes**.

### `client.profiles.user(username)` / `client.profiles.getUser(username)`

Get public user profile by username.

```typescript
const profile = await client.profiles.user(username: string)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | `string` | Username |

**Returns:** `{ data: PublicProfile }`

**Example:**

```typescript
const profile = await client.profiles.user('johndoe')
console.log(profile.data.full_name)
console.log(profile.data.bio)
console.log(profile.data.skills)
```

---

### `client.profiles.organization(slug)` / `client.profiles.getOrganization(slug)`

Get organization profile by slug.

```typescript
const org = await client.profiles.organization(slug: string)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Organization slug |

**Returns:** `{ data: OrganizationProfile }`

**Example:**

```typescript
const org = await client.profiles.organization('acme-corp')
console.log(`${org.data.name} has ${org.data.job_count} open positions`)
```

---

### `client.profiles.employer(slug)` / `client.profiles.getEmployer(slug)`

Get employer profile by slug.

```typescript
const employer = await client.profiles.employer(slug: string)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string` | Employer slug |

**Returns:** `{ data: EmployerProfile }`

**Example:**

```typescript
const employer = await client.profiles.employer('tech-startup')
console.log(`${employer.data.active_jobs_count} active jobs`)
```

---

## OAuth

### `client.oauth.getAuthorizationUrl(options)`

Generate OAuth authorization URL with PKCE.

```typescript
const { url, codeVerifier, state } = await client.oauth.getAuthorizationUrl({
  clientId: string
  redirectUri: string
  scope: string[]
  state?: string
})
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `clientId` | `string` | OAuth client ID |
| `redirectUri` | `string` | Callback URL |
| `scope` | `string[]` | Permissions to request |
| `state` | `string` | Optional CSRF protection state |

**Returns:**

```typescript
{
  url: string          // Authorization URL to redirect to
  codeVerifier: string // PKCE code verifier (store securely!)
  state: string        // CSRF state (verify on callback)
}
```

**Example:**

```typescript
const { url, codeVerifier, state } = await client.oauth.getAuthorizationUrl({
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback',
  scope: ['read:jobs', 'write:applications']
})

sessionStorage.setItem('pkce_verifier', codeVerifier)
sessionStorage.setItem('oauth_state', state)
window.location.href = url
```

---

### `client.oauth.exchangeCode(options)`

Exchange authorization code for access token.

```typescript
const tokens = await client.oauth.exchangeCode({
  code: string
  codeVerifier: string
  clientId: string
  clientSecret?: string
  redirectUri: string
})
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | `string` | Authorization code from callback |
| `codeVerifier` | `string` | PKCE code verifier from step 1 |
| `clientId` | `string` | OAuth client ID |
| `clientSecret` | `string` | Client secret (server-side only) |
| `redirectUri` | `string` | Must match authorization redirect URI |

**Returns:**

```typescript
{
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: 'Bearer'
}
```

**Example:**

```typescript
const code = new URL(window.location.href).searchParams.get('code')
const tokens = await client.oauth.exchangeCode({
  code,
  codeVerifier: sessionStorage.getItem('pkce_verifier'),
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback'
})

localStorage.setItem('access_token', tokens.access_token)
localStorage.setItem('refresh_token', tokens.refresh_token)
```

---

### `client.oauth.refreshToken(refreshToken, clientId?)`

Refresh an expired access token.

```typescript
const tokens = await client.oauth.refreshToken(
  refreshToken: string,
  clientId?: string
)
```

**Returns:** Same as `exchangeCode`

**Example:**

```typescript
const newTokens = await client.oauth.refreshToken(
  localStorage.getItem('refresh_token')
)

localStorage.setItem('access_token', newTokens.access_token)
```

---

## Rate Limiting

### `client.getRateLimitInfo()`

Get current rate limit information.

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
const info = client.getRateLimitInfo()
console.log(`${info.remaining}/${info.limit} requests remaining`)
console.log(`Resets at: ${info.resetAt}`)
```

---

### `client.isRateLimitApproaching(threshold?)`

Check if rate limit is approaching.

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
if (client.isRateLimitApproaching()) {
  console.warn('Slow down! Less than 20% of rate limit remaining')
}

if (client.isRateLimitApproaching(0.1)) {
  console.error('Critical! Less than 10% remaining')
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
console.log(`Rate limit resets in ${seconds} seconds`)
```

---

### `client.onRateLimitUpdate(callback)`

Subscribe to rate limit updates.

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
  }
})

// Clean up when done
unsubscribe()
```

---

## Types

### Job

```typescript
interface Job {
  id: string
  title: string
  organization_id: string
  organization_name: string
  description: string
  requirements: string
  location: string | null
  employment_type: 'full_time' | 'part_time' | 'contract' | 'temp' | 'intern'
  remote_option: 'on_site' | 'hybrid' | 'remote'
  salary_min_cents: number | null
  salary_max_cents: number | null
  status: 'published' | 'draft' | 'archived'
  created_at: string
  updated_at: string
}
```

### Application

```typescript
interface Application {
  id: string
  job_id: string
  applicant_id: string
  status: 'pending' | 'reviewing' | 'inquired' | 'interviewing' | 'offered' | 'accepted' | 'rejected' | 'withdrawn'
  application_type: 'quick' | 'full'
  current_location: string
  available_start_date: string | null
  cover_letter: string | null
  resume_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  years_experience: number | null
  salary_expectation_min_cents: number | null
  salary_expectation_max_cents: number | null
  willing_to_relocate: boolean | null
  requires_sponsorship: boolean | null
  custom_responses: Record<string, unknown> | null
  withdrawal_reason: string | null
  created_at: string
  updated_at: string
}
```

### PublicProfile

```typescript
interface PublicProfile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  website: string | null
  linkedin_url: string | null
  github_url: string | null
  years_experience: number | null
  current_position: string | null
  skills: string[]
  certifications: UserCertification[]
  created_at: string
}
```

### OrganizationProfile

```typescript
interface OrganizationProfile {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  industry: string | null
  size: string | null
  location: string | null
  founded_year: number | null
  created_at: string
  job_count: number
}
```

### EmployerProfile

```typescript
interface EmployerProfile {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  industry: string | null
  location: string | null
  created_at: string
  active_jobs_count: number
}
```

---

## Next Steps

- [Getting Started Guide](./getting-started.md)
- [React Hooks Reference](./react-hooks.md)
- [Webhooks Guide](./webhooks.md)
- [OAuth Guide](./oauth.md)
- [Error Handling](./error-handling.md)
