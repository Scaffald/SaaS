#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Local API Test Script
 * Tests REST API routes by directly importing and calling them
 */

import { createClient } from 'npm:@supabase/supabase-js@2.39.0'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testHealthEndpoint() {
  console.log('\n🧪 Testing Health Endpoint...')

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api/health`, {
      method: 'GET',
    })

    const data = await response.json()
    console.log('✅ Health check:', data)
    return true
  } catch (error) {
    console.error('❌ Health check failed:', error)
    return false
  }
}

async function testAuthenticatedEndpoint() {
  console.log('\n🧪 Testing Authenticated Endpoint (Connections)...')

  // First, try to sign in or create a test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test123456',
  })

  if (authError) {
    console.log('⚠️  No test user found, skipping authenticated tests')
    console.log('   To test authenticated endpoints:')
    console.log('   1. Create a test user in Supabase Studio (http://127.0.0.1:54323)')
    console.log('   2. Or use an existing JWT token')
    return false
  }

  const token = authData.session?.access_token

  if (!token) {
    console.log('❌ No access token received')
    return false
  }

  // Test connections endpoint
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api/v1/connections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    console.log('✅ Connections endpoint:', data)
    return true
  } catch (error) {
    console.error('❌ Connections endpoint failed:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting API Tests...')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`)

  const healthOk = await testHealthEndpoint()
  const authOk = await testAuthenticatedEndpoint()

  console.log('\n📊 Test Summary:')
  console.log(`   Health Endpoint: ${healthOk ? '✅' : '❌'}`)
  console.log(`   Authenticated Endpoint: ${authOk ? '✅' : '⚠️  (needs test user)'}`)

  if (!healthOk) {
    console.log('\n⚠️  The API function may not be deployed/served locally.')
    console.log('   Try running: supabase functions serve api')
  }
}

main()
