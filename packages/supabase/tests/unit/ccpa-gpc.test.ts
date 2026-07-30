/// <reference lib="deno.ns" />

/**
 * GPC (Global Privacy Control) Unit Tests
 *
 * Tests the GPC signal detection and processing:
 * - Signal detection from headers
 * - Configuration validation
 * - Status types and structures
 * - Compliance helpers
 */

import {
  assertEquals,
  assertExists,
} from '../shared/assert.ts';

import {
  GPC_CONFIG,
  detectGPCSignal,
  isGPCEnabled,
  createGPCContext,
  getGPCDisclosureText,
  type GPCSignalResult,
  type GPCOptOutResult,
  type GPCStatus,
} from '../../functions/trpc/routers/ccpa/gpc.ts';

// ========================================================
// CONFIGURATION TESTS
// ========================================================

Deno.test({
  name: 'GPC - Configuration has required values',
  fn() {
    assertExists(GPC_CONFIG.HEADER_NAME, 'Should have HEADER_NAME')
    assertExists(GPC_CONFIG.ENABLED_VALUE, 'Should have ENABLED_VALUE')
    assertExists(GPC_CONFIG.SOURCE, 'Should have SOURCE')
    assertExists(GPC_CONFIG.APPLICABLE_CATEGORIES, 'Should have APPLICABLE_CATEGORIES')
    assertExists(GPC_CONFIG.ALL_CATEGORIES, 'Should have ALL_CATEGORIES')
  },
})

Deno.test({
  name: 'GPC - Header name is correct standard',
  fn() {
    assertEquals(
      GPC_CONFIG.HEADER_NAME,
      'Sec-GPC',
      'Header name should be Sec-GPC per GPC specification'
    )
  },
})

Deno.test({
  name: 'GPC - Enabled value is "1"',
  fn() {
    assertEquals(
      GPC_CONFIG.ENABLED_VALUE,
      '1',
      "Enabled value should be '1' per GPC specification"
    )
  },
})

Deno.test({
  name: 'GPC - Applicable categories include sale and sharing',
  fn() {
    const categories = GPC_CONFIG.APPLICABLE_CATEGORIES

    assertEquals(
      categories.includes('sale'),
      true,
      'Should include sale category (required by CCPA)'
    )
    assertEquals(
      categories.includes('sharing'),
      true,
      'Should include sharing category (required by CCPA)'
    )
  },
})

Deno.test({
  name: 'GPC - All categories cover CCPA requirements',
  fn() {
    const allCategories = GPC_CONFIG.ALL_CATEGORIES

    assertEquals(
      allCategories.includes('sale'),
      true,
      'Should include sale'
    )
    assertEquals(
      allCategories.includes('sharing'),
      true,
      'Should include sharing'
    )
    assertEquals(
      allCategories.includes('targeted_advertising'),
      true,
      'Should include targeted_advertising'
    )
    assertEquals(
      allCategories.includes('profiling'),
      true,
      'Should include profiling'
    )
  },
})

// ========================================================
// SIGNAL DETECTION TESTS
// ========================================================

Deno.test({
  name: 'GPC - Detect signal when header is present and enabled',
  fn() {
    const headers = new Headers()
    headers.set('Sec-GPC', '1')

    const result = detectGPCSignal(headers)

    assertEquals(result.detected, true, 'Should detect GPC signal')
    assertEquals(result.headerValue, '1', 'Header value should be "1"')
    assertExists(result.timestamp, 'Should have timestamp')
  },
})

Deno.test({
  name: 'GPC - No detection when header is absent',
  fn() {
    const headers = new Headers()

    const result = detectGPCSignal(headers)

    assertEquals(result.detected, false, 'Should not detect GPC signal')
    assertEquals(result.headerValue, null, 'Header value should be null')
  },
})

Deno.test({
  name: 'GPC - No detection when header value is not "1"',
  fn() {
    const testValues = ['0', 'true', 'false', '', 'enabled']

    for (const value of testValues) {
      const headers = new Headers()
      headers.set('Sec-GPC', value)

      const result = detectGPCSignal(headers)

      assertEquals(
        result.detected,
        false,
        `Should not detect GPC signal for value "${value}"`
      )
      assertEquals(result.headerValue, value, `Header value should be "${value}"`)
    }
  },
})

Deno.test({
  name: 'GPC - Detection timestamp is valid ISO string',
  fn() {
    const headers = new Headers()
    headers.set('Sec-GPC', '1')

    const result = detectGPCSignal(headers)

    // Verify timestamp is valid ISO string
    const date = new Date(result.timestamp)
    assertEquals(
      !isNaN(date.getTime()),
      true,
      'Timestamp should be valid ISO date'
    )
  },
})

// ========================================================
// IS GPC ENABLED TESTS
// ========================================================

Deno.test({
  name: 'GPC - isGPCEnabled returns true for "1"',
  fn() {
    assertEquals(isGPCEnabled('1'), true, 'Should return true for "1"')
  },
})

Deno.test({
  name: 'GPC - isGPCEnabled returns false for other values',
  fn() {
    const testValues = ['0', null, undefined, 'true', 'false', '', 'enabled']

    for (const value of testValues) {
      assertEquals(
        isGPCEnabled(value as string | null),
        false,
        `Should return false for "${value}"`
      )
    }
  },
})

// ========================================================
// TYPE STRUCTURE TESTS
// ========================================================

Deno.test({
  name: 'GPC - GPCSignalResult structure is valid',
  fn() {
    const result: GPCSignalResult = {
      detected: true,
      headerValue: '1',
      timestamp: new Date().toISOString(),
    }

    assertEquals(typeof result.detected, 'boolean', 'detected should be boolean')
    assertEquals(typeof result.timestamp, 'string', 'timestamp should be string')
  },
})

Deno.test({
  name: 'GPC - GPCOptOutResult success structure is valid',
  fn() {
    const successResult: GPCOptOutResult = {
      success: true,
      processed: true,
      categories: ['sale', 'sharing'],
      alreadyOptedOut: false,
    }

    assertEquals(successResult.success, true, 'Should have success=true')
    assertEquals(successResult.processed, true, 'Should have processed=true')
    assertEquals(Array.isArray(successResult.categories), true, 'categories should be array')
    assertEquals(successResult.alreadyOptedOut, false, 'Should have alreadyOptedOut')
  },
})

Deno.test({
  name: 'GPC - GPCOptOutResult failure structure is valid',
  fn() {
    const failedResult: GPCOptOutResult = {
      success: false,
      processed: false,
      categories: [],
      alreadyOptedOut: false,
      error: 'Processing failed',
    }

    assertEquals(failedResult.success, false, 'Should have success=false')
    assertEquals(failedResult.processed, false, 'Should have processed=false')
    assertExists(failedResult.error, 'Should have error message')
  },
})

Deno.test({
  name: 'GPC - GPCOptOutResult already opted out structure is valid',
  fn() {
    const alreadyOptedOutResult: GPCOptOutResult = {
      success: true,
      processed: false,
      categories: ['sale', 'sharing'],
      alreadyOptedOut: true,
    }

    assertEquals(alreadyOptedOutResult.success, true, 'Should succeed')
    assertEquals(alreadyOptedOutResult.processed, false, 'Should not process again')
    assertEquals(alreadyOptedOutResult.alreadyOptedOut, true, 'Should indicate already opted out')
  },
})

Deno.test({
  name: 'GPC - GPCStatus structure is valid',
  fn() {
    const status: GPCStatus = {
      hasGPCOptOut: true,
      gpcOptedOutAt: new Date().toISOString(),
      categories: [
        {
          category: 'sale',
          optedOut: true,
          source: 'gpc',
          optedOutAt: new Date().toISOString(),
        },
        {
          category: 'sharing',
          optedOut: true,
          source: 'gpc',
          optedOutAt: new Date().toISOString(),
        },
      ],
    }

    assertEquals(status.hasGPCOptOut, true, 'Should have hasGPCOptOut')
    assertExists(status.gpcOptedOutAt, 'Should have gpcOptedOutAt')
    assertEquals(Array.isArray(status.categories), true, 'categories should be array')
    assertEquals(status.categories[0].category, 'sale', 'First category should be sale')
    assertEquals(status.categories[0].source, 'gpc', 'Source should be gpc')
  },
})

// ========================================================
// GPC CONTEXT TESTS
// ========================================================

Deno.test({
  name: 'GPC - Create context when GPC enabled',
  fn() {
    const headers = new Headers()
    headers.set('Sec-GPC', '1')

    const context = createGPCContext(headers)

    assertEquals(context.gpcEnabled, true, 'gpcEnabled should be true')
    assertExists(context.gpcSignal, 'Should have gpcSignal')
    assertExists(context.processGPC, 'Should have processGPC function')
    assertEquals(typeof context.processGPC, 'function', 'processGPC should be function')
  },
})

Deno.test({
  name: 'GPC - Create context when GPC disabled',
  fn() {
    const headers = new Headers()

    const context = createGPCContext(headers)

    assertEquals(context.gpcEnabled, false, 'gpcEnabled should be false')
    assertEquals(context.gpcSignal.detected, false, 'Signal should not be detected')
  },
})

// ========================================================
// DISCLOSURE TEXT TESTS
// ========================================================

Deno.test({
  name: 'GPC - Disclosure text is not empty',
  fn() {
    const text = getGPCDisclosureText()

    assertExists(text, 'Should return disclosure text')
    assertEquals(text.length > 100, true, 'Text should be substantial')
  },
})

Deno.test({
  name: 'GPC - Disclosure text mentions required topics',
  fn() {
    const text = getGPCDisclosureText().toLowerCase()

    assertEquals(
      text.includes('global privacy control'),
      true,
      'Should mention Global Privacy Control'
    )
    assertEquals(
      text.includes('gpc'),
      true,
      'Should mention GPC'
    )
    assertEquals(
      text.includes('sale'),
      true,
      'Should mention sale of personal information'
    )
    assertEquals(
      text.includes('sharing'),
      true,
      'Should mention sharing'
    )
    assertEquals(
      text.includes('ccpa') || text.includes('california'),
      true,
      'Should mention CCPA or California'
    )
  },
})

Deno.test({
  name: 'GPC - Disclosure text includes link to globalprivacycontrol.org',
  fn() {
    const text = getGPCDisclosureText()

    assertEquals(
      text.includes('globalprivacycontrol.org'),
      true,
      'Should include link to GPC website'
    )
  },
})

// ========================================================
// EDGE CASE TESTS
// ========================================================

Deno.test({
  name: 'GPC - Handle case-insensitive header name',
  fn() {
    // Headers in browsers are case-insensitive
    const headers = new Headers()
    // Note: Headers API normalizes header names
    headers.set('sec-gpc', '1')

    const result = detectGPCSignal(headers)

    // The Headers API should normalize this
    assertEquals(
      result.detected || result.headerValue === '1',
      true,
      'Should handle case variations'
    )
  },
})

Deno.test({
  name: 'GPC - Empty headers object',
  fn() {
    const headers = new Headers()

    const result = detectGPCSignal(headers)

    assertEquals(result.detected, false, 'Should not detect from empty headers')
    assertEquals(result.headerValue, null, 'Header value should be null')
  },
})

Deno.test({
  name: 'GPC - Multiple detection calls return consistent results',
  fn() {
    const headers = new Headers()
    headers.set('Sec-GPC', '1')

    const result1 = detectGPCSignal(headers)
    const result2 = detectGPCSignal(headers)

    assertEquals(result1.detected, result2.detected, 'Detection should be consistent')
    assertEquals(result1.headerValue, result2.headerValue, 'Header value should be consistent')
  },
})

// ========================================================
// GPC APPLICABLE CATEGORIES TESTS
// ========================================================

Deno.test({
  name: 'GPC - Applicable categories are subset of all categories',
  fn() {
    const applicable = GPC_CONFIG.APPLICABLE_CATEGORIES
    const all = GPC_CONFIG.ALL_CATEGORIES

    for (const cat of applicable) {
      assertEquals(
        all.includes(cat),
        true,
        `Applicable category ${cat} should be in all categories`
      )
    }
  },
})

Deno.test({
  name: 'GPC - Applicable categories match CCPA requirements',
  fn() {
    // Under CCPA, GPC must opt out of sale and sharing
    const required = ['sale', 'sharing']
    const applicable = GPC_CONFIG.APPLICABLE_CATEGORIES

    for (const cat of required) {
      assertEquals(
        applicable.includes(cat as (typeof applicable)[number]),
        true,
        `${cat} is required by CCPA for GPC compliance`
      )
    }
  },
})

// ========================================================
// SOURCE IDENTIFIER TESTS
// ========================================================

Deno.test({
  name: 'GPC - Source identifier is "gpc_signal"',
  fn() {
    // Constrained by the schema, not by preference: core.ccpa_opt_outs.source
    // is the core.ccpa_opt_out_source enum, whose members are user_request,
    // gpc_signal and admin. The plain 'gpc' this used to expect belongs to
    // core.privacy_opt_outs (migration 305), a different table that the GPC
    // code path never writes to.
    assertEquals(
      GPC_CONFIG.SOURCE,
      'gpc_signal',
      "Source must match the core.ccpa_opt_out_source enum"
    )
  },
})

Deno.test({
  name: 'GPC - Source identifier is lowercase',
  fn() {
    assertEquals(
      GPC_CONFIG.SOURCE,
      GPC_CONFIG.SOURCE.toLowerCase(),
      'Source should be lowercase for consistency'
    )
  },
})
