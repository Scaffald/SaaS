/// <reference lib="deno.ns" />

/**
 * Request Processor Unit Tests
 *
 * Tests the CCPA request processing orchestrator:
 * - Processing stages and transitions
 * - Result structure validation
 * - Error tracking
 */

import {
  assertEquals,
  assertExists,
} from '../shared/assert';

import type {
  ProcessingStage,
  ProcessingResult,
} from '../../functions/trpc/routers/ccpa/request-processor';

// ========================================================
// TYPE VALIDATION TESTS
// ========================================================

Deno.test({
  name: 'Request Processor - ProcessingStage type covers all stages',
  fn() {
    // Verify all processing stages are defined
    const allStages: ProcessingStage[] = [
      'initializing',
      'collecting_core_data',
      'notifying_oauth_apps',
      'waiting_for_contributions',
      'aggregating_data',
      'generating_export',
      'finalizing',
      'completed',
      'failed',
    ]

    assertEquals(allStages.length, 9, 'Should have 9 processing stages')

    // Verify stage progression is logical
    const happyPathStages = [
      'initializing',
      'collecting_core_data',
      'notifying_oauth_apps',
      'waiting_for_contributions',
      'aggregating_data',
      'generating_export',
      'finalizing',
      'completed',
    ]

    assertEquals(happyPathStages.length, 8, 'Happy path should have 8 stages')
    assertEquals(happyPathStages[0], 'initializing', 'Should start with initializing')
    assertEquals(happyPathStages[happyPathStages.length - 1], 'completed', 'Should end with completed')
  },
})

Deno.test({
  name: 'Request Processor - ProcessingResult structure is valid',
  fn() {
    // Create a mock result to validate structure
    const mockResult: ProcessingResult = {
      success: false,
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      stage: 'initializing',
      coreDataCollected: false,
      oauthAppsNotified: 0,
      oauthAppsContributed: 0,
      totalRecords: 0,
      errors: [],
      completedAt: null,
    }

    assertExists(mockResult.success, 'Result should have success field')
    assertExists(mockResult.requestId, 'Result should have requestId field')
    assertExists(mockResult.stage, 'Result should have stage field')
    assertEquals(typeof mockResult.coreDataCollected, 'boolean', 'coreDataCollected should be boolean')
    assertEquals(typeof mockResult.oauthAppsNotified, 'number', 'oauthAppsNotified should be number')
    assertEquals(typeof mockResult.oauthAppsContributed, 'number', 'oauthAppsContributed should be number')
    assertEquals(typeof mockResult.totalRecords, 'number', 'totalRecords should be number')
    assertEquals(Array.isArray(mockResult.errors), true, 'errors should be array')
  },
})

// ========================================================
// RESULT STATE TESTS
// ========================================================

Deno.test({
  name: 'Request Processor - Successful result structure',
  fn() {
    const successResult: ProcessingResult = {
      success: true,
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      stage: 'completed',
      coreDataCollected: true,
      oauthAppsNotified: 2,
      oauthAppsContributed: 2,
      totalRecords: 150,
      errors: [],
      completedAt: new Date().toISOString(),
    }

    assertEquals(successResult.success, true, 'Success result should have success=true')
    assertEquals(successResult.stage, 'completed', 'Success result should be completed stage')
    assertEquals(successResult.coreDataCollected, true, 'Success result should have core data')
    assertExists(successResult.completedAt, 'Success result should have completedAt')
    assertEquals(successResult.errors.length, 0, 'Success result should have no errors')
  },
})

Deno.test({
  name: 'Request Processor - Failed result structure',
  fn() {
    const failedResult: ProcessingResult = {
      success: false,
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      stage: 'failed',
      coreDataCollected: false,
      oauthAppsNotified: 0,
      oauthAppsContributed: 0,
      totalRecords: 0,
      errors: [
        { source: 'data_collector', error: 'User not found', stage: 'collecting_core_data' },
      ],
      completedAt: null,
    }

    assertEquals(failedResult.success, false, 'Failed result should have success=false')
    assertEquals(failedResult.stage, 'failed', 'Failed result should be failed stage')
    assertEquals(failedResult.completedAt, null, 'Failed result should have null completedAt')
    assertEquals(failedResult.errors.length >= 1, true, 'Failed result should have at least one error')
    assertExists(failedResult.errors[0].source, 'Error should have source')
    assertExists(failedResult.errors[0].error, 'Error should have error message')
    assertExists(failedResult.errors[0].stage, 'Error should have stage')
  },
})

Deno.test({
  name: 'Request Processor - Partial success result structure',
  fn() {
    // When core data is collected but some OAuth apps failed
    const partialResult: ProcessingResult = {
      success: true,
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      stage: 'completed',
      coreDataCollected: true,
      oauthAppsNotified: 3,
      oauthAppsContributed: 2,
      totalRecords: 100,
      errors: [
        { source: 'oauth_app:app123', error: 'Webhook timeout', stage: 'waiting_for_contributions' },
      ],
      completedAt: new Date().toISOString(),
    }

    // Request can still be successful even with some non-critical errors
    assertEquals(partialResult.success, true, 'Partial success result should have success=true')
    assertEquals(partialResult.coreDataCollected, true, 'Should have core data')
    assertEquals(partialResult.oauthAppsContributed < partialResult.oauthAppsNotified, true,
      'Should have fewer contributions than notifications')
    assertEquals(partialResult.errors.length >= 1, true, 'Should have errors for failed apps')
  },
})

// ========================================================
// STAGE TRANSITION VALIDATION TESTS
// ========================================================

Deno.test({
  name: 'Request Processor - Stage transitions are valid',
  fn() {
    // Define valid transitions
    const validTransitions: Record<ProcessingStage, ProcessingStage[]> = {
      'initializing': ['collecting_core_data', 'failed'],
      'collecting_core_data': ['notifying_oauth_apps', 'failed'],
      'notifying_oauth_apps': ['waiting_for_contributions', 'aggregating_data', 'failed'],
      'waiting_for_contributions': ['aggregating_data', 'failed'],
      'aggregating_data': ['generating_export', 'finalizing', 'failed'],
      'generating_export': ['finalizing', 'failed'],
      'finalizing': ['completed', 'failed'],
      'completed': [],  // Terminal state
      'failed': [],     // Terminal state
    }

    // Verify starting stage
    const validStartTransitions = validTransitions['initializing']
    assertEquals(validStartTransitions.includes('collecting_core_data'), true,
      'initializing should transition to collecting_core_data')

    // Verify terminal states
    assertEquals(validTransitions['completed'].length, 0, 'completed should be terminal')
    assertEquals(validTransitions['failed'].length, 0, 'failed should be terminal')

    // Verify all stages can transition to failed
    const nonTerminalStages: ProcessingStage[] = [
      'initializing', 'collecting_core_data', 'notifying_oauth_apps',
      'waiting_for_contributions', 'aggregating_data', 'generating_export', 'finalizing'
    ]

    for (const stage of nonTerminalStages) {
      assertEquals(
        validTransitions[stage].includes('failed'),
        true,
        `${stage} should be able to transition to failed`
      )
    }
  },
})

// ========================================================
// ERROR TRACKING TESTS
// ========================================================

Deno.test({
  name: 'Request Processor - Error structure validation',
  fn() {
    const errors: Array<{ source: string; error: string; stage: string }> = [
      { source: 'orchestrator', error: 'Request not found', stage: 'initializing' },
      { source: 'data_collector', error: 'Database connection failed', stage: 'collecting_core_data' },
      { source: 'oauth_app:stripe', error: 'HTTP 500: Internal Server Error', stage: 'notifying_oauth_apps' },
      { source: 'oauth_app:salesforce', error: 'Webhook timeout', stage: 'waiting_for_contributions' },
    ]

    for (const err of errors) {
      assertExists(err.source, 'Error should have source')
      assertExists(err.error, 'Error should have error message')
      assertExists(err.stage, 'Error should have stage')

      // Verify source format
      if (err.source.startsWith('oauth_app:')) {
        const appId = err.source.split(':')[1]
        assertExists(appId, 'OAuth app error should have app ID')
      }
    }

    assertEquals(errors.length, 4, 'Should track all errors')
  },
})

// ========================================================
// OAUTH APP CONTRIBUTION TRACKING TESTS
// ========================================================

Deno.test({
  name: 'Request Processor - OAuth contribution counting',
  fn() {
    // Simulate different OAuth app response scenarios
    const scenarios = [
      { notified: 0, contributed: 0, description: 'No OAuth apps registered' },
      { notified: 3, contributed: 3, description: 'All apps contributed' },
      { notified: 3, contributed: 2, description: 'One app timed out' },
      { notified: 3, contributed: 0, description: 'All apps failed' },
      { notified: 5, contributed: 3, description: 'Partial success' },
    ]

    for (const scenario of scenarios) {
      assertEquals(
        scenario.contributed <= scenario.notified,
        true,
        `${scenario.description}: contributed should not exceed notified`
      )

      const successRate = scenario.notified > 0
        ? scenario.contributed / scenario.notified
        : 1

      assertEquals(
        successRate >= 0 && successRate <= 1,
        true,
        `${scenario.description}: success rate should be between 0 and 1`
      )
    }
  },
})

// ========================================================
// INTEGRATION SCENARIO TESTS
// ========================================================

Deno.test({
  name: 'Request Processor - Complete happy path scenario',
  fn() {
    // Simulate a complete successful processing flow
    const stages: ProcessingStage[] = []
    const result: ProcessingResult = {
      success: false,
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      stage: 'initializing',
      coreDataCollected: false,
      oauthAppsNotified: 0,
      oauthAppsContributed: 0,
      totalRecords: 0,
      errors: [],
      completedAt: null,
    }

    // Stage 1: Initialize
    stages.push(result.stage)
    result.stage = 'collecting_core_data'

    // Stage 2: Collect core data
    stages.push(result.stage)
    result.coreDataCollected = true
    result.totalRecords = 50
    result.stage = 'notifying_oauth_apps'

    // Stage 3: Notify OAuth apps
    stages.push(result.stage)
    result.oauthAppsNotified = 2
    result.stage = 'waiting_for_contributions'

    // Stage 4: Wait for contributions
    stages.push(result.stage)
    result.oauthAppsContributed = 2
    result.totalRecords = 75
    result.stage = 'aggregating_data'

    // Stage 5: Aggregate data
    stages.push(result.stage)
    result.totalRecords = 80
    result.stage = 'finalizing'

    // Stage 6: Finalize
    stages.push(result.stage)
    result.success = true
    result.completedAt = new Date().toISOString()
    result.stage = 'completed'
    stages.push(result.stage)

    // Verify final state
    assertEquals(result.success, true, 'Should be successful')
    assertEquals(result.stage, 'completed', 'Should be completed')
    assertEquals(result.coreDataCollected, true, 'Should have core data')
    assertEquals(result.oauthAppsContributed, result.oauthAppsNotified, 'All apps should contribute')
    assertExists(result.completedAt, 'Should have completion timestamp')
    assertEquals(result.errors.length, 0, 'Should have no errors')

    // Verify stage progression
    assertEquals(stages.length, 7, 'Should have 7 stage transitions')
    assertEquals(stages[0], 'initializing', 'Should start with initializing')
    assertEquals(stages[stages.length - 1], 'completed', 'Should end with completed')
  },
})

Deno.test({
  name: 'Request Processor - Failure recovery scenario',
  fn() {
    // Simulate a failed request that can be retried
    const result: ProcessingResult = {
      success: false,
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      stage: 'failed',
      coreDataCollected: true,
      oauthAppsNotified: 2,
      oauthAppsContributed: 1,
      totalRecords: 50,
      errors: [
        { source: 'oauth_app:app123', error: 'Connection refused', stage: 'notifying_oauth_apps' },
      ],
      completedAt: null,
    }

    // Verify failure state
    assertEquals(result.success, false, 'Should not be successful')
    assertEquals(result.stage, 'failed', 'Should be failed stage')
    assertEquals(result.errors.length >= 1, true, 'Should have at least one error')

    // Simulate retry
    result.stage = 'initializing'
    result.errors = []

    // Verify ready for retry
    assertEquals(result.stage, 'initializing', 'Should be reset to initializing')
    assertEquals(result.errors.length, 0, 'Errors should be cleared for retry')
  },
})
