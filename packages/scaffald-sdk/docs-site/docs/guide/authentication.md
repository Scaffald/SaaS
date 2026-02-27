# OAuth 2.0 Guide

Complete guide to implementing OAuth 2.0 authentication with PKCE for user-facing Scaffald applications.

## Table of Contents

- [Overview](#overview)
- [When to Use OAuth](#when-to-use-oauth)
- [OAuth Flow](#oauth-flow)
- [Implementation](#implementation)
- [Token Management](#token-management)
- [Scopes and Permissions](#scopes-and-permissions)
- [Security Best Practices](#security-best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

OAuth 2.0 allows your application to act on behalf of Scaffald users without handling their passwords. The Scaffald SDK implements OAuth 2.0 with PKCE (Proof Key for Code Exchange) for maximum security.

### Key Concepts

- **Authorization Code Flow**: User authorizes your app, receives code, exchange for tokens
- **PKCE**: Prevents authorization code interception attacks (required for public clients)
- **Access Token**: Short-lived token for API requests (typically 1 hour)
- **Refresh Token**: Long-lived token to get new access tokens (typically 30 days)

## When to Use OAuth

| Use Case | Authentication Method |
|----------|----------------------|
| Server-side application | **API Key** (simpler) |
| Mobile app acting on behalf of users | **OAuth 2.0** |
| Browser extension | **OAuth 2.0** |
| Desktop application | **OAuth 2.0** |
| Third-party integration | **OAuth 2.0** |
| Internal tool with user context | **OAuth 2.0** |

**Use API Keys if:**
- Your app doesn't need user-specific permissions
- You're building a server-side tool
- You don't need to act on behalf of users

**Use OAuth if:**
- Users need to grant permission to your app
- You need user-specific data
- Your app is client-side (browser/mobile)
- You want users to revoke access easily

## OAuth Flow

```
┌─────────┐                                           ┌─────────┐
│  User   │                                           │  Your   │
│ Browser │                                           │  App    │
└────┬────┘                                           └────┬────┘
     │                                                      │
     │  1. Click "Connect Scaffald"                        │
     │ ─────────────────────────────────────────────────>  │
     │                                                      │
     │  2. Redirect to Scaffald authorization              │
     │     with code_challenge (PKCE)                      │
     │ <─────────────────────────────────────────────────  │
     │                                                      │
┌────▼────┐                                                │
│Scaffald │                                                │
│  Auth   │                                                │
└────┬────┘                                                │
     │                                                      │
     │  3. User approves                                   │
     │                                                      │
     │  4. Redirect back with authorization code           │
     │ ─────────────────────────────────────────────────>  │
     │                                                      │
     │  5. Exchange code + code_verifier for tokens        │
     │ <─────────────────────────────────────────────────  │
     │                                                      │
     │  6. Access token + Refresh token                    │
     │ ─────────────────────────────────────────────────>  │
     │                                                      │
     │  7. Make API requests with access token             │
     │ <─────────────────────────────────────────────────  │
```

## Implementation

### Step 1: Register Your Application

1. Go to [Scaffald Developer Portal](https://app.scaffald.com/developers)
2. Create a new OAuth application
3. Set your redirect URI (e.g., `https://yourapp.com/auth/callback`)
4. Save your **Client ID** and **Client Secret** (for confidential clients)

### Step 2: Install SDK

```bash
npm install @scaffald/sdk
```

### Step 3: Initiate OAuth Flow

```typescript
import { OAuthClient } from '@scaffald/sdk'

const oauth = new OAuthClient()

// Generate authorization URL
const { url, codeVerifier, state } = await oauth.getAuthorizationUrl({
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/auth/callback',
  scope: ['read:jobs', 'write:applications', 'read:profile'],
  // state: 'optional_csrf_token' // Auto-generated if not provided
})

// Store code verifier and state securely
// IMPORTANT: These must be retrieved in the callback
sessionStorage.setItem('pkce_code_verifier', codeVerifier)
sessionStorage.setItem('oauth_state', state)

// Redirect user to Scaffald
window.location.href = url
```

**Generated URL Example:**

```
https://app.scaffald.com/oauth/authorize
  ?response_type=code
  &client_id=your_client_id
  &redirect_uri=https://yourapp.com/auth/callback
  &scope=read:jobs+write:applications
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
  &state=abc123xyz789
```

### Step 4: Handle Callback

```typescript
// In your callback route (e.g., /auth/callback)

// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search)
const code = urlParams.get('code')
const state = urlParams.get('state')
const error = urlParams.get('error')

// Handle errors
if (error) {
  console.error('OAuth error:', error)
  // error = 'access_denied' | 'invalid_request' | etc.
  return
}

// Verify state to prevent CSRF attacks
const storedState = sessionStorage.getItem('oauth_state')
if (state !== storedState) {
  throw new Error('Invalid state parameter - possible CSRF attack')
}

// Retrieve code verifier
const codeVerifier = sessionStorage.getItem('pkce_code_verifier')

// Exchange code for tokens
const oauth = new OAuthClient()
const tokens = await oauth.exchangeCode({
  code,
  codeVerifier,
  clientId: 'your_client_id',
  // clientSecret: 'your_client_secret', // Only for server-side apps
  redirectUri: 'https://yourapp.com/auth/callback'
})

// Store tokens securely
localStorage.setItem('scaffald_access_token', tokens.access_token)
localStorage.setItem('scaffald_refresh_token', tokens.refresh_token)
localStorage.setItem('scaffald_token_expires_at', String(Date.now() + tokens.expires_in * 1000))

// Clean up temporary storage
sessionStorage.removeItem('pkce_code_verifier')
sessionStorage.removeItem('oauth_state')

// Redirect to app
window.location.href = '/dashboard'
```

**Token Response:**

```typescript
{
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  refresh_token: 'v1.MR5twH3Ag...',
  token_type: 'Bearer',
  expires_in: 3600  // seconds (1 hour)
}
```

### Step 5: Make Authenticated Requests

```typescript
import Scaffald from '@scaffald/sdk'

// Create authenticated client
const client = new Scaffald({
  accessToken: localStorage.getItem('scaffald_access_token')
})

// Make API requests
const jobs = await client.jobs.list({ limit: 20 })
const application = await client.applications.create({
  jobId: jobs.data[0].id,
  currentLocation: 'San Francisco, CA'
})
```

## Token Management

### Checking Token Expiration

```typescript
function isTokenExpired(): boolean {
  const expiresAt = parseInt(localStorage.getItem('scaffald_token_expires_at') || '0')
  return Date.now() >= expiresAt
}
```

### Refreshing Access Tokens

```typescript
import { OAuthClient } from '@scaffald/sdk'

async function getValidAccessToken(): Promise<string> {
  const accessToken = localStorage.getItem('scaffald_access_token')
  const refreshToken = localStorage.getItem('scaffald_refresh_token')

  if (!isTokenExpired() && accessToken) {
    return accessToken
  }

  // Token expired or missing, refresh it
  const oauth = new OAuthClient()
  const tokens = await oauth.refreshToken(refreshToken, 'your_client_id')

  // Store new tokens
  localStorage.setItem('scaffald_access_token', tokens.access_token)
  localStorage.setItem('scaffald_refresh_token', tokens.refresh_token)
  localStorage.setItem(
    'scaffald_token_expires_at',
    String(Date.now() + tokens.expires_in * 1000)
  )

  return tokens.access_token
}
```

### Automatic Token Refresh

```typescript
import Scaffald from '@scaffald/sdk'

// Custom fetch wrapper with auto-refresh
async function createAuthenticatedClient(): Promise<Scaffald> {
  const accessToken = await getValidAccessToken()

  const client = new Scaffald({
    accessToken,
    // Automatically refresh on 401
    onResponse: async (response) => {
      if (response.status === 401) {
        // Refresh token and retry
        const newToken = await getValidAccessToken()
        return fetch(response.url, {
          ...response.request,
          headers: {
            ...response.request.headers,
            Authorization: `Bearer ${newToken}`
          }
        })
      }
      return response
    }
  })

  return client
}
```

### Revoking Tokens

```typescript
import { OAuthClient } from '@scaffald/sdk'

async function logout() {
  const oauth = new OAuthClient()
  const accessToken = localStorage.getItem('scaffald_access_token')

  // Revoke access token
  await oauth.revokeToken(accessToken, 'access_token', 'your_client_id')

  // Clear local storage
  localStorage.removeItem('scaffald_access_token')
  localStorage.removeItem('scaffald_refresh_token')
  localStorage.removeItem('scaffald_token_expires_at')

  // Redirect to login
  window.location.href = '/login'
}
```

## Scopes and Permissions

Request only the permissions you need:

| Scope | Description |
|-------|-------------|
| `read:jobs` | View published jobs |
| `write:jobs` | Create and manage jobs (requires employer account) |
| `read:applications` | View user's applications |
| `write:applications` | Submit and manage applications |
| `read:profile` | View user profile information |
| `write:profile` | Update user profile |
| `read:organizations` | View organization information |
| `write:organizations` | Manage organization settings (requires admin) |

**Example:**

```typescript
const { url } = await oauth.getAuthorizationUrl({
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback',
  scope: [
    'read:jobs',           // View jobs
    'write:applications',  // Submit applications
    'read:profile'         // View user profile
  ]
})
```

## Security Best Practices

### 1. Use PKCE (Always)

PKCE prevents authorization code interception. The SDK implements this automatically.

```typescript
// ✅ Good: SDK automatically generates code_challenge
const { url, codeVerifier } = await oauth.getAuthorizationUrl({...})

// ❌ Don't: Never skip PKCE for public clients
```

### 2. Verify State Parameter

Protect against CSRF attacks:

```typescript
// ✅ Good: Verify state matches
const storedState = sessionStorage.getItem('oauth_state')
if (state !== storedState) {
  throw new Error('Invalid state')
}

// ❌ Bad: Don't skip state verification
const code = urlParams.get('code') // Missing state check!
```

### 3. Secure Token Storage

```typescript
// ✅ Good: Use httpOnly cookies (best for web)
// Set via server-side endpoint after OAuth callback
setCookie('access_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
})

// ⚠️ Acceptable: localStorage (easier but less secure)
localStorage.setItem('access_token', token)

// ❌ Bad: Don't store in query params or plain cookies
window.location.href = `/dashboard?token=${token}` // NO!
```

### 4. Use HTTPS Only

Never send tokens over HTTP:

```typescript
// ✅ Good
redirectUri: 'https://yourapp.com/callback'

// ❌ Bad
redirectUri: 'http://yourapp.com/callback'
```

### 5. Short-Lived Access Tokens

Access tokens should expire quickly (default: 1 hour). Use refresh tokens to get new ones.

### 6. Validate Redirect URI

Scaffald validates that the redirect URI matches what you registered. Never use dynamic redirect URIs:

```typescript
// ❌ Bad: Don't allow arbitrary redirects
const redirect = urlParams.get('redirect') // User controlled!
const { url } = await oauth.getAuthorizationUrl({
  redirectUri: redirect // UNSAFE!
})
```

## Examples

### React App

```tsx
import { useState, useEffect } from 'react'
import Scaffald, { OAuthClient } from '@scaffald/sdk'

function App() {
  const [client, setClient] = useState<Scaffald | null>(null)

  useEffect(() => {
    initializeAuth()
  }, [])

  async function initializeAuth() {
    const accessToken = localStorage.getItem('access_token')

    if (accessToken && !isTokenExpired()) {
      setClient(new Scaffald({ accessToken }))
    } else {
      // Handle OAuth callback
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')

      if (code) {
        await handleOAuthCallback(code)
      }
    }
  }

  async function handleOAuthCallback(code: string) {
    const oauth = new OAuthClient()
    const codeVerifier = sessionStorage.getItem('pkce_verifier')!

    const tokens = await oauth.exchangeCode({
      code,
      codeVerifier,
      clientId: process.env.REACT_APP_CLIENT_ID!,
      redirectUri: window.location.origin + '/callback'
    })

    localStorage.setItem('access_token', tokens.access_token)
    setClient(new Scaffald({ accessToken: tokens.access_token }))

    // Clean URL
    window.history.replaceState({}, '', '/')
  }

  async function login() {
    const oauth = new OAuthClient()
    const { url, codeVerifier } = await oauth.getAuthorizationUrl({
      clientId: process.env.REACT_APP_CLIENT_ID!,
      redirectUri: window.location.origin + '/callback',
      scope: ['read:jobs', 'write:applications']
    })

    sessionStorage.setItem('pkce_verifier', codeVerifier)
    window.location.href = url
  }

  if (!client) {
    return <button onClick={login}>Connect Scaffald</button>
  }

  return <Dashboard client={client} />
}
```

### Next.js App

```typescript
// pages/api/auth/scaffald.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { OAuthClient } from '@scaffald/sdk'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Initiate OAuth flow
    const oauth = new OAuthClient()
    const { url, codeVerifier, state } = await oauth.getAuthorizationUrl({
      clientId: process.env.SCAFFALD_CLIENT_ID!,
      redirectUri: process.env.SCAFFALD_REDIRECT_URI!,
      scope: ['read:jobs', 'write:applications']
    })

    // Store in session (or encrypted cookie)
    req.session.set('oauth_verifier', codeVerifier)
    req.session.set('oauth_state', state)
    await req.session.save()

    res.redirect(url)
  }
}
```

```typescript
// pages/api/auth/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { OAuthClient } from '@scaffald/sdk'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code, state } = req.query

  // Verify state
  const storedState = req.session.get('oauth_state')
  if (state !== storedState) {
    return res.status(400).send('Invalid state')
  }

  const oauth = new OAuthClient()
  const codeVerifier = req.session.get('oauth_verifier')

  const tokens = await oauth.exchangeCode({
    code: code as string,
    codeVerifier,
    clientId: process.env.SCAFFALD_CLIENT_ID!,
    clientSecret: process.env.SCAFFALD_CLIENT_SECRET!,
    redirectUri: process.env.SCAFFALD_REDIRECT_URI!
  })

  // Store tokens in httpOnly cookie
  res.setHeader('Set-Cookie', [
    `access_token=${tokens.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict`,
    `refresh_token=${tokens.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict`
  ])

  res.redirect('/dashboard')
}
```

### Mobile App (React Native)

```typescript
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { OAuthClient } from '@scaffald/sdk'
import AsyncStorage from '@react-native-async-storage/async-storage'

async function loginWithScaffald() {
  const oauth = new OAuthClient()
  const redirectUri = Linking.createURL('auth/callback')

  const { url, codeVerifier, state } = await oauth.getAuthorizationUrl({
    clientId: 'your_client_id',
    redirectUri,
    scope: ['read:jobs', 'write:applications']
  })

  // Store for callback
  await AsyncStorage.multiSet([
    ['pkce_verifier', codeVerifier],
    ['oauth_state', state]
  ])

  // Open browser
  const result = await WebBrowser.openAuthSessionAsync(url, redirectUri)

  if (result.type === 'success') {
    const { code, state } = Linking.parse(result.url).queryParams

    // Verify state
    const storedState = await AsyncStorage.getItem('oauth_state')
    if (state !== storedState) throw new Error('Invalid state')

    // Exchange code
    const verifier = await AsyncStorage.getItem('pkce_verifier')
    const tokens = await oauth.exchangeCode({
      code,
      codeVerifier: verifier,
      clientId: 'your_client_id',
      redirectUri
    })

    // Store tokens
    await AsyncStorage.setItem('access_token', tokens.access_token)
  }
}
```

## Troubleshooting

### Invalid Grant Error

**Problem:** `invalid_grant` error when exchanging code

**Solutions:**
1. Ensure code verifier matches code challenge
2. Check code hasn't expired (valid for 10 minutes)
3. Verify redirect URI exactly matches authorization request
4. Don't reuse authorization codes

### Redirect URI Mismatch

**Problem:** `redirect_uri_mismatch` error

**Solution:** Ensure redirect URI in callback matches authorization:

```typescript
// ✅ These must match exactly
// Authorization:
redirectUri: 'https://app.example.com/callback'

// Callback:
redirectUri: 'https://app.example.com/callback' // Same!
```

### State Mismatch

**Problem:** State parameter doesn't match

**Solutions:**
1. Ensure state is stored before redirecting
2. Check storage mechanism works (cookies/session/localStorage)
3. Verify state isn't modified in transit

### Token Refresh Fails

**Problem:** Refresh token returns error

**Solutions:**
1. Check refresh token hasn't expired (30 days)
2. Verify client ID matches original request
3. Ensure refresh token hasn't been revoked

---

## Next Steps

- [Getting Started Guide](/docs/guide/installation)
- [API Reference](/docs/api/overview)
- [React Hooks Guide](/docs/guide/react-integration)
- [Webhooks Guide](/docs/advanced/webhooks)
