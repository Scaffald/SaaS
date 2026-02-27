---
title: OAuth Flow
---

# OAuth Flow Example

Complete OAuth 2.0 authentication flow implementation.

## Authorization Code Flow

### Step 1: Redirect to Authorization

```typescript
import Scaffald from '@scaffald/sdk';

const client = new Scaffald({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  redirectUri: 'https://yourapp.com/callback',
});

// Generate authorization URL
const authUrl = client.oauth.getAuthorizationUrl({
  scope: ['read:jobs', 'write:applications'],
  state: 'random_state_string',
});

// Redirect user
window.location.href = authUrl;
```

### Step 2: Handle Callback

```typescript
// /callback route
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, [searchParams]);

  async function handleOAuthCallback(code: string, state: string) {
    try {
      // Exchange code for tokens
      const tokens = await client.oauth.exchangeCode({
        code,
        state,
      });
      
      // Store tokens securely
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      
      // Redirect to app
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('OAuth error:', error);
    }
  }

  return <div>Completing authentication...</div>;
}
```

### Step 3: Use Access Token

```typescript
const client = new Scaffald({
  accessToken: localStorage.getItem('access_token'),
});

// Make authenticated requests
const profile = await client.profiles.me();
```

### Step 4: Refresh Tokens

```typescript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const tokens = await client.oauth.refreshToken({
    refresh_token: refreshToken,
  });
  
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
}
```

For detailed OAuth documentation, see [Authentication Guide](/docs/guide/authentication).
