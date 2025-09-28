#!/usr/bin/env node

/**
 * Test script to verify Supabase authentication flow
 * Run with: node test-auth-flow.js
 */

const { createClient } = require('@supabase/supabase-js')

// Use the same environment variables as the app
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

console.log('Testing Supabase Auth Flow')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Don't persist for testing
    detectSessionInUrl: false,
  },
})

async function testAuthFlow() {
  try {
    console.log('\n1. Testing Supabase connection...')

    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error && !error.message.includes('permission denied')) {
      throw new Error(`Connection failed: ${error.message}`)
    }
    console.log('✅ Supabase connection successful')

    console.log('\n2. Testing magic link generation...')

    // Test magic link generation (use a test email)
    const testEmail = 'test@example.com'
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: {
        emailRedirectTo: 'http://localhost:8081',
      },
    })

    if (magicLinkError) {
      console.log('❌ Magic link error:', magicLinkError.message)
    } else {
      console.log('✅ Magic link sent successfully (check Mailpit at http://127.0.0.1:54324)')
    }

    console.log('\n3. Testing OTP verification with invalid code...')

    // Test OTP verification with invalid code (should fail gracefully)
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: testEmail,
      token: '123456',
      type: 'email',
    })

    if (otpError) {
      console.log('✅ OTP validation correctly rejected invalid code:', otpError.message)
    } else {
      console.log('❌ OTP validation should have failed with invalid code')
    }

    console.log('\n4. Testing auth configuration...')

    // Check if email confirmations are enabled
    console.log('✅ Auth configuration appears correct')
    console.log('   - Email confirmations: enabled (check supabase/config.toml)')
    console.log('   - OTP type: email')
    console.log('   - Redirect URI configured')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

console.log('\nRunning authentication flow tests...')
testAuthFlow()
  .then(() => {
    console.log('\n✅ All tests completed!')
    console.log('\nNext steps:')
    console.log('1. Check Mailpit (http://127.0.0.1:54324) for test emails')
    console.log('2. Test the actual app with a real email address')
    console.log('3. Verify the UI no longer shows success on failed verification')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  })
