# OAuth API

Implement OAuth 2.0 with PKCE for user authentication.

## Overview

The Scaffald OAuth API supports the Authorization Code flow with PKCE (Proof Key for Code Exchange) for secure authentication in both web and mobile applications.

**Flow:**
1. Generate authorization URL with PKCE challenge
2. Redirect user to authorization URL
3. User authorizes your application
4. Exchange authorization code for access token
5. Use access token to make API requests
6. Refresh token when expired

## Methods

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

// Store these securely (sessionStorage for web, secure storage for mobile)
sessionStorage.setItem('pkce_verifier', codeVerifier)
sessionStorage.setItem('oauth_state', state)

// Redirect user to authorization page
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
// In your OAuth callback handler
const code = new URL(window.location.href).searchParams.get('code')
const state = new URL(window.location.href).searchParams.get('state')

// Verify state to prevent CSRF
if (state !== sessionStorage.getItem('oauth_state')) {
  throw new Error('Invalid state parameter')
}

const tokens = await client.oauth.exchangeCode({
  code,
  codeVerifier: sessionStorage.getItem('pkce_verifier'),
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback'
})

// Store tokens securely
localStorage.setItem('access_token', tokens.access_token)
localStorage.setItem('refresh_token', tokens.refresh_token)

// Create authenticated client
const authenticatedClient = new Scaffald({
  accessToken: tokens.access_token
})
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

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `refreshToken` | `string` | Refresh token from previous authentication |
| `clientId` | `string` | Optional OAuth client ID |

**Returns:** Same as `exchangeCode`

**Example:**

```typescript
try {
  // Try to use access token
  const jobs = await client.jobs.list()
} catch (error) {
  if (error.status === 401) {
    // Token expired, refresh it
    const newTokens = await client.oauth.refreshToken(
      localStorage.getItem('refresh_token')
    )

    localStorage.setItem('access_token', newTokens.access_token)
    localStorage.setItem('refresh_token', newTokens.refresh_token)

    // Retry the request with new token
    const authenticatedClient = new Scaffald({
      accessToken: newTokens.access_token
    })
    const jobs = await authenticatedClient.jobs.list()
  }
}
```

## Complete OAuth Flow Example

```typescript
import Scaffald from '@scaffald/sdk'

// Step 1: Initialize client
const client = new Scaffald()

// Step 2: Start OAuth flow
async function startOAuthFlow() {
  const { url, codeVerifier, state } = await client.oauth.getAuthorizationUrl({
    clientId: 'your_client_id',
    redirectUri: 'https://yourapp.com/callback',
    scope: ['read:jobs', 'write:applications', 'read:profile']
  })

  // Store for callback
  sessionStorage.setItem('pkce_verifier', codeVerifier)
  sessionStorage.setItem('oauth_state', state)

  // Redirect to Scaffald
  window.location.href = url
}

// Step 3: Handle callback
async function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')

  // Verify state
  if (state !== sessionStorage.getItem('oauth_state')) {
    throw new Error('Invalid state - possible CSRF attack')
  }

  // Exchange code for tokens
  const tokens = await client.oauth.exchangeCode({
    code,
    codeVerifier: sessionStorage.getItem('pkce_verifier'),
    clientId: 'your_client_id',
    redirectUri: 'https://yourapp.com/callback'
  })

  // Store tokens
  localStorage.setItem('access_token', tokens.access_token)
  localStorage.setItem('refresh_token', tokens.refresh_token)

  // Clean up session storage
  sessionStorage.removeItem('pkce_verifier')
  sessionStorage.removeItem('oauth_state')

  return tokens
}

// Step 4: Use authenticated client
function createAuthenticatedClient() {
  return new Scaffald({
    accessToken: localStorage.getItem('access_token')
  })
}

// Step 5: Auto-refresh tokens
async function makeAuthenticatedRequest(requestFn) {
  let client = createAuthenticatedClient()

  try {
    return await requestFn(client)
  } catch (error) {
    if (error.status === 401) {
      // Refresh token
      const newTokens = await client.oauth.refreshToken(
        localStorage.getItem('refresh_token')
      )

      localStorage.setItem('access_token', newTokens.access_token)
      localStorage.setItem('refresh_token', newTokens.refresh_token)

      // Retry with new token
      client = createAuthenticatedClient()
      return await requestFn(client)
    }
    throw error
  }
}

// Usage
await makeAuthenticatedRequest(async (client) => {
  const jobs = await client.jobs.list()
  return jobs
})
```

## Security Best Practices

### PKCE (Proof Key for Code Exchange)

Always use PKCE for OAuth flows. The SDK handles this automatically:

- **Code Verifier**: Random string stored securely on your device
- **Code Challenge**: SHA-256 hash of code verifier sent to server
- **Verification**: Server validates code verifier matches challenge

### State Parameter

Use the `state` parameter to prevent CSRF attacks:

```typescript
const { url, state } = await client.oauth.getAuthorizationUrl({
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.com/callback',
  scope: ['read:jobs'],
  state: generateRandomString() // Or use the auto-generated one
})

// Verify state in callback
if (receivedState !== expectedState) {
  throw new Error('CSRF attack detected')
}
```

### Token Storage

**Web Applications:**
- Use `sessionStorage` for code verifier (temporary)
- Use `localStorage` or secure cookies for tokens
- Never expose tokens in URLs or logs

**Mobile Applications:**
- Use platform-specific secure storage (Keychain, Keystore)
- Never store tokens in plain text

## Available Scopes

| Scope | Description |
|-------|-------------|
| `read:jobs` | Read job listings |
| `write:applications` | Submit and manage applications |
| `read:profile` | Read user profile |
| `write:profile` | Update user profile |
| `read:connections` | Read user connections |
| `write:connections` | Manage connections |

## Next Steps

- [Client Configuration](/docs/api/client) - Configure the SDK
- [Authentication Guide](/docs/guide/authentication) - Detailed OAuth tutorial
- [Security Best Practices](/docs/guide/security) - Protect user data
