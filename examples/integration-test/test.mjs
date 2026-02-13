#!/usr/bin/env node

/**
 * Comprehensive Integration Test for Scaffald SDK and API Key System
 *
 * This test suite verifies:
 * 1. SDK initialization and configuration
 * 2. API key creation via REST API
 * 3. Authentication with API keys
 * 4. Authentication with JWT tokens
 * 5. Rate limiting behavior
 * 6. Usage tracking and analytics
 * 7. API key management (list, update, revoke)
 * 8. Error handling
 */

import Scaffald from '@scaffald/sdk'

// Configuration
const BASE_URL = process.env.SCAFFALD_API_URL || 'http://127.0.0.1:54321/functions/v1/api'
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Test state
let testUser = null
let testOrganization = null
let testTeam = null
let userAccessToken = null
let testApiKey = null
let testApiKeyId = null

// Helpers
function log(section, message, data = null) {
  console.log(`\n[${ section }] ${message}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

function logSuccess(message) {
  console.log(`✅ ${message}`)
}

function logError(message, error = null) {
  console.log(`❌ ${message}`)
  if (error) {
    console.error(error)
  }
}

async function request(method, url, headers = {}, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const text = await response.text()

  try {
    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      data: text ? JSON.parse(text) : null,
    }
  } catch {
    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      data: text,
    }
  }
}

async function setupTestUser() {
  log('SETUP', 'Creating test user and organization...')

  // Create user
  const email = `integration-test-${Date.now()}@scaffald.test`
  const password = 'integration-test-password-123'

  const createUserResp = await request('POST', `${SUPABASE_URL}/auth/v1/admin/users`, {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  }, {
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Integration Test User',
    },
  })

  if (!createUserResp.ok) {
    throw new Error(`Failed to create user: ${JSON.stringify(createUserResp.data)}`)
  }

  testUser = createUserResp.data
  logSuccess(`Created user: ${email}`)

  // Create organization
  const orgResp = await request('POST', `${SUPABASE_URL}/rest/v1/organizations`, {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Accept-Profile': 'forsured',
    'Content-Profile': 'forsured',
    Prefer: 'return=representation',
  }, {
    name: 'Integration Test Org',
    slug: `integration-test-org-${Date.now()}`,
    owner_user_id: testUser.id,
  })

  if (!orgResp.ok || !orgResp.data || orgResp.data.length === 0) {
    throw new Error(`Failed to create organization: ${JSON.stringify(orgResp.data)}`)
  }

  testOrganization = orgResp.data[0]
  logSuccess(`Created organization: ${testOrganization.id}`)

  // Create team
  const teamResp = await request('POST', `${SUPABASE_URL}/rest/v1/teams`, {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Accept-Profile': 'forsured',
    'Content-Profile': 'forsured',
    Prefer: 'return=representation',
  }, {
    organization_id: testOrganization.id,
    name: 'Default Team',
  })

  if (!teamResp.ok || !teamResp.data || teamResp.data.length === 0) {
    throw new Error(`Failed to create team: ${JSON.stringify(teamResp.data)}`)
  }

  testTeam = teamResp.data[0]
  logSuccess(`Created team: ${testTeam.id}`)

  // Add user to team
  const memberResp = await request('POST', `${SUPABASE_URL}/rest/v1/team_members`, {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Accept-Profile': 'forsured',
    'Content-Profile': 'forsured',
    Prefer: 'return=representation',
  }, {
    team_id: testTeam.id,
    user_id: testUser.id,
    role: 'admin',
    user_type: 'employer',
  })

  if (!memberResp.ok) {
    throw new Error(`Failed to add user to team: ${JSON.stringify(memberResp.data)}`)
  }

  logSuccess(`Added user to team as admin`)

  // Sign in to get access token
  const signinResp = await request('POST', `${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    apikey: ANON_KEY,
  }, {
    email,
    password,
  })

  if (!signinResp.ok || !signinResp.data?.access_token) {
    throw new Error(`Failed to sign in: ${JSON.stringify(signinResp.data)}`)
  }

  userAccessToken = signinResp.data.access_token
  logSuccess(`Signed in and got access token`)

  log('SETUP', 'Test environment ready ✓')
}

async function testSdkInitialization() {
  log('TEST 1', 'SDK Initialization')

  try {
    // Test with base URL configuration
    const client = new Scaffald({
      baseUrl: BASE_URL,
      apiKey: 'sk_test_dummy', // Will be replaced later
      maxRetries: 3,
    })

    if (!client.jobs || !client.applications || !client.profiles) {
      throw new Error('SDK resources not initialized')
    }

    logSuccess('SDK initialized with all resources')
    logSuccess('Jobs, Applications, and Profiles resources available')

    return true
  } catch (error) {
    logError('SDK initialization failed', error)
    return false
  }
}

async function testApiKeyCreation() {
  log('TEST 2', 'API Key Creation via REST API')

  try {
    const createResp = await request('POST', `${BASE_URL}/v1/api-keys`, {
      Authorization: `Bearer ${userAccessToken}`,
    }, {
      name: 'Integration Test API Key',
      environment: 'test',
      scopes: ['read:jobs', 'write:applications', 'read:profiles'],
      rate_limit_tier: 'free',
    })

    if (!createResp.ok || !createResp.data?.data?.key) {
      throw new Error(`Failed to create API key: ${JSON.stringify(createResp.data)}`)
    }

    testApiKey = createResp.data.data.key
    testApiKeyId = createResp.data.data.id

    logSuccess(`API key created: ${testApiKey}`)
    logSuccess(`Key ID: ${testApiKeyId}`)
    logSuccess(`Warning message: "${createResp.data.warning}"`)

    // Verify key format
    if (!testApiKey.startsWith('sk_test_')) {
      throw new Error(`Invalid key format: ${testApiKey}`)
    }

    logSuccess('Key format validation passed')

    return true
  } catch (error) {
    logError('API key creation failed', error)
    return false
  }
}

async function testApiKeyAuthentication() {
  log('TEST 3', 'Authentication with API Key')

  try {
    // Test listing API keys using the API key itself
    const listResp = await request('GET', `${BASE_URL}/v1/api-keys`, {
      Authorization: `Bearer ${testApiKey}`,
    })

    if (!listResp.ok || !listResp.data?.data) {
      throw new Error(`Failed to authenticate with API key: ${JSON.stringify(listResp.data)}`)
    }

    logSuccess('Successfully authenticated with API key')
    logSuccess(`Found ${listResp.data.data.length} API key(s) in organization`)

    // Verify the key is in the list
    const foundKey = listResp.data.data.find(k => k.id === testApiKeyId)
    if (!foundKey) {
      throw new Error('Created API key not found in list')
    }

    logSuccess('Created key found in organization keys list')
    logSuccess(`Key prefix displayed as: ${foundKey.key_prefix}`)

    return true
  } catch (error) {
    logError('API key authentication failed', error)
    return false
  }
}

async function testJwtAuthentication() {
  log('TEST 4', 'Authentication with JWT Token')

  try {
    // Test listing API keys using JWT
    const listResp = await request('GET', `${BASE_URL}/v1/api-keys`, {
      Authorization: `Bearer ${userAccessToken}`,
    })

    if (!listResp.ok || !listResp.data?.data) {
      throw new Error(`Failed to authenticate with JWT: ${JSON.stringify(listResp.data)}`)
    }

    logSuccess('Successfully authenticated with JWT token')
    logSuccess(`Found ${listResp.data.data.length} API key(s)`)

    return true
  } catch (error) {
    logError('JWT authentication failed', error)
    return false
  }
}

async function testSdkWithApiKey() {
  log('TEST 5', 'SDK Usage with API Key')

  try {
    const client = new Scaffald({
      baseUrl: BASE_URL,
      apiKey: testApiKey,
    })

    // Test listing jobs
    const jobs = await client.jobs.list({ limit: 5 })

    logSuccess('SDK successfully made request with API key')
    logSuccess(`Jobs response: ${JSON.stringify(jobs).substring(0, 100)}...`)

    // Check rate limit info
    const rateLimitInfo = client.getRateLimitInfo()
    if (rateLimitInfo) {
      logSuccess(`Rate limit info available:`)
      log('RATE LIMIT', 'Current limits', rateLimitInfo)
    }

    return true
  } catch (error) {
    logError('SDK usage failed', error)
    return false
  }
}

async function testRateLimiting() {
  log('TEST 6', 'Rate Limiting')

  try {
    const client = new Scaffald({
      baseUrl: BASE_URL,
      apiKey: testApiKey,
    })

    // Make multiple requests to check rate limit headers
    logSuccess('Making 5 requests to check rate limit headers...')

    for (let i = 0; i < 5; i++) {
      await client.jobs.list({ limit: 1 })
      const rateLimitInfo = client.getRateLimitInfo()

      if (rateLimitInfo) {
        console.log(`  Request ${i + 1}: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining`)
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const finalRateLimit = client.getRateLimitInfo()
    if (!finalRateLimit) {
      logError('Rate limit headers not present')
      return false
    }

    logSuccess(`Rate limit: ${finalRateLimit.limit} requests/minute`)
    logSuccess(`Remaining: ${finalRateLimit.remaining}`)
    logSuccess(`Rate limit approaching: ${client.isRateLimitApproaching()}`)

    return true
  } catch (error) {
    logError('Rate limiting test failed', error)
    return false
  }
}

async function testUsageTracking() {
  log('TEST 7', 'Usage Tracking and Analytics')

  try {
    // Wait a moment for usage to be recorded
    await new Promise(resolve => setTimeout(resolve, 1000))

    const usageResp = await request('GET', `${BASE_URL}/v1/api-keys/${testApiKeyId}/usage?days=1`, {
      Authorization: `Bearer ${testApiKey}`,
    })

    if (!usageResp.ok || !usageResp.data?.data) {
      throw new Error(`Failed to get usage stats: ${JSON.stringify(usageResp.data)}`)
    }

    const stats = usageResp.data.data
    logSuccess('Usage statistics retrieved successfully')
    logSuccess(`Total requests: ${stats.total_requests}`)
    logSuccess(`Success requests: ${stats.success_requests}`)
    logSuccess(`Error rate: ${stats.error_rate}%`)
    logSuccess(`Avg response time: ${stats.avg_response_time_ms}ms`)

    if (stats.total_requests === 0) {
      logError('Expected some usage to be tracked')
      return false
    }

    return true
  } catch (error) {
    logError('Usage tracking test failed', error)
    return false
  }
}

async function testApiKeyUpdate() {
  log('TEST 8', 'API Key Update')

  try {
    // Update key name (must use JWT, not API key)
    const updateResp = await request('PATCH', `${BASE_URL}/v1/api-keys/${testApiKeyId}`, {
      Authorization: `Bearer ${userAccessToken}`,
    }, {
      name: 'Updated Integration Test Key',
    })

    if (!updateResp.ok || !updateResp.data?.data) {
      throw new Error(`Failed to update API key: ${JSON.stringify(updateResp.data)}`)
    }

    logSuccess('API key updated successfully')
    logSuccess(`New name: ${updateResp.data.data.name}`)

    // Verify update by listing
    const listResp = await request('GET', `${BASE_URL}/v1/api-keys`, {
      Authorization: `Bearer ${userAccessToken}`,
    })

    const updatedKey = listResp.data.data.find(k => k.id === testApiKeyId)
    if (updatedKey.name !== 'Updated Integration Test Key') {
      throw new Error('Key name not updated')
    }

    logSuccess('Update verified in keys list')

    return true
  } catch (error) {
    logError('API key update failed', error)
    return false
  }
}

async function testApiKeyRevocation() {
  log('TEST 9', 'API Key Revocation')

  try {
    // Revoke the key (must use JWT)
    const revokeResp = await request('DELETE', `${BASE_URL}/v1/api-keys/${testApiKeyId}`, {
      Authorization: `Bearer ${userAccessToken}`,
    })

    if (!revokeResp.ok || !revokeResp.data?.data) {
      throw new Error(`Failed to revoke API key: ${JSON.stringify(revokeResp.data)}`)
    }

    logSuccess('API key revoked successfully')
    logSuccess(`Message: ${revokeResp.data.data.message}`)

    // Verify revoked key doesn't work
    const testRevokedResp = await request('GET', `${BASE_URL}/v1/api-keys`, {
      Authorization: `Bearer ${testApiKey}`,
    })

    if (testRevokedResp.ok) {
      logError('Revoked key should not work but it did')
      return false
    }

    if (testRevokedResp.status !== 401) {
      logError(`Expected 401 status, got ${testRevokedResp.status}`)
      return false
    }

    logSuccess('Revoked key correctly rejected with 401')
    logSuccess(`Error message: ${testRevokedResp.data.error}`)

    return true
  } catch (error) {
    logError('API key revocation test failed', error)
    return false
  }
}

async function testErrorHandling() {
  log('TEST 10', 'Error Handling')

  try {
    const client = new Scaffald({
      baseUrl: BASE_URL,
      apiKey: 'sk_test_invalid_key_12345678901234567890',
    })

    // This should fail with proper error
    try {
      await client.jobs.list()
      logError('Expected request to fail with invalid key')
      return false
    } catch (error) {
      logSuccess('Invalid API key correctly rejected')
      logSuccess(`Error message: ${error.message}`)
    }

    // Test with malformed key
    const client2 = new Scaffald({
      baseUrl: BASE_URL,
      apiKey: 'invalid',
    })

    try {
      await client2.jobs.list()
      logError('Expected request to fail with malformed key')
      return false
    } catch (error) {
      logSuccess('Malformed API key correctly rejected')
    }

    return true
  } catch (error) {
    logError('Error handling test failed', error)
    return false
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║   Scaffald SDK & API Key System - Integration Tests           ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')

  const results = []

  try {
    // Setup
    await setupTestUser()

    // Run tests
    results.push({ name: 'SDK Initialization', passed: await testSdkInitialization() })
    results.push({ name: 'API Key Creation', passed: await testApiKeyCreation() })
    results.push({ name: 'API Key Authentication', passed: await testApiKeyAuthentication() })
    results.push({ name: 'JWT Authentication', passed: await testJwtAuthentication() })
    results.push({ name: 'SDK with API Key', passed: await testSdkWithApiKey() })
    results.push({ name: 'Rate Limiting', passed: await testRateLimiting() })
    results.push({ name: 'Usage Tracking', passed: await testUsageTracking() })
    results.push({ name: 'API Key Update', passed: await testApiKeyUpdate() })
    results.push({ name: 'API Key Revocation', passed: await testApiKeyRevocation() })
    results.push({ name: 'Error Handling', passed: await testErrorHandling() })

  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   Test Summary                                                 ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌'
    console.log(`${icon} ${result.name}`)
  })

  console.log(`\n📊 Results: ${passed}/${results.length} tests passed`)

  if (failed > 0) {
    console.log(`\n❌ ${failed} test(s) failed`)
    process.exit(1)
  } else {
    console.log('\n✅ All integration tests passed!')
    process.exit(0)
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Unhandled error:', error)
  process.exit(1)
})
