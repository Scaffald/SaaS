# Type Definitions

Complete TypeScript type reference for the Scaffald SDK.

## Core Types

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

---

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

---

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

---

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

---

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

## Request/Response Types

### JobsListParams

```typescript
interface JobsListParams {
  status?: 'published' | 'draft' | 'archived'
  limit?: number  // 1-100, default: 20
  offset?: number // default: 0
  organizationId?: string
  location?: string
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'temp' | 'intern'
  remoteOption?: 'on_site' | 'hybrid' | 'remote'
}
```

---

### JobsListResponse

```typescript
interface JobsListResponse {
  data: Job[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}
```

---

### ApplicationCreateParams

```typescript
interface ApplicationCreateParams {
  jobId: string
  currentLocation: string
  availableStartDate?: string
}
```

---

### ApplicationCreateFullParams

```typescript
interface ApplicationCreateFullParams extends ApplicationCreateParams {
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
}
```

---

## OAuth Types

### OAuthAuthorizationUrlParams

```typescript
interface OAuthAuthorizationUrlParams {
  clientId: string
  redirectUri: string
  scope: string[]
  state?: string
}
```

---

### OAuthAuthorizationUrlResponse

```typescript
interface OAuthAuthorizationUrlResponse {
  url: string
  codeVerifier: string
  state: string
}
```

---

### OAuthExchangeCodeParams

```typescript
interface OAuthExchangeCodeParams {
  code: string
  codeVerifier: string
  clientId: string
  clientSecret?: string
  redirectUri: string
}
```

---

### OAuthTokenResponse

```typescript
interface OAuthTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: 'Bearer'
}
```

---

## Rate Limiting Types

### RateLimitInfo

```typescript
interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  resetAt: Date
}
```

---

## Error Types

### APIError

```typescript
class APIError extends Error {
  status: number
  type: string
  message: string
  details?: Record<string, unknown>
  headers?: Record<string, string>
}
```

---

### ValidationError

```typescript
interface ValidationError {
  field: string
  message: string
  code: string
}
```

---

## Utility Types

### PaginationParams

```typescript
interface PaginationParams {
  limit?: number
  offset?: number
}
```

---

### PaginationMeta

```typescript
interface PaginationMeta {
  total: number
  limit: number
  offset: number
  has_more: boolean
}
```

---

### UserCertification

```typescript
interface UserCertification {
  name: string
  issuer: string
  issue_date: string
  expiration_date: string | null
  credential_id: string | null
  credential_url: string | null
}
```

---

## Type Imports

Import types from the SDK:

```typescript
import type {
  Job,
  Application,
  PublicProfile,
  OrganizationProfile,
  EmployerProfile,
  JobsListParams,
  JobsListResponse,
  ApplicationCreateParams,
  ApplicationCreateFullParams,
  OAuthTokenResponse,
  RateLimitInfo,
  APIError
} from '@scaffald/sdk'
```

## Next Steps

- [Jobs API](/docs/api/jobs) - Use Job types
- [Applications API](/docs/api/applications) - Use Application types
- [Profiles API](/docs/api/profiles) - Use Profile types
- [OAuth API](/docs/api/oauth) - Use OAuth types
