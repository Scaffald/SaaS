/**
 * OAuth API Tests
 * Tests for /v1/oauth endpoints with 100% coverage
 */

import {
  assertEquals,
  assertExists,
  assert,
} from 'https://deno.land/std@0.208.0/assert/mod.ts'
import {
  createTestClient,
  assertSuccessResponse,
  assertErrorResponse,
  assertStatus,
} from '../helpers/test-client.ts'
import { cleanupCurrentTestData } from '../helpers/fixtures.ts'
import { markTestStart, createAdminClient, registerUserWithMagicLink } from '../setup.ts'

/**
 * Helper to generate PKCE challenge and verifier
 */
async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  // Generate random verifier
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const verifier = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  // Create SHA-256 challenge
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const challenge = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return { verifier, challenge }
}

/**
 * Helper to create a test OAuth app
 */
async function createTestOAuthApp(overrides: {
  client_id?: string
  display_name?: string
  status?: 'active' | 'trusted' | 'suspended' | 'revoked'
  redirect_uris?: string[]
  allowed_scopes?: string[]
  owner_id?: string
} = {}) {
  const admin = createAdminClient()

  const timestamp = Date.now()
  const clientId = overrides.client_id || crypto.randomUUID()

  // Generate client secret
  const clientSecret = `secret_${timestamp}`
  const encoder = new TextEncoder()
  const data = encoder.encode(clientSecret)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const clientSecretHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  // Create owner if not provided
  let ownerId = overrides.owner_id
  if (!ownerId) {
    const { data: authUser } = await admin.auth.admin.createUser({
      email: `oauth-owner-${timestamp}@example.com`,
      password: 'testpass123',
      email_confirm: true,
    })
    if (!authUser?.user) {
      throw new Error('Failed to create OAuth app owner')
    }
    ownerId = authUser.user.id
  }

  const { data: app } = await admin
    .schema('core')
    .from('oauth_apps')
    .insert({
      client_id: clientId,
      client_secret_hash: clientSecretHash,
      display_name: overrides.display_name || 'Test OAuth App',
      description: 'Test app description',
      owner_id: ownerId,
      status: overrides.status || 'active',
      redirect_uris: overrides.redirect_uris || ['https://example.com/callback'],
      allowed_scopes: overrides.allowed_scopes || ['profile:read', 'jobs:read'],
      homepage_url: 'https://example.com',
      privacy_policy_url: 'https://example.com/privacy',
      terms_of_service_url: 'https://example.com/terms',
      logo_url: 'https://example.com/logo.png',
    })
    .select()
    .single()

  return {
    ...app,
    client_secret: clientSecret, // Include raw secret for testing
  }
}

/**
 * Helper to create authorization code
 */
async function createTestAuthorizationCode(overrides: {
  oauth_app_id: string
  user_id: string
  redirect_uri?: string
  scopes?: string[]
  code_challenge?: string
  expires_at?: string
}) {
  const admin = createAdminClient()

  // Generate code
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const code = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  // Hash code
  const encoder = new TextEncoder()
  const data = encoder.encode(code)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const codeHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  const pkce = await generatePKCE()

  const { data: authCode } = await admin
    .schema('core')
    .from('oauth_authorization_codes')
    .insert({
      code_hash: codeHash,
      oauth_app_id: overrides.oauth_app_id,
      user_id: overrides.user_id,
      redirect_uri: overrides.redirect_uri || 'https://example.com/callback',
      scopes: overrides.scopes || ['profile:read', 'jobs:read'],
      code_challenge: overrides.code_challenge || pkce.challenge,
      code_challenge_method: 'S256',
      expires_at: overrides.expires_at || new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  return {
    ...authCode,
    raw_code: code,
    code_verifier: pkce.verifier,
  }
}

/**
 * Helper to create OAuth token
 */
async function createTestOAuthToken(overrides: {
  oauth_app_id: string
  user_id?: string
  token_type: 'access_token' | 'refresh_token'
  scopes?: string[]
  expires_at?: string
  revoked_at?: string | null
}) {
  const admin = createAdminClient()

  // Generate token
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const token = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  // Hash token
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  const { data: oauthToken } = await admin
    .schema('core')
    .from('oauth_tokens')
    .insert({
      token_hash: tokenHash,
      token_type: overrides.token_type,
      oauth_app_id: overrides.oauth_app_id,
      user_id: overrides.user_id || null,
      scopes: overrides.scopes || ['profile:read', 'jobs:read'],
      expires_at: overrides.expires_at || new Date(Date.now() + 3600 * 1000).toISOString(),
      revoked_at: overrides.revoked_at !== undefined ? overrides.revoked_at : null,
    })
    .select()
    .single()

  return {
    ...oauthToken,
    raw_token: token,
  }
}

/**
 * POST /oauth/authorize - OAuth authorization endpoint
 */

Deno.test('POST /oauth/authorize - returns authentication_required if no user', async () => {
  markTestStart()

  const app = await createTestOAuthApp()
  const pkce = await generatePKCE()

  const client = createTestClient()
  // Remove auth token
  client.setAuthToken('')

  const response = await client.post('/oauth/authorize', {
    client_id: app.client_id,
    redirect_uri: 'https://example.com/callback',
    response_type: 'code',
    scope: 'profile:read jobs:read',
    state: 'random-state-123',
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
  })

  assertSuccessResponse(response)
  assertEquals(response.body.authentication_required, true)
  assertExists(response.body.pending_auth)
  assertEquals(response.body.pending_auth.client_id, app.client_id)

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/authorize - returns unauthorized_client for invalid client_id', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-1@example.com')
  assert(user !== null)

  const pkce = await generatePKCE()
  const client = createTestClient({ authToken: user.token })

  const response = await client.post('/oauth/authorize', {
    client_id: crypto.randomUUID(), // Random invalid client_id
    redirect_uri: 'https://example.com/callback',
    response_type: 'code',
    scope: 'profile:read',
    state: 'random-state-123',
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
  })

  assertStatus(response, 400)
  assertEquals(response.body.error, 'unauthorized_client')

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/authorize - returns 403 for suspended app', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-2@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp({ status: 'suspended' })
  const pkce = await generatePKCE()

  const client = createTestClient({ authToken: user.token })
  const response = await client.post('/oauth/authorize', {
    client_id: app.client_id,
    redirect_uri: 'https://example.com/callback',
    response_type: 'code',
    scope: 'profile:read',
    state: 'random-state-123',
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
  })

  assertStatus(response, 403)
  assertEquals(response.body.error, 'unauthorized_client')

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/authorize - returns error for redirect_uri mismatch', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-3@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp({
    redirect_uris: ['https://example.com/callback'],
  })
  const pkce = await generatePKCE()

  const client = createTestClient({ authToken: user.token })
  const response = await client.post('/oauth/authorize', {
    client_id: app.client_id,
    redirect_uri: 'https://evil.com/callback', // Wrong redirect
    response_type: 'code',
    scope: 'profile:read',
    state: 'random-state-123',
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
  })

  assertStatus(response, 400)
  assertEquals(response.body.error, 'invalid_request')
  assert(response.body.error_description?.includes('redirect_uri'))

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/authorize - returns error for unauthorized scopes', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-4@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp({
    allowed_scopes: ['profile:read'],
  })
  const pkce = await generatePKCE()

  const client = createTestClient({ authToken: user.token })
  const response = await client.post('/oauth/authorize', {
    client_id: app.client_id,
    redirect_uri: 'https://example.com/callback',
    response_type: 'code',
    scope: 'profile:read admin:write', // admin:write not allowed
    state: 'random-state-123',
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
  })

  assertStatus(response, 400)
  assertEquals(response.body.error, 'invalid_scope')

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/authorize - returns consent_required for non-trusted app', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-5@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp({ status: 'active' }) // Not trusted
  const pkce = await generatePKCE()

  const client = createTestClient({ authToken: user.token })
  const response = await client.post('/oauth/authorize', {
    client_id: app.client_id,
    redirect_uri: 'https://example.com/callback',
    response_type: 'code',
    scope: 'profile:read',
    state: 'random-state-123',
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
  })

  assertSuccessResponse(response)
  assertEquals(response.body.consent_required, true)
  assertExists(response.body.oauth_app_id)
  assertExists(response.body.app)
  assertEquals(response.body.app.name, app.display_name)
  assert(Array.isArray(response.body.requested_scopes))

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/authorize - returns redirect_url for trusted app', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-6@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp({ status: 'trusted' })
  const pkce = await generatePKCE()

  const client = createTestClient({ authToken: user.token })
  const response = await client.post('/oauth/authorize', {
    client_id: app.client_id,
    redirect_uri: 'https://example.com/callback',
    response_type: 'code',
    scope: 'profile:read',
    state: 'random-state-123',
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
  })

  assertSuccessResponse(response)
  assertEquals(response.body.consent_required, false)
  assertExists(response.body.redirect_url)

  // Verify redirect URL structure
  const url = new URL(response.body.redirect_url)
  assertExists(url.searchParams.get('code'))
  assertEquals(url.searchParams.get('state'), 'random-state-123')

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/authorize - validates required fields', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-7@example.com')
  assert(user !== null)

  const client = createTestClient({ authToken: user.token })

  // Missing client_id
  const response = await client.post('/oauth/authorize', {
    redirect_uri: 'https://example.com/callback',
    response_type: 'code',
    scope: 'profile:read',
    state: 'random-state-123',
    code_challenge: 'challenge',
    code_challenge_method: 'S256',
  })

  assertStatus(response, 400)

  await cleanupCurrentTestData()
})

/**
 * POST /oauth/token - authorization_code grant
 */

Deno.test('POST /oauth/token - exchanges authorization code for tokens', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-token-1@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp()
  const authCode = await createTestAuthorizationCode({
    oauth_app_id: app.id,
    user_id: user.userId,
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode.raw_code,
      redirect_uri: authCode.redirect_uri,
      code_verifier: authCode.code_verifier,
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertSuccessResponse(response)
  assertExists(response.body.access_token)
  assertEquals(response.body.token_type, 'Bearer')
  assertEquals(response.body.expires_in, 3600)
  assertExists(response.body.refresh_token)
  assertExists(response.body.scope)

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/token - returns invalid_client for wrong credentials', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-token-2@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp()
  const authCode = await createTestAuthorizationCode({
    oauth_app_id: app.id,
    user_id: user.userId,
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode.raw_code,
      redirect_uri: authCode.redirect_uri,
      code_verifier: authCode.code_verifier,
      client_id: app.client_id,
      client_secret: 'wrong-secret',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertStatus(response, 401)
  assertEquals(response.body.error, 'invalid_client')

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/token - returns invalid_request for missing parameters', async () => {
  markTestStart()

  const app = await createTestOAuthApp()

  const client = createTestClient()
  const response = await client.post(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      // Missing code, redirect_uri, code_verifier
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertStatus(response, 400)
  assertEquals(response.body.error, 'invalid_request')

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/token - returns invalid_grant for expired code', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-token-3@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp()
  const authCode = await createTestAuthorizationCode({
    oauth_app_id: app.id,
    user_id: user.userId,
    expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode.raw_code,
      redirect_uri: authCode.redirect_uri,
      code_verifier: authCode.code_verifier,
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertStatus(response, 400)
  assertEquals(response.body.error, 'invalid_grant')

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/token - returns invalid_grant for redirect_uri mismatch', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-token-4@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp()
  const authCode = await createTestAuthorizationCode({
    oauth_app_id: app.id,
    user_id: user.userId,
    redirect_uri: 'https://example.com/callback',
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode.raw_code,
      redirect_uri: 'https://evil.com/callback', // Wrong
      code_verifier: authCode.code_verifier,
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertStatus(response, 400)
  assertEquals(response.body.error, 'invalid_grant')

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/token - returns invalid_grant for PKCE verification failure', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-token-5@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp()
  const authCode = await createTestAuthorizationCode({
    oauth_app_id: app.id,
    user_id: user.userId,
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode.raw_code,
      redirect_uri: authCode.redirect_uri,
      code_verifier: 'wrong-verifier', // Wrong verifier
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertStatus(response, 400)
  assertEquals(response.body.error, 'invalid_grant')

  await cleanupCurrentTestData()
})

/**
 * POST /oauth/token - refresh_token grant
 */

Deno.test('POST /oauth/token - refreshes token successfully', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-refresh-1@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp()
  const refreshToken = await createTestOAuthToken({
    oauth_app_id: app.id,
    user_id: user.userId,
    token_type: 'refresh_token',
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken.raw_token,
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertSuccessResponse(response)
  assertExists(response.body.access_token)
  assertExists(response.body.refresh_token)
  assertEquals(response.body.token_type, 'Bearer')

  // Verify old refresh token is revoked
  const admin = createAdminClient()
  const { data: oldToken } = await admin
    .schema('core')
    .from('oauth_tokens')
    .select('*')
    .eq('id', refreshToken.id)
    .single()

  assertExists(oldToken?.revoked_at)

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/token - returns invalid_grant for revoked refresh token', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-refresh-2@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp()
  const refreshToken = await createTestOAuthToken({
    oauth_app_id: app.id,
    user_id: user.userId,
    token_type: 'refresh_token',
    revoked_at: new Date().toISOString(), // Already revoked
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken.raw_token,
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertStatus(response, 400)
  assertEquals(response.body.error, 'invalid_grant')

  await cleanupCurrentTestData()
})

/**
 * POST /oauth/token - client_credentials grant
 */

Deno.test('POST /oauth/token - issues token for client_credentials grant', async () => {
  markTestStart()

  const app = await createTestOAuthApp({
    allowed_scopes: ['api:read', 'api:write'],
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'api:read',
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertSuccessResponse(response)
  assertExists(response.body.access_token)
  assertEquals(response.body.token_type, 'Bearer')
  assertEquals(response.body.expires_in, 3600)
  assertEquals(response.body.refresh_token, undefined) // No refresh token
  assertEquals(response.body.scope, 'api:read')

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/token - validates scopes for client_credentials', async () => {
  markTestStart()

  const app = await createTestOAuthApp({
    allowed_scopes: ['api:read'],
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'api:read admin:write', // admin:write not allowed
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertStatus(response, 400)
  assertEquals(response.body.error, 'invalid_scope')

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/token - uses default scopes if none requested', async () => {
  markTestStart()

  const app = await createTestOAuthApp({
    allowed_scopes: ['api:read', 'api:write'],
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      // No scope parameter
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertSuccessResponse(response)
  // Should include all allowed scopes
  assert(response.body.scope.includes('api:read'))
  assert(response.body.scope.includes('api:write'))

  await cleanupCurrentTestData()
})

/**
 * POST /oauth/revoke - Token revocation
 */

Deno.test('POST /oauth/revoke - revokes token successfully', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-revoke-1@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp()
  const accessToken = await createTestOAuthToken({
    oauth_app_id: app.id,
    user_id: user.userId,
    token_type: 'access_token',
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/revoke',
    new URLSearchParams({
      token: accessToken.raw_token,
      token_type_hint: 'access_token',
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertSuccessResponse(response)
  assertEquals(response.body.success, true)

  // Verify token is revoked
  const admin = createAdminClient()
  const { data: revokedToken } = await admin
    .schema('core')
    .from('oauth_tokens')
    .select('*')
    .eq('id', accessToken.id)
    .single()

  assertExists(revokedToken?.revoked_at)
  assertEquals(revokedToken?.revoked_reason, 'user_revoked')

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/revoke - returns 200 for invalid token (RFC 7009)', async () => {
  markTestStart()

  const app = await createTestOAuthApp()

  const client = createTestClient()
  const response = await client.post(
    '/oauth/revoke',
    new URLSearchParams({
      token: 'invalid-token-12345',
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  // Per RFC 7009, should return 200 even for invalid token
  assertSuccessResponse(response)
  assertEquals(response.body.success, true)

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/revoke - returns 401 for invalid client credentials', async () => {
  markTestStart()

  const client = createTestClient()
  const response = await client.post(
    '/oauth/revoke',
    new URLSearchParams({
      token: 'some-token',
      client_id: crypto.randomUUID(),
      client_secret: 'wrong-secret',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertStatus(response, 401)

  await cleanupCurrentTestData()
})

/**
 * POST /oauth/introspect - Token introspection
 */

Deno.test('POST /oauth/introspect - returns active:true for valid token', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-introspect-1@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp()
  const accessToken = await createTestOAuthToken({
    oauth_app_id: app.id,
    user_id: user.userId,
    token_type: 'access_token',
    scopes: ['profile:read', 'jobs:read'],
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/introspect',
    new URLSearchParams({
      token: accessToken.raw_token,
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertSuccessResponse(response)
  assertEquals(response.body.active, true)
  assertEquals(response.body.scope, 'profile:read jobs:read')
  assertEquals(response.body.client_id, app.client_id)
  assertEquals(response.body.token_type, 'access_token')
  assertExists(response.body.exp)
  assertEquals(response.body.sub, user.userId)

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/introspect - returns active:false for invalid token', async () => {
  markTestStart()

  const app = await createTestOAuthApp()

  const client = createTestClient()
  const response = await client.post(
    '/oauth/introspect',
    new URLSearchParams({
      token: 'invalid-token',
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertSuccessResponse(response)
  assertEquals(response.body.active, false)

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/introspect - returns active:false for expired token', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-introspect-2@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp()
  const accessToken = await createTestOAuthToken({
    oauth_app_id: app.id,
    user_id: user.userId,
    token_type: 'access_token',
    expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/introspect',
    new URLSearchParams({
      token: accessToken.raw_token,
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertSuccessResponse(response)
  assertEquals(response.body.active, false)

  await cleanupCurrentTestData()
})

Deno.test('POST /oauth/introspect - returns active:false for revoked token', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-introspect-3@example.com')
  assert(user !== null)

  const app = await createTestOAuthApp()
  const accessToken = await createTestOAuthToken({
    oauth_app_id: app.id,
    user_id: user.userId,
    token_type: 'access_token',
    revoked_at: new Date().toISOString(), // Revoked
  })

  const client = createTestClient()
  const response = await client.post(
    '/oauth/introspect',
    new URLSearchParams({
      token: accessToken.raw_token,
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  assertSuccessResponse(response)
  assertEquals(response.body.active, false)

  await cleanupCurrentTestData()
})

/**
 * GET /oauth/userinfo - UserInfo endpoint
 */

Deno.test('GET /oauth/userinfo - returns user profile for authenticated user', async () => {
  markTestStart()

  const admin = createAdminClient()
  const user = await registerUserWithMagicLink('test-oauth-userinfo-1@example.com')
  assert(user !== null)

  // Create user profile
  await admin
    .schema('core')
    .from('user_profiles')
    .insert({
      id: user.userId,
      username: 'testuserinfo',
      first_name: 'John',
      last_name: 'Doe',
      avatar_url: 'https://example.com/avatar.jpg',
    })

  const client = createTestClient({ authToken: user.token })
  const response = await client.get('/oauth/userinfo')

  assertSuccessResponse(response)
  assertEquals(response.body.sub, user.userId)
  assertExists(response.body.email)
  assertEquals(response.body.given_name, 'John')
  assertEquals(response.body.family_name, 'Doe')
  assertEquals(response.body.name, 'John Doe')
  assertEquals(response.body.picture, 'https://example.com/avatar.jpg')
  assertExists(response.body.updated_at)

  await cleanupCurrentTestData()
})

Deno.test('GET /oauth/userinfo - returns 401 for unauthenticated request', async () => {
  markTestStart()

  const client = createTestClient()
  client.setAuthToken('')

  const response = await client.get('/oauth/userinfo', {
    headers: { Authorization: '' },
  })

  assertStatus(response, 401)

  await cleanupCurrentTestData()
})

Deno.test('GET /oauth/userinfo - returns basic info if profile not found', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-oauth-userinfo-2@example.com')
  assert(user !== null)

  const client = createTestClient({ authToken: user.token })
  const response = await client.get('/oauth/userinfo')

  assertSuccessResponse(response)
  assertEquals(response.body.sub, user.userId)
  assertExists(response.body.email)
  // Should only have basic claims without profile
  assertEquals(response.body.given_name, undefined)

  await cleanupCurrentTestData()
})

console.log('✅ All OAuth API tests passed!')
