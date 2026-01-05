#!/usr/bin/env node

/**
 * Simplified Integration Test for Scaffald SDK
 * Tests SDK functionality without requiring complex database setup
 */

import Scaffald from '@scaffald/sdk'

const BASE_URL = process.env.SCAFFALD_API_URL || 'http://127.0.0.1:54321/functions/v1/api'

function log(message, data = null) {
  console.log(`\n${message}`)
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
    console.error(error.message || error)
  }
}

async function testSDKInitialization() {
  log('═══ TEST 1: SDK Initialization ═══')

  try {
    // Test default initialization
    const client1 = new Scaffald({
      apiKey: 'sk_test_dummy_key_12345678901234567890',
    })

    if (!client1.jobs || !client1.applications || !client1.profiles) {
      throw new Error('SDK resources not initialized')
    }

    logSuccess('SDK initialized with default configuration')
    logSuccess('All resources available: jobs, applications, profiles')

    // Test custom configuration
    const client2 = new Scaffald({
      baseUrl: BASE_URL,
      apiKey: 'sk_live_custom_12345678901234567890',
      maxRetries: 5,
    })

    logSuccess('SDK initialized with custom configuration')
    logSuccess(`Base URL: ${BASE_URL}`)
    logSuccess('Max retries: 5')

    return true
  } catch (error) {
    logError('SDK initialization failed', error)
    return false
  }
}

async function testSDKResources() {
  log('═══ TEST 2: SDK Resources ═══')

  try {
    const client = new Scaffald({
      baseUrl: BASE_URL,
      apiKey: 'sk_test_test_12345678901234567890',
    })

    // Check Jobs resource
    if (typeof client.jobs.list !== 'function') {
      throw new Error('jobs.list() method not available')
    }
    if (typeof client.jobs.retrieve !== 'function') {
      throw new Error('jobs.retrieve() method not available')
    }
    if (typeof client.jobs.similar !== 'function') {
      throw new Error('jobs.similar() method not available')
    }
    logSuccess('Jobs resource: list(), retrieve(), similar() available')

    // Check Applications resource
    if (typeof client.applications.create !== 'function') {
      throw new Error('applications.create() method not available')
    }
    if (typeof client.applications.createQuick !== 'function') {
      throw new Error('applications.createQuick() method not available')
    }
    if (typeof client.applications.retrieve !== 'function') {
      throw new Error('applications.retrieve() method not available')
    }
    logSuccess('Applications resource: create(), createQuick(), retrieve() available')

    // Check Profiles resource
    if (typeof client.profiles.user !== 'function') {
      throw new Error('profiles.user() method not available')
    }
    if (typeof client.profiles.organization !== 'function') {
      throw new Error('profiles.organization() method not available')
    }
    logSuccess('Profiles resource: user(), organization() available')

    return true
  } catch (error) {
    logError('SDK resources test failed', error)
    return false
  }
}

async function testRateLimitTracking() {
  log('═══ TEST 3: Rate Limit Tracking ═══')

  try {
    const client = new Scaffald({
      baseUrl: BASE_URL,
      apiKey: 'sk_test_test_12345678901234567890',
    })

    // Check rate limit methods
    if (typeof client.getRateLimitInfo !== 'function') {
      throw new Error('getRateLimitInfo() method not available')
    }
    if (typeof client.isRateLimitApproaching !== 'function') {
      throw new Error('isRateLimitApproaching() method not available')
    }
    if (typeof client.onRateLimitUpdate !== 'function') {
      throw new Error('onRateLimitUpdate() method not available')
    }

    logSuccess('Rate limit methods available')
    logSuccess('getRateLimitInfo(), isRateLimitApproaching(), onRateLimitUpdate()')

    // Test rate limit callback
    let callbackCalled = false
    const unsubscribe = client.onRateLimitUpdate((info) => {
      callbackCalled = true
    })

    if (typeof unsubscribe !== 'function') {
      throw new Error('onRateLimitUpdate should return unsubscribe function')
    }

    logSuccess('Rate limit update callback registration works')
    logSuccess('Unsubscribe function returned')

    return true
  } catch (error) {
    logError('Rate limit tracking test failed', error)
    return false
  }
}

async function testErrorHandling() {
  log('═══ TEST 4: Error Handling ═══')

  try {
    // Test invalid configuration
    try {
      new Scaffald({
        // Missing required apiKey
        baseUrl: BASE_URL,
      })
      logError('Should have thrown error for missing apiKey')
      return false
    } catch (error) {
      logSuccess('Correctly throws error for missing apiKey')
    }

    try {
      new Scaffald({
        apiKey: '', // Empty apiKey
      })
      logError('Should have thrown error for empty apiKey')
      return false
    } catch (error) {
      logSuccess('Correctly throws error for empty apiKey')
    }

    return true
  } catch (error) {
    logError('Error handling test failed', error)
    return false
  }
}

async function testWebhookVerification() {
  log('═══ TEST 5: Webhook Verification ═══')

  try {
    const { verifyWebhookSignature } = await import('@scaffald/sdk')

    if (typeof verifyWebhookSignature !== 'function') {
      throw new Error('verifyWebhookSignature not exported')
    }

    logSuccess('Webhook verification function exported')

    // Test signature verification
    const payload = { event: 'job.created', data: { id: '123' } }
    const secret = 'test-secret-key'

    // This will fail with actual verification, but we're testing the API exists
    try {
      await verifyWebhookSignature(payload, 'invalid-signature', secret)
    } catch (error) {
      // Expected to fail with invalid signature
      logSuccess('Webhook signature verification function callable')
    }

    return true
  } catch (error) {
    logError('Webhook verification test failed', error)
    return false
  }
}

async function testReactHooksExport() {
  log('═══ TEST 6: React Hooks Export ═══')

  try {
    const reactModule = await import('@scaffald/sdk/react')

    if (!reactModule.ScaffaldProvider) {
      throw new Error('ScaffaldProvider not exported')
    }
    if (!reactModule.useScaffald) {
      throw new Error('useScaffald not exported')
    }
    if (!reactModule.useJobs) {
      throw new Error('useJobs not exported')
    }
    if (!reactModule.useApplications) {
      throw new Error('useApplications not exported')
    }

    logSuccess('React hooks module exports correctly')
    logSuccess('ScaffaldProvider, useScaffald, useJobs, useApplications available')

    return true
  } catch (error) {
    logError('React hooks export test failed', error)
    return false
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   Scaffald SDK - Simplified Integration Tests                 ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')

  const results = []

  results.push({ name: 'SDK Initialization', passed: await testSDKInitialization() })
  results.push({ name: 'SDK Resources', passed: await testSDKResources() })
  results.push({ name: 'Rate Limit Tracking', passed: await testRateLimitTracking() })
  results.push({ name: 'Error Handling', passed: await testErrorHandling() })
  results.push({ name: 'Webhook Verification', passed: await testWebhookVerification() })
  results.push({ name: 'React Hooks Export', passed: await testReactHooksExport() })

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
    console.log('\n💡 These tests verify SDK structure and exports.')
    console.log('   For full API integration tests, run the complete test suite.')
    process.exit(1)
  } else {
    console.log('\n✅ All SDK structure tests passed!')
    console.log('\n📝 Note: These tests verify SDK initialization and structure.')
    console.log('   API integration tests require running Supabase and test data.')
    process.exit(0)
  }
}

runTests().catch(error => {
  console.error('\n💥 Unhandled error:', error)
  process.exit(1)
})
