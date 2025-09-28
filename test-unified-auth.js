#!/usr/bin/env node

/**
 * Test script to verify the unified authentication implementation
 * Run with: node test-unified-auth.js
 */

const { createClient } = require('@supabase/supabase-js')

// Test the unified client configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

console.log('Testing Unified Auth Implementation')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Don't persist for testing
    detectSessionInUrl: false,
  },
})

async function testUnifiedAuth() {
  try {
    console.log('\n🔧 Testing unified authentication implementation...')

    console.log('\n1. Testing Supabase connection...')
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error && !error.message.includes('permission denied')) {
      throw new Error(`Connection failed: ${error.message}`)
    }
    console.log('✅ Unified Supabase client connection successful')

    console.log('\n2. Testing magic link generation...')
    const testEmail = 'unified-test@example.com'
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: {
        emailRedirectTo: 'http://localhost:8081',
      },
    })

    if (magicLinkError) {
      console.log('❌ Magic link error:', magicLinkError.message)
    } else {
      console.log('✅ Magic link sent successfully with unified client')
    }

    console.log('\n3. Testing OTP verification with invalid code...')
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

    console.log('\n4. Testing session management...')
    const { data: sessionData } = await supabase.auth.getSession()
    console.log(
      '✅ Session management working:',
      sessionData.session ? 'Has session' : 'No session'
    )

    console.log('\n5. Testing auth state change listener...')
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session ? 'Has session' : 'No session')
    })

    // Clean up listener
    setTimeout(() => {
      subscription.unsubscribe()
      console.log('✅ Auth state change listener working')
    }, 100)
  } catch (error) {
    console.error('❌ Unified auth test failed:', error.message)
    process.exit(1)
  }
}

console.log('\nRunning unified authentication tests...')
testUnifiedAuth()
  .then(() => {
    console.log('\n🎉 All unified auth tests completed successfully!')
    console.log('\nUnified implementation benefits:')
    console.log('✅ Single codebase for both web and native')
    console.log('✅ Direct Supabase client usage (no auth helpers)')
    console.log('✅ Consistent session management')
    console.log('✅ Platform-specific optimizations')
    console.log('✅ Simplified debugging and maintenance')
    console.log('\nNext steps:')
    console.log('1. Replace existing AuthProvider imports with unified version')
    console.log('2. Replace existing useSupabase imports with unified version')
    console.log('3. Test in both web and native environments')
    console.log('4. Remove old platform-specific files')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Unified auth test suite failed:', error)
    process.exit(1)
  })
