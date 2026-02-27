# Applications API

Submit and manage job applications.

## Methods

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

## Application Type

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

## Next Steps

- [Jobs API](/docs/api/jobs) - Find jobs to apply for
- [Type Definitions](/docs/api/types) - Complete type reference
- [API Overview](/docs/api/overview) - Browse all API resources
