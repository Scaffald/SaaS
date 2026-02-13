# Profiles API

Retrieve public user, organization, and employer profiles.

:::info Rate Limiting
All profile endpoints are rate-limited to **100 requests per 15 minutes**.
:::

## Methods

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

## Profile Types

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

## Next Steps

- [Rate Limiting](/docs/api/rate-limiting) - Understand profile API limits
- [Type Definitions](/docs/api/types) - Complete type reference
