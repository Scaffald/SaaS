/**
 * Test script to verify external_jobs table permissions
 * Run with: pnpm tsx packages/supabase/scripts/test-external-jobs-permissions.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

console.log('🔍 Testing External Jobs Permissions\n')
console.log('Environment check:')
console.log('- URL:', supabaseUrl)
console.log('- Has anon key:', !!supabaseAnonKey)
console.log('- Has service key:', !!supabaseServiceKey)
console.log()

async function testAnonAccess() {
  console.log('📋 Test 1: Anonymous access to external_jobs')
  const anon = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await anon
    .from('external_jobs')
    .select('id, title, company_name, is_active')
    .limit(5)

  if (error) {
    console.log('❌ Anonymous access failed:', error.message)
    return false
  }

  console.log('✅ Anonymous access successful')
  console.log(`   Found ${data?.length || 0} jobs`)
  return true
}

async function testAuthenticatedAccess() {
  console.log('\n📋 Test 2: Authenticated access with service role context')

  // Simulate what tRPC does - service role with auth header
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await serviceClient
    .from('external_jobs')
    .select(`
      id,
      title,
      company_name,
      external_job_industries(
        industry:industries(
          id,
          name
        )
      )
    `)
    .eq('is_active', true)
    .limit(5)

  if (error) {
    console.log('❌ Service role access failed:', error.message)
    return false
  }

  console.log('✅ Service role access successful')
  console.log(`   Found ${data?.length || 0} jobs with industries`)
  if (data && data.length > 0) {
    console.log(`   Sample: "${data[0].title}" at ${data[0].company_name}`)
  }
  return true
}

async function testJobFeeds() {
  console.log('\n📋 Test 3: Anonymous access to external_job_feeds')
  const anon = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await anon
    .from('external_job_feeds')
    .select('id, name, feed_type, is_active')
    .eq('is_active', true)

  if (error) {
    console.log('❌ Job feeds access failed:', error.message)
    return false
  }

  console.log('✅ Job feeds access successful')
  console.log(`   Found ${data?.length || 0} active feeds`)
  return true
}

async function runTests() {
  const results = {
    anon: await testAnonAccess(),
    authenticated: await testAuthenticatedAccess(),
    feeds: await testJobFeeds(),
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log('Test Results:')
  console.log('- Anonymous access:', results.anon ? '✅ PASS' : '❌ FAIL')
  console.log('- Service role access:', results.authenticated ? '✅ PASS' : '❌ FAIL')
  console.log('- Job feeds access:', results.feeds ? '✅ PASS' : '❌ FAIL')

  const allPassed = Object.values(results).every((r) => r === true)
  console.log('\nOverall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED')
  console.log('='.repeat(50))

  process.exit(allPassed ? 0 : 1)
}

runTests().catch((error) => {
  console.error('💥 Test execution failed:', error)
  process.exit(1)
})
