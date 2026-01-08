# Authentication API

Authentication endpoints for magic link login/signup, session management, and user role retrieval.

---

## Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [Request Magic Link](#post-v1authmagic-link)
  - [Get User Roles](#get-v1authroles)
  - [Get Session Info](#get-v1authsession)
- [Usage Examples](#usage-examples)
  - [SDK Examples](#sdk-examples)
  - [React Hooks Examples](#react-hooks-examples)
  - [Direct HTTP Examples](#direct-http-examples)
- [Error Codes](#error-codes)
- [Migration from tRPC](#migration-from-trpc)

---

## Overview

The Authentication API provides three core endpoints:

1. **Magic Link Authentication** - Send passwordless login/signup emails
2. **User Roles** - Retrieve the authenticated user's assigned roles
3. **Session Info** - Get current session details and token information

All endpoints except magic link require authentication via access token.

---

## Endpoints

### POST /v1/auth/magic-link

Request a magic link for passwordless authentication. This endpoint is **public** and does not require authentication.

**Request Body**:
```json
{
  "email": "user@example.com",
  "redirectTo": "https://app.example.com/auth/callback"  // Optional
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email address (normalized to lowercase and trimmed) |
| `redirectTo` | string | No | URL to redirect after authentication (must be valid URL) |

**Response** (200 OK):
```json
{
  "data": {
    "mode": "login",  // or "signup" for new users
    "email": "user@example.com",
    "redirectTo": "https://app.example.com/auth/callback"
  },
  "message": "Magic link sent to user@example.com"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `data.mode` | `"login"` \| `"signup"` | Whether this is for an existing user (login) or new user (signup) |
| `data.email` | string | Normalized email address |
| `data.redirectTo` | string | The redirect URL that will be used |
| `message` | string | Success message |

**Error Responses**:

- `400` - Validation Error
  ```json
  {
    "error": "Validation Error",
    "message": "Invalid request data",
    "details": [
      {
        "path": ["email"],
        "message": "Invalid email address"
      }
    ]
  }
  ```

- `500` - Configuration Error
  ```json
  {
    "error": "Configuration Error",
    "message": "Magic link redirect target is not configured"
  }
  ```

- `500` - Internal Server Error
  ```json
  {
    "error": "Internal Server Error",
    "message": "Failed to send magic link email",
    "details": "..."
  }
  ```

---

### GET /v1/auth/roles

Get the current authenticated user's assigned roles.

**Authentication**: Required (access token or API key)

**Request**: No parameters required

**Response** (200 OK):
```json
{
  "data": {
    "roles": ["admin", "moderator", "user"],
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `data.roles` | string[] | Array of role names assigned to the user |
| `data.userId` | string | UUID of the authenticated user |

**Error Responses**:

- `401` - Unauthorized
  ```json
  {
    "error": "Unauthorized",
    "message": "Authentication required"
  }
  ```

- `500` - Internal Server Error
  ```json
  {
    "error": "Internal Server Error",
    "message": "Unable to load user roles",
    "details": "..."
  }
  ```

---

### GET /v1/auth/session

Get information about the current session.

**Authentication**: Required (access token)

**Request**: No parameters required

**Response** (200 OK):
```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "emailVerified": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "v1.MR5S6Q...",
      "expiresAt": 1735689600,
      "expiresIn": 3600
    }
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `data.user.id` | string | User UUID |
| `data.user.email` | string | User email address |
| `data.user.emailVerified` | boolean | Whether email has been verified |
| `data.user.createdAt` | string | ISO 8601 timestamp of user creation |
| `data.session.accessToken` | string | JWT access token |
| `data.session.refreshToken` | string | Refresh token for obtaining new access tokens |
| `data.session.expiresAt` | number | Unix timestamp when session expires |
| `data.session.expiresIn` | number | Seconds until session expires |

**Error Responses**:

- `401` - Unauthorized
  ```json
  {
    "error": "Unauthorized",
    "message": "No active session"
  }
  ```

- `401` - Invalid/Expired Session
  ```json
  {
    "error": "Unauthorized",
    "message": "Invalid or expired session"
  }
  ```

---

## Usage Examples

### SDK Examples

#### Request Magic Link (Public)

```typescript
import { Scaffald } from '@scaffald/sdk'

// Create client without authentication (for public endpoints)
const client = new Scaffald({
  apiKey: 'sk_test_...',  // or use accessToken for authenticated requests
  baseUrl: 'https://api.scaffald.com'
})

// Request magic link
const response = await client.auth.requestMagicLink({
  email: 'user@example.com',
  redirectTo: 'https://app.example.com/auth/callback'
})

if (response.data.mode === 'signup') {
  console.log('New user signup - check your email!')
} else {
  console.log('Welcome back - check your email!')
}
```

#### Get User Roles (Authenticated)

```typescript
import { Scaffald } from '@scaffald/sdk'

const client = new Scaffald({
  accessToken: 'user_access_token_here',
  baseUrl: 'https://api.scaffald.com'
})

const { data } = await client.auth.getRoles()

console.log(`User ID: ${data.userId}`)
console.log(`Roles: ${data.roles.join(', ')}`)

// Check for specific role
if (data.roles.includes('admin')) {
  console.log('User is an admin!')
}
```

#### Get Session Information (Authenticated)

```typescript
import { Scaffald } from '@scaffald/sdk'

const client = new Scaffald({
  accessToken: 'user_access_token_here',
  baseUrl: 'https://api.scaffald.com'
})

const { data } = await client.auth.getSession()

console.log(`Email: ${data.user.email}`)
console.log(`Email Verified: ${data.user.emailVerified}`)
console.log(`Session expires in ${data.session.expiresIn} seconds`)

// Check if session is expiring soon
const expiresInMinutes = Math.floor(data.session.expiresIn / 60)
if (expiresInMinutes < 5) {
  console.log('Session expiring soon - consider refreshing')
  // Use data.session.refreshToken to get new access token
}
```

---

### React Hooks Examples

#### Magic Link Form

```tsx
import { useMagicLink } from '@scaffald/sdk/react'
import { useState } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const requestMagicLink = useMagicLink()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    requestMagicLink.mutate({
      email,
      redirectTo: window.location.origin + '/auth/callback'
    }, {
      onSuccess: (data) => {
        if (data.data.mode === 'signup') {
          alert('New account - check your email to complete signup!')
        } else {
          alert('Welcome back - check your email to login!')
        }
        setEmail('')
      },
      onError: (error) => {
        alert(`Error: ${error.message}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />
      <button type="submit" disabled={requestMagicLink.isPending}>
        {requestMagicLink.isPending ? 'Sending...' : 'Send Magic Link'}
      </button>
      {requestMagicLink.error && (
        <p className="error">{requestMagicLink.error.message}</p>
      )}
    </form>
  )
}
```

#### User Permissions Check

```tsx
import { useRoles } from '@scaffald/sdk/react'

function AdminPanel() {
  const { data, isLoading, error } = useRoles()

  if (isLoading) return <div>Loading permissions...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return <div>Not authenticated</div>

  const isAdmin = data.data.roles.includes('admin')
  const isModerator = data.data.roles.includes('moderator')

  if (!isAdmin && !isModerator) {
    return <div>Access denied - admin or moderator required</div>
  }

  return (
    <div>
      <h2>Admin Panel</h2>
      <p>Your roles: {data.data.roles.join(', ')}</p>
      {isAdmin && <AdminControls />}
      {isModerator && <ModeratorTools />}
    </div>
  )
}
```

#### Session Status Display

```tsx
import { useSession } from '@scaffald/sdk/react'
import { useEffect, useState } from 'react'

function SessionStatus() {
  const { data, isLoading, error } = useSession()
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    if (data?.data.session.expiresIn) {
      setTimeRemaining(data.data.session.expiresIn)
      const timer = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [data])

  if (isLoading) return <div>Loading session...</div>
  if (error) return <div>Not authenticated</div>
  if (!data) return null

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const isExpiringSoon = minutes < 5

  return (
    <div className={isExpiringSoon ? 'warning' : ''}>
      <p>Logged in as: {data.data.user.email}</p>
      <p>Email verified: {data.data.user.emailVerified ? '✓' : '✗'}</p>
      <p>
        Session expires in: {minutes}:{seconds.toString().padStart(2, '0')}
      </p>
      {isExpiringSoon && (
        <button onClick={() => {/* refresh session */}}>
          Refresh Session
        </button>
      )}
    </div>
  )
}
```

---

### Direct HTTP Examples

#### Request Magic Link

```bash
curl -X POST https://api.scaffald.com/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "redirectTo": "https://app.example.com/auth/callback"
  }'
```

#### Get User Roles

```bash
curl -X GET https://api.scaffald.com/v1/auth/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get Session Info

```bash
curl -X GET https://api.scaffald.com/v1/auth/session \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Validation Error | Invalid request data (bad email format, invalid URL, missing required fields) |
| 401 | Unauthorized | Missing or invalid authentication token |
| 500 | Configuration Error | Server configuration issue (missing redirect URL config) |
| 500 | Internal Server Error | Database error, email sending failure, or other unexpected errors |

---

## Migration from tRPC

### Migrated Endpoints

| tRPC Procedure | REST Endpoint | Changes |
|----------------|---------------|---------|
| `auth.requestMagicLink` | `POST /v1/auth/magic-link` | - Returns `mode` field (login/signup)<br>- Email normalization (lowercase, trimmed)<br>- Better error messages |
| `auth.getUserRoles` | `GET /v1/auth/roles` | - Renamed to simpler endpoint<br>- Filters out null role names<br>- Returns userId in response |
| N/A (new) | `GET /v1/auth/session` | - New endpoint for session management<br>- Returns user + session details<br>- Useful for token refresh flows |

### Breaking Changes

None - these are new REST endpoints that maintain compatibility with existing tRPC implementations.

### Migration Guide

**Before (tRPC)**:
```typescript
import { api } from '@/utils/api'

// Request magic link
const { mutate } = api.auth.requestMagicLink.useMutation()
mutate({
  email: 'user@example.com',
  redirectTo: 'https://app.example.com/callback'
})

// Get roles
const { data } = api.auth.getUserRoles.useQuery()
console.log(data) // ['admin', 'user']
```

**After (REST via SDK)**:
```typescript
import { Scaffald } from '@scaffald/sdk'
import { useMagicLink, useRoles } from '@scaffald/sdk/react'

// Request magic link
const requestMagicLink = useMagicLink()
requestMagicLink.mutate({
  email: 'user@example.com',
  redirectTo: 'https://app.example.com/callback'
})

// Get roles
const { data } = useRoles()
console.log(data.data.roles) // ['admin', 'user']
console.log(data.data.userId) // 'uuid-here'
```

**Key Differences**:
1. Response structure: tRPC returns data directly, REST wraps in `{ data: {...} }`
2. getRoles now includes `userId` in response
3. requestMagicLink returns `mode` field ('login' or 'signup')
4. New `getSession` endpoint available for session management

---

## Related Documentation

- [Migration Tracking](/packages/scaffald-sdk/docs/MIGRATION-TRACKING.md)
- [REST API Design Principles](/packages/scaffald-sdk/docs/migration/adr/001-rest-api-design-principles.md)
- [Testing Guide](/packages/supabase/functions/api/__tests__/README.md)
- [SDK Client Documentation](/packages/scaffald-sdk/README.md)

---

**Last Updated**: 2025-12-31
**API Version**: v1
**Status**: ✅ Complete
