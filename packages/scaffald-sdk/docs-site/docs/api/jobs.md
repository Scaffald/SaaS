# Jobs API

Search, retrieve, and filter job listings.

## Methods

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

## Job Type

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

## Next Steps

- [Applications API](/docs/api/applications) - Submit applications for jobs
- [Type Definitions](/docs/api/types) - Complete type reference
- [API Overview](/docs/api/overview) - Browse all API resources
