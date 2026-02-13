# React Hooks Guide

The Scaffald SDK provides React hooks powered by React Query for seamless integration with React applications.

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Jobs Hooks](#jobs-hooks)
- [Applications Hooks](#applications-hooks)
- [Profiles Hooks](#profiles-hooks)
- [Advanced Patterns](#advanced-patterns)
- [TypeScript](#typescript)
- [Troubleshooting](#troubleshooting)

## Installation

```bash
npm install @scaffald/sdk @tanstack/react-query
# or
pnpm add @scaffald/sdk @tanstack/react-query
# or
yarn add @scaffald/sdk @tanstack/react-query
```

**Peer Dependencies:**
- `react` ^18.0.0
- `@tanstack/react-query` ^5.0.0

## Setup

### 1. Wrap your app with `ScaffaldProvider`

```tsx
import { ScaffaldProvider } from '@scaffald/sdk/react'

function App() {
  return (
    <ScaffaldProvider config={{ apiKey: process.env.REACT_APP_SCAFFALD_API_KEY }}>
      <YourApp />
    </ScaffaldProvider>
  )
}
```

**Provider Configuration:**

```typescript
<ScaffaldProvider
  config={{
    // Required: One of these
    apiKey?: string
    accessToken?: string

    // Optional
    baseUrl?: string
    maxRetries?: number
    timeout?: number
  }}
>
```

### 2. Use hooks in your components

```tsx
import { useJobs } from '@scaffald/sdk/react'

function JobsList() {
  const { data, isLoading, error } = useJobs({ limit: 20 })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.data.map(job => (
        <div key={job.id}>{job.title}</div>
      ))}
    </div>
  )
}
```

## Jobs Hooks

### `useJobs(params?)`

List and filter jobs.

```tsx
import { useJobs } from '@scaffald/sdk/react'

function JobsList() {
  const { data, isLoading, error, refetch } = useJobs({
    status: 'published',
    limit: 20,
    remoteOption: 'remote'
  })

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>

      {isLoading && <div>Loading jobs...</div>}

      {error && <div>Error: {error.message}</div>}

      {data && (
        <div>
          <p>Found {data.pagination.total} jobs</p>
          {data.data.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Parameters:** See [Jobs API Reference](./api-reference.md#jobs)

**Returns:**

```typescript
{
  data: JobListResponse | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
  // ... other React Query properties
}
```

**Cache Configuration:**
- `staleTime`: 5 minutes
- `gcTime`: 30 minutes

---

### `useJob(id)`

Get a single job by ID.

```tsx
import { useJob } from '@scaffald/sdk/react'

function JobDetail({ jobId }: { jobId: string }) {
  const { data, isLoading, error } = useJob(jobId)

  if (isLoading) return <div>Loading job...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return <div>Job not found</div>

  const job = data.data

  return (
    <div>
      <h1>{job.title}</h1>
      <p>{job.organization_name}</p>
      <p>{job.location || 'Remote'}</p>
      <p>{job.employment_type}</p>
      <div dangerouslySetInnerHTML={{ __html: job.description }} />
    </div>
  )
}
```

**Returns:**

```typescript
{
  data: JobResponse | undefined
  isLoading: boolean
  error: Error | null
  // ...
}
```

**Cache Configuration:**
- `staleTime`: 5 minutes
- `gcTime`: 30 minutes
- `enabled`: Only runs if ID is provided

---

### `useSimilarJobs(id, params?)`

Get jobs similar to a given job.

```tsx
import { useSimilarJobs } from '@scaffald/sdk/react'

function SimilarJobs({ jobId }: { jobId: string }) {
  const { data, isLoading } = useSimilarJobs(jobId, { limit: 5 })

  if (isLoading) return <div>Loading similar jobs...</div>

  return (
    <div>
      <h3>Similar Jobs</h3>
      {data?.data.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  )
}
```

**Parameters:**

```typescript
useSimilarJobs(
  id: string,
  params?: {
    limit?: number
    offset?: number
  }
)
```

**Cache Configuration:**
- `staleTime`: 10 minutes
- `gcTime`: 30 minutes

---

### `useJobFilterOptions()`

Get available filter values for job search.

```tsx
import { useJobFilterOptions } from '@scaffald/sdk/react'

function JobFilters({ onFilter }: { onFilter: (filters: any) => void }) {
  const { data } = useJobFilterOptions()

  if (!data) return null

  return (
    <div>
      <select onChange={(e) => onFilter({ employmentType: e.target.value })}>
        <option value="">All Employment Types</option>
        {data.data.employmentTypes.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      <select onChange={(e) => onFilter({ remoteOption: e.target.value })}>
        <option value="">All Remote Options</option>
        {data.data.remoteOptions.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  )
}
```

**Cache Configuration:**
- `staleTime`: 1 hour
- `gcTime`: 24 hours

---

## Applications Hooks

### `useApplications()`

List user's applications (requires authentication).

```tsx
import { useApplications } from '@scaffald/sdk/react'

function MyApplications() {
  const { data, isLoading } = useApplications()

  if (isLoading) return <div>Loading applications...</div>

  return (
    <div>
      <h2>My Applications</h2>
      {data?.data.map(app => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  )
}
```

**Cache Configuration:**
- `staleTime`: 1 minute
- `gcTime`: 10 minutes

---

### `useCreateQuickApplication()`

Submit a quick application (mutation).

```tsx
import { useCreateQuickApplication } from '@scaffald/sdk/react'

function QuickApplyButton({ jobId }: { jobId: string }) {
  const createApp = useCreateQuickApplication()

  const handleApply = () => {
    createApp.mutate({
      jobId,
      currentLocation: 'San Francisco, CA',
      availableStartDate: '2025-03-01'
    })
  }

  return (
    <button
      onClick={handleApply}
      disabled={createApp.isPending}
    >
      {createApp.isPending ? 'Applying...' : 'Quick Apply'}
    </button>
  )
}
```

**With Success Handling:**

```tsx
function QuickApplyButton({ jobId }: { jobId: string }) {
  const createApp = useCreateQuickApplication()

  const handleApply = () => {
    createApp.mutate(
      {
        jobId,
        currentLocation: 'San Francisco, CA'
      },
      {
        onSuccess: (data) => {
          alert(`Application ${data.data.id} submitted successfully!`)
        },
        onError: (error) => {
          alert(`Error: ${error.message}`)
        }
      }
    )
  }

  return <button onClick={handleApply}>Apply</button>
}
```

**Returns:**

```typescript
{
  mutate: (input, options?) => void
  mutateAsync: (input) => Promise<ApplicationResponse>
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null
  data: ApplicationResponse | undefined
  reset: () => void
}
```

---

### `useCreateFullApplication()`

Submit a full application (mutation).

```tsx
import { useCreateFullApplication } from '@scaffald/sdk/react'
import { useForm } from 'react-hook-form'

function ApplicationForm({ jobId }: { jobId: string }) {
  const createApp = useCreateFullApplication()
  const { register, handleSubmit } = useForm()

  const onSubmit = (formData) => {
    createApp.mutate({
      jobId,
      currentLocation: formData.location,
      availableStartDate: formData.startDate,
      coverLetter: formData.coverLetter,
      resumeUrl: formData.resumeUrl,
      yearsExperience: parseInt(formData.yearsExperience),
      salaryExpectationMinCents: parseInt(formData.salaryMin) * 100,
      salaryExpectationMaxCents: parseInt(formData.salaryMax) * 100,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('location')} placeholder="Current Location" required />
      <input {...register('startDate')} type="date" />
      <textarea {...register('coverLetter')} placeholder="Cover Letter" />
      <input {...register('resumeUrl')} placeholder="Resume URL" />
      <input {...register('yearsExperience')} type="number" />
      <input {...register('salaryMin')} type="number" placeholder="Min Salary" />
      <input {...register('salaryMax')} type="number" placeholder="Max Salary" />

      <button type="submit" disabled={createApp.isPending}>
        {createApp.isPending ? 'Submitting...' : 'Submit Application'}
      </button>

      {createApp.isError && (
        <div className="error">{createApp.error.message}</div>
      )}
    </form>
  )
}
```

---

### `useApplication(id)`

Get application by ID.

```tsx
import { useApplication } from '@scaffald/sdk/react'

function ApplicationStatus({ applicationId }: { applicationId: string }) {
  const { data, isLoading } = useApplication(applicationId)

  if (isLoading) return <div>Loading...</div>
  if (!data) return null

  const app = data.data

  return (
    <div>
      <h3>Application Status: {app.status}</h3>
      <p>Applied: {new Date(app.created_at).toLocaleDateString()}</p>
      {app.withdrawal_reason && (
        <p>Withdrawal Reason: {app.withdrawal_reason}</p>
      )}
    </div>
  )
}
```

---

### `useUpdateApplication(id)`

Update an application (mutation).

```tsx
import { useUpdateApplication } from '@scaffald/sdk/react'

function EditApplication({ applicationId }: { applicationId: string }) {
  const updateApp = useUpdateApplication(applicationId)

  const handleUpdate = () => {
    updateApp.mutate({
      coverLetter: 'Updated cover letter...',
      resumeUrl: 'https://example.com/new-resume.pdf'
    })
  }

  return (
    <button onClick={handleUpdate} disabled={updateApp.isPending}>
      {updateApp.isPending ? 'Updating...' : 'Update Application'}
    </button>
  )
}
```

---

### `useWithdrawApplication(id)`

Withdraw an application (mutation).

```tsx
import { useWithdrawApplication } from '@scaffald/sdk/react'

function WithdrawButton({ applicationId }: { applicationId: string }) {
  const withdrawApp = useWithdrawApplication(applicationId)

  const handleWithdraw = () => {
    if (!confirm('Are you sure you want to withdraw this application?')) {
      return
    }

    withdrawApp.mutate(
      { reason: 'Found another opportunity' },
      {
        onSuccess: () => {
          alert('Application withdrawn successfully')
        }
      }
    )
  }

  return (
    <button onClick={handleWithdraw} disabled={withdrawApp.isPending}>
      {withdrawApp.isPending ? 'Withdrawing...' : 'Withdraw Application'}
    </button>
  )
}
```

---

## Profiles Hooks

### `useUserProfile(username)`

Get user profile by username.

```tsx
import { useUserProfile } from '@scaffald/sdk/react'

function UserProfile({ username }: { username: string }) {
  const { data, isLoading } = useUserProfile(username)

  if (isLoading) return <div>Loading profile...</div>
  if (!data) return <div>Profile not found</div>

  const profile = data.data

  return (
    <div>
      <img src={profile.avatar_url} alt={profile.full_name} />
      <h1>{profile.full_name}</h1>
      <p>{profile.bio}</p>

      <h3>Skills</h3>
      <ul>
        {profile.skills.map(skill => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>

      <h3>Certifications</h3>
      {profile.certifications.map(cert => (
        <div key={cert.name}>
          <p>{cert.name} - {cert.issuer}</p>
        </div>
      ))}
    </div>
  )
}
```

**Cache Configuration:**
- `staleTime`: 10 minutes
- `gcTime`: 1 hour

---

### `useOrganization(slug)`

Get organization profile.

```tsx
import { useOrganization } from '@scaffald/sdk/react'

function OrganizationPage({ slug }: { slug: string }) {
  const { data } = useOrganization(slug)

  if (!data) return null

  const org = data.data

  return (
    <div>
      <img src={org.logo_url} alt={org.name} />
      <h1>{org.name}</h1>
      <p>{org.description}</p>
      <p>{org.job_count} open positions</p>
      <p>Industry: {org.industry}</p>
      <p>Size: {org.size}</p>
      <p>Founded: {org.founded_year}</p>
    </div>
  )
}
```

---

### `useEmployer(slug)`

Get employer profile.

```tsx
import { useEmployer } from '@scaffald/sdk/react'

function EmployerPage({ slug }: { slug: string }) {
  const { data } = useEmployer(slug)

  if (!data) return null

  const employer = data.data

  return (
    <div>
      <h1>{employer.name}</h1>
      <p>{employer.description}</p>
      <p>{employer.active_jobs_count} active jobs</p>
    </div>
  )
}
```

---

## Advanced Patterns

### Pagination

```tsx
function JobsList() {
  const [offset, setOffset] = useState(0)
  const limit = 20

  const { data, isLoading } = useJobs({ limit, offset })

  const handleNext = () => {
    if (data?.pagination.has_more) {
      setOffset(offset + limit)
    }
  }

  const handlePrev = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit))
    }
  }

  return (
    <div>
      {data?.data.map(job => <JobCard key={job.id} job={job} />)}

      <button onClick={handlePrev} disabled={offset === 0}>
        Previous
      </button>
      <button onClick={handleNext} disabled={!data?.pagination.has_more}>
        Next
      </button>
    </div>
  )
}
```

### Infinite Scroll

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { useScaffald } from '@scaffald/sdk/react'

function InfiniteJobsList() {
  const client = useScaffald()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['jobs', 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      client.jobs.list({ limit: 20, offset: pageParam }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.has_more) return undefined
      return lastPage.pagination.offset + lastPage.pagination.limit
    }
  })

  return (
    <div>
      {data?.pages.map(page =>
        page.data.map(job => <JobCard key={job.id} job={job} />)
      )}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

### Optimistic Updates

```tsx
import { useQueryClient } from '@tanstack/react-query'

function QuickApplyWithOptimistic({ jobId }: { jobId: string }) {
  const queryClient = useQueryClient()
  const createApp = useCreateQuickApplication()

  const handleApply = () => {
    createApp.mutate(
      { jobId, currentLocation: 'SF' },
      {
        onMutate: async (newApp) => {
          // Cancel outgoing queries
          await queryClient.cancelQueries({ queryKey: ['applications'] })

          // Snapshot previous value
          const previousApps = queryClient.getQueryData(['applications'])

          // Optimistically update
          queryClient.setQueryData(['applications'], (old: any) => ({
            data: [
              { id: 'temp-' + Date.now(), ...newApp, status: 'pending' },
              ...old.data
            ]
          }))

          return { previousApps }
        },
        onError: (err, newApp, context) => {
          // Rollback on error
          queryClient.setQueryData(['applications'], context?.previousApps)
        },
        onSettled: () => {
          // Refetch to sync
          queryClient.invalidateQueries({ queryKey: ['applications'] })
        }
      }
    )
  }

  return <button onClick={handleApply}>Apply</button>
}
```

### Dependent Queries

```tsx
function JobWithSimilar({ jobId }: { jobId: string }) {
  // First query: Get job details
  const { data: jobData } = useJob(jobId)

  // Second query: Only runs when jobData is available
  const { data: similarData } = useSimilarJobs(jobId, { limit: 5 })

  return (
    <div>
      {jobData && <JobDetail job={jobData.data} />}
      {similarData && <SimilarJobs jobs={similarData.data} />}
    </div>
  )
}
```

### Custom Query Keys

```tsx
import { useQuery } from '@tanstack/react-query'
import { useScaffald } from '@scaffald/sdk/react'

function FilteredJobs({ filters }: { filters: any }) {
  const client = useScaffald()

  // Custom query key based on filters
  const { data } = useQuery({
    queryKey: ['jobs', 'filtered', filters],
    queryFn: () => client.jobs.list(filters),
    staleTime: 5 * 60 * 1000
  })

  return <>{/* ... */}</>
}
```

---

## TypeScript

All hooks are fully typed:

```tsx
import type { Job, Application } from '@scaffald/sdk'

function TypedComponent() {
  const { data } = useJobs()

  // data is typed as JobListResponse | undefined
  data?.data.forEach((job: Job) => {
    // job.title - string
    // job.employment_type - 'full_time' | 'part_time' | etc.
  })
}
```

### Generic Mutation Options

```tsx
import { useCreateQuickApplication } from '@scaffald/sdk/react'
import type { CreateQuickApplicationInput, ApplicationResponse } from '@scaffald/sdk'

const createApp = useCreateQuickApplication()

createApp.mutate<
  ApplicationResponse,        // TData
  Error,                      // TError
  CreateQuickApplicationInput // TVariables
>(
  { jobId: 'job_123', currentLocation: 'SF' },
  {
    onSuccess: (data) => {
      // data is ApplicationResponse
    }
  }
)
```

---

## Troubleshooting

### Hook Called Outside of Provider

```
Error: useScaffald must be used within ScaffaldProvider
```

**Solution:** Wrap your app with `<ScaffaldProvider>`:

```tsx
import { ScaffaldProvider } from '@scaffald/sdk/react'

function App() {
  return (
    <ScaffaldProvider config={{ apiKey: '...' }}>
      <YourComponents />
    </ScaffaldProvider>
  )
}
```

### Queries Not Refetching

If data seems stale, check `staleTime` configuration:

```tsx
import { useJobs } from '@scaffald/sdk/react'
import { useQuery } from '@tanstack/react-query'

// Force refetch on mount
const { data } = useJobs({ limit: 20 }, {
  staleTime: 0, // Always refetch
  refetchOnMount: true
})
```

### Rate Limit Errors

```tsx
import { RateLimitError } from '@scaffald/sdk'

function Component() {
  const { data, error } = useJobs()

  if (error instanceof RateLimitError) {
    return (
      <div>
        Rate limited. Retry after {error.retryAfter} seconds.
      </div>
    )
  }

  // ...
}
```

---

## Next Steps

- [API Reference](./api-reference.md)
- [Error Handling Guide](./error-handling.md)
- [Webhooks Guide](./webhooks.md)
- [OAuth Guide](./oauth.md)
