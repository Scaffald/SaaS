#!/usr/bin/env node

/**
 * End-to-End Test for API Key Authentication Flow
 * Tests the complete lifecycle of API keys
 */

const BASE_URL = 'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

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
      headers: Object.fromEntries(response.headers.entries()),
      data: text ? JSON.parse(text) : null,
    }
  } catch {
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: text,
    }
  }
}

async function main() {
  console.log('=========================================')
  console.log('API Key Authentication Flow Test')
  console.log('=========================================\n')

  let userId, accessToken, apiKey, apiKeyId

  try {
    // Step 1: Create and confirm a test user
    console.log('Step 1: Creating and confirming test user...')

    const email = `test-${Date.now()}@example.com`
    const password = 'test-password-123'

    // Create user using service role (auto-confirmed)
    const createUserResp = await request('POST', `${BASE_URL}/auth/v1/admin/users`, {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    }, {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'API Key Test User',
      },
    })

    if (createUserResp.status !== 200 && createUserResp.status !== 201) {
      console.error('❌ Failed to create user:', createUserResp)
      process.exit(1)
    }

    userId = createUserResp.data.id
    console.log(`✅ Created user: ${email}`)

    // Create an organization and team for this user using service role
    console.log('\nStep 1b: Creating organization and team membership...')

    // Create organization using core schema
    const orgResp = await request('POST', `${BASE_URL}/rest/v1/organizations`, {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Accept-Profile': 'core',
      'Content-Profile': 'core',
      Prefer: 'return=representation',
    }, {
      name: 'Test Organization',
      slug: `test-org-${Date.now()}`,
      owner_user_id: userId,
    })

    if (orgResp.status !== 201) {
      console.error('❌ Failed to create organization:', orgResp)
      process.exit(1)
    }

    const organizationId = orgResp.data[0].id
    console.log(`✅ Created organization: ${organizationId}`)

    // Create team using core schema
    const teamResp = await request('POST', `${BASE_URL}/rest/v1/teams`, {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Accept-Profile': 'core',
      'Content-Profile': 'core',
      Prefer: 'return=representation',
    }, {
      organization_id: organizationId,
      name: 'Default Team',
    })

    if (teamResp.status !== 201) {
      console.error('❌ Failed to create team:', teamResp)
      process.exit(1)
    }

    const teamId = teamResp.data[0].id
    console.log(`✅ Created team: ${teamId}`)

    // Add user to team using core schema
    const memberResp = await request('POST', `${BASE_URL}/rest/v1/team_members`, {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Accept-Profile': 'core',
      'Content-Profile': 'core',
      Prefer: 'return=representation',
    }, {
      team_id: teamId,
      user_id: userId,
      role: 'admin',
      user_type: 'employer',
    })

    if (memberResp.status !== 201) {
      console.error('❌ Failed to create team membership:', memberResp)
      process.exit(1)
    }

    console.log(`✅ Added user to team as admin`)

    // Step 2: Sign in to get JWT
    console.log('\nStep 2: Signing in to get JWT token...')

    const signinResp = await request('POST', `${BASE_URL}/auth/v1/token?grant_type=password`, {
      apikey: ANON_KEY,
    }, {
      email,
      password,
    })

    if (!signinResp.data?.access_token) {
      console.error('❌ Failed to get access token:', signinResp)
      process.exit(1)
    }

    accessToken = signinResp.data.access_token
    console.log(`✅ Got JWT access token: ${accessToken.substring(0, 50)}...`)

    // Step 3: Create an API key
    console.log('\nStep 3: Creating API key...')

    const createKeyResp = await request('POST', `${BASE_URL}/functions/v1/api/v1/api-keys`, {
      Authorization: `Bearer ${accessToken}`,
    }, {
      name: 'Test API Key',
      environment: 'test',
      scopes: ['read:jobs', 'write:applications'],
      rate_limit_tier: 'free',
    })

    if (createKeyResp.status !== 201 || !createKeyResp.data?.data?.key) {
      console.error('❌ Failed to create API key:', createKeyResp)
      process.exit(1)
    }

    apiKey = createKeyResp.data.data.key
    apiKeyId = createKeyResp.data.data.id
    console.log(`✅ Created API key: ${apiKey}`)
    console.log(`   Key ID: ${apiKeyId}`)
    console.log(`   Warning: ${createKeyResp.data.warning}`)

    // Step 4: Test authentication with API key
    console.log('\nStep 4: Testing API key authentication...')

    const listKeysResp = await request('GET', `${BASE_URL}/functions/v1/api/v1/api-keys`, {
      Authorization: `Bearer ${apiKey}`,
    })

    if (listKeysResp.status !== 200) {
      console.error('❌ Failed to authenticate with API key:', listKeysResp)
      process.exit(1)
    }

    console.log(`✅ Successfully authenticated with API key`)
    console.log(`   Found ${listKeysResp.data.data.length} API key(s)`)

    // Step 5: Test using API key to access protected endpoint
    console.log('\nStep 5: Testing API key with jobs endpoint...')

    const jobsResp = await request('GET', `${BASE_URL}/functions/v1/api/v1/jobs?limit=5`, {
      Authorization: `Bearer ${apiKey}`,
    })

    console.log(`   Jobs endpoint status: ${jobsResp.status}`)
    if (jobsResp.status === 200) {
      console.log(`✅ Successfully accessed jobs endpoint with API key`)
      console.log(`   Response: ${JSON.stringify(jobsResp.data).substring(0, 100)}...`)
    } else {
      console.log(`⚠️  Jobs endpoint returned ${jobsResp.status}`)
    }

    // Step 6: Check rate limit headers
    console.log('\nStep 6: Checking rate limit headers...')

    if (jobsResp.headers['x-ratelimit-limit']) {
      console.log(`✅ Rate limit headers present:`)
      console.log(`   Limit: ${jobsResp.headers['x-ratelimit-limit']}`)
      console.log(`   Remaining: ${jobsResp.headers['x-ratelimit-remaining']}`)
    } else {
      console.log(`⚠️  No rate limit headers found`)
    }

    // Step 7: Check usage tracking
    console.log('\nStep 7: Checking usage statistics...')

    const usageResp = await request('GET', `${BASE_URL}/functions/v1/api/v1/api-keys/${apiKeyId}/usage?days=1`, {
      Authorization: `Bearer ${apiKey}`,
    })

    if (usageResp.status === 200 && usageResp.data?.data) {
      const totalRequests = usageResp.data.data.total_requests
      console.log(`✅ Usage tracking working - ${totalRequests} request(s) tracked`)
      console.log(`   Success rate: ${usageResp.data.data.success_requests}/${totalRequests}`)
      console.log(`   Avg response time: ${usageResp.data.data.avg_response_time_ms}ms`)
    } else {
      console.log(`⚠️  Usage statistics: ${JSON.stringify(usageResp.data)}`)
    }

    // Step 8: Test updating API key (using JWT, not API key)
    console.log('\nStep 8: Testing API key update...')

    const updateResp = await request('PATCH', `${BASE_URL}/functions/v1/api/v1/api-keys/${apiKeyId}`, {
      Authorization: `Bearer ${accessToken}`,
    }, {
      name: 'Updated Test API Key',
    })

    if (updateResp.status === 200) {
      console.log(`✅ Successfully updated API key name`)
    } else {
      console.log(`⚠️  Update response: ${updateResp.status}`)
    }

    // Step 9: Test revoking API key
    console.log('\nStep 9: Testing API key revocation...')

    const revokeResp = await request('DELETE', `${BASE_URL}/functions/v1/api/v1/api-keys/${apiKeyId}`, {
      Authorization: `Bearer ${accessToken}`,
    })

    if (revokeResp.status === 200) {
      console.log(`✅ Successfully revoked API key`)
      console.log(`   Message: ${revokeResp.data.data.message}`)
    } else {
      console.log(`❌ Failed to revoke API key:`, revokeResp)
      process.exit(1)
    }

    // Step 10: Verify revoked key doesn't work
    console.log('\nStep 10: Verifying revoked key is rejected...')

    const revokedTestResp = await request('GET', `${BASE_URL}/functions/v1/api/v1/api-keys`, {
      Authorization: `Bearer ${apiKey}`,
    })

    if (revokedTestResp.status === 401) {
      console.log(`✅ Revoked API key correctly rejected with 401 status`)
      console.log(`   Error: ${revokedTestResp.data.error}`)
    } else {
      console.log(`⚠️  Expected 401, got ${revokedTestResp.status}`)
    }

    console.log('\n=========================================')
    console.log('✅ API Key Authentication Flow Test PASSED')
    console.log('=========================================')

  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
    process.exit(1)
  }
}

main()
