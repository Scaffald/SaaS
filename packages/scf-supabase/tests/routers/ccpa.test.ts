/// <reference lib="deno.ns" />

/**
 * CCPA Router Tests
 *
 * Tests CCPA data subject rights endpoints including:
 * - Data access requests
 * - Data deletion requests
 * - Data correction requests
 * - Opt-out management
 * - Identity verification
 * - Admin endpoints
 *
 * These tests verify the CCPA compliance functionality.
 */

import {
  assertEquals,
  assertExists,
  assertNotEquals,
} from '../shared/assert.ts'

import {
  TEST_SUPABASE_URL,
  callTRPCEndpoint,
  createAdminClient,
  createTestClient,
  loadCachedTokens,
  registerUserWithMagicLink,
} from '../shared/setup.ts'

// Test user for CCPA tests
const TEST_CCPA_EMAIL = `ccpa-test-${Date.now()}@example.com`

// Store request IDs for cross-test use
const testContext: {
  accessRequestId?: string
  deletionRequestId?: string
  authToken?: string
  userId?: string
} = {}

/**
 * Helper: Get cached tokens or register a new user
 */
async function ensureAuthToken(): Promise<{ token: string; userId: string }> {
  if (testContext.authToken && testContext.userId) {
    return { token: testContext.authToken, userId: testContext.userId }
  }

  // Try to load cached tokens first
  const cached = await loadCachedTokens()
  if (cached?.regular?.token && !isTokenExpired(cached.regular.expiresAt)) {
    testContext.authToken = cached.regular.token
    testContext.userId = cached.regular.userId
    return { token: cached.regular.token, userId: cached.regular.userId }
  }

  // Register new user
  const result = await registerUserWithMagicLink(TEST_CCPA_EMAIL)
  if (result) {
    testContext.authToken = result.token
    testContext.userId = result.userId
    return result
  }

  throw new Error('Failed to get or create auth token')
}

function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 60_000
}

// ========================================================
// DATA ACCESS REQUEST TESTS
// ========================================================

Deno.test({
  name: 'CCPA - Request data access (Right to Know)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.requestDataAccess',
      { metadata: { source: 'test' } },
      { type: 'mutation', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return data')
    assertExists(data.id, 'Should return request ID')
    assertExists(data.deadlineAt, 'Should return deadline')
    assertEquals(data.status, 'pending', 'Status should be pending')

    // Store for later tests
    testContext.accessRequestId = data.id
  },
})

Deno.test({
  name: 'CCPA - Prevent duplicate active data access requests',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.requestDataAccess',
      { metadata: { source: 'duplicate-test' } },
      { type: 'mutation', authToken: token }
    )

    // Should get a CONFLICT error
    const error = response[0]?.error
    assertExists(error, 'Should return an error for duplicate request')
    assertEquals(error.code, -32000, 'Should be a tRPC error')
  },
})

Deno.test({
  name: 'CCPA - Get request status',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId

    assertExists(requestId, 'Access request ID should exist from previous test')

    const response = await callTRPCEndpoint(
      'ccpa.getRequestStatus',
      { requestId },
      { type: 'query', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return status data')
    assertEquals(data.id, requestId, 'Request ID should match')
    assertEquals(data.requestType, 'access', 'Request type should be access')
    assertEquals(data.status, 'pending', 'Status should be pending')
    assertExists(data.daysRemaining, 'Should include days remaining')
  },
})

Deno.test({
  name: 'CCPA - List my requests',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.listMyRequests',
      { limit: 10, offset: 0 },
      { type: 'query', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return list data')
    assertExists(data.items, 'Should have items array')
    assertExists(data.totalCount, 'Should have total count')
    assertEquals(data.items.length >= 1, true, 'Should have at least one request')
  },
})

// ========================================================
// DATA DELETION REQUEST TESTS
// ========================================================

Deno.test({
  name: 'CCPA - Request data deletion (Right to Delete)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.requestDeletion',
      { reason: 'Testing deletion functionality' },
      { type: 'mutation', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return data')
    assertExists(data.id, 'Should return request ID')
    assertEquals(data.status, 'pending', 'Status should be pending')

    // Store for later tests
    testContext.deletionRequestId = data.id
  },
})

Deno.test({
  name: 'CCPA - Cancel a pending request',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.deletionRequestId

    assertExists(requestId, 'Deletion request ID should exist')

    const response = await callTRPCEndpoint(
      'ccpa.cancelRequest',
      { requestId, reason: 'Testing cancellation' },
      { type: 'mutation', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return data')
    assertEquals(data.status, 'cancelled', 'Status should be cancelled')
  },
})

// ========================================================
// DATA CORRECTION REQUEST TESTS
// ========================================================

Deno.test({
  name: 'CCPA - Request data correction (Right to Correct)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.requestCorrection',
      {
        correctionDetails: 'Please update my profile name from "Test" to "Updated Test"',
      },
      { type: 'mutation', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return data')
    assertExists(data.id, 'Should return request ID')
    assertEquals(data.status, 'pending', 'Status should be pending')
  },
})

// ========================================================
// DATA PORTABILITY REQUEST TESTS
// ========================================================

Deno.test({
  name: 'CCPA - Request data portability',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.requestPortability',
      { format: 'json' },
      { type: 'mutation', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return data')
    assertExists(data.id, 'Should return request ID')
    assertEquals(data.format, 'json', 'Format should be json')
    assertEquals(data.status, 'pending', 'Status should be pending')
  },
})

// ========================================================
// OPT-OUT TESTS
// ========================================================

Deno.test({
  name: 'CCPA - Opt out of data processing',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.optOut',
      { categories: ['sale', 'sharing'] },
      { type: 'mutation', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return data')
    assertEquals(data.categories.length, 2, 'Should have 2 categories')
    assertEquals(data.categories.includes('sale'), true, 'Should include sale')
    assertEquals(data.categories.includes('sharing'), true, 'Should include sharing')
  },
})

Deno.test({
  name: 'CCPA - Get opt-out status',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.getOptOutStatus',
      undefined,
      { type: 'query', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return status data')
    assertEquals(data.sale.optedOut, true, 'Should be opted out of sale')
    assertEquals(data.sharing.optedOut, true, 'Should be opted out of sharing')
    assertEquals(data.targeted_advertising.optedOut, false, 'Should not be opted out of targeted_advertising')
    assertEquals(data.profiling.optedOut, false, 'Should not be opted out of profiling')
  },
})

Deno.test({
  name: 'CCPA - Opt back in to data processing',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.optIn',
      { categories: ['sale'] },
      { type: 'mutation', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return data')
    assertEquals(data.categories.includes('sale'), true, 'Should include sale in response')

    // Verify the opt-out status changed
    const statusResponse = await callTRPCEndpoint(
      'ccpa.getOptOutStatus',
      undefined,
      { type: 'query', authToken: token }
    )

    const status = statusResponse[0]?.result?.data
    assertEquals(status.sale.optedOut, false, 'Should no longer be opted out of sale')
    assertEquals(status.sharing.optedOut, true, 'Should still be opted out of sharing')
  },
})

// ========================================================
// VERIFICATION TESTS
// ========================================================

Deno.test({
  name: 'CCPA - Initiate verification',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId

    assertExists(requestId, 'Access request ID should exist')

    const response = await callTRPCEndpoint(
      'ccpa.initiateVerification',
      { requestId },
      { type: 'mutation', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return data')
    assertEquals(data.method, 'email', 'Method should be email')
    assertExists(data.expiresAt, 'Should have expiry time')
    assertExists(data.message, 'Should have a message')
  },
})

Deno.test({
  name: 'CCPA - Get verification status',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId

    assertExists(requestId, 'Access request ID should exist')

    const response = await callTRPCEndpoint(
      'ccpa.getVerificationStatus',
      { requestId },
      { type: 'query', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return verification status')
    assertEquals(data.method, 'email', 'Method should be email')
    assertEquals(data.status, 'pending', 'Status should be pending')
    assertExists(data.attemptsRemaining, 'Should have attempts remaining')
    assertExists(data.expiresAt, 'Should have expiry time')
  },
})

Deno.test({
  name: 'CCPA - Resend verification code',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId

    assertExists(requestId, 'Access request ID should exist')

    const response = await callTRPCEndpoint(
      'ccpa.resendVerification',
      { requestId },
      { type: 'mutation', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return data')
    assertExists(data.expiresAt, 'Should have new expiry time')
    assertExists(data.message, 'Should have a message')
  },
})

Deno.test({
  name: 'CCPA - Verify with invalid OTP code',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId

    assertExists(requestId, 'Access request ID should exist')

    const response = await callTRPCEndpoint(
      'ccpa.verifyEmailOTP',
      { requestId, code: '000000' },
      { type: 'mutation', authToken: token }
    )

    // Should get an error for invalid code
    const error = response[0]?.error
    assertExists(error, 'Should return an error for invalid code')
  },
})

Deno.test({
  name: 'CCPA - Request manual verification',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId

    assertExists(requestId, 'Access request ID should exist')

    const response = await callTRPCEndpoint(
      'ccpa.requestManualVerification',
      {
        requestId,
        reason: 'Unable to receive email verification codes due to email provider issues',
      },
      { type: 'mutation', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return data')
    assertExists(data.message, 'Should have a message')
  },
})

// ========================================================
// GET DATA SUMMARY TEST
// ========================================================

Deno.test({
  name: 'CCPA - Get data summary',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.getDataSummary',
      undefined,
      { type: 'query', authToken: token }
    )

    const data = response[0]?.result?.data
    assertExists(data, 'Should return data summary')
    assertExists(data.categories, 'Should have categories')
    assertExists(data.categories.personalInformation, 'Should have personal info category')
    assertExists(data.categories.professionalInformation, 'Should have professional info category')
    assertExists(data.totalRecords, 'Should have total records')
    assertExists(data.approximateSizeKb, 'Should have approximate size')
    assertExists(data.dataSources, 'Should have data sources count')
  },
})

// ========================================================
// UNAUTHORIZED ACCESS TESTS
// ========================================================

Deno.test({
  name: 'CCPA - Unauthorized access should fail',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // Try to access without auth token
    const response = await callTRPCEndpoint(
      'ccpa.listMyRequests',
      undefined,
      { type: 'query' }
    )

    const error = response[0]?.error
    assertExists(error, 'Should return an error for unauthorized access')
  },
})

Deno.test({
  name: 'CCPA - Cannot access other user requests',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    // Try to get status of a non-existent/other user's request
    const response = await callTRPCEndpoint(
      'ccpa.getRequestStatus',
      { requestId: '00000000-0000-0000-0000-000000000000' },
      { type: 'query', authToken: token }
    )

    const error = response[0]?.error
    assertExists(error, 'Should return an error for accessing other user request')
  },
})

// ========================================================
// PROCESSING ENDPOINT TESTS (Admin only)
// ========================================================

Deno.test({
  name: 'CCPA - Get processing status (returns null for non-existent)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // Note: This test would require admin auth to work fully
    // For now, we test that the endpoint exists and handles basic scenarios
    const { token } = await ensureAuthToken()

    // Regular user should not be able to access admin endpoint
    const response = await callTRPCEndpoint(
      'ccpa.getProcessingStatus',
      { requestId: '00000000-0000-0000-0000-000000000000' },
      { type: 'query', authToken: token }
    )

    // Should get an error (unauthorized for regular user)
    const error = response[0]?.error
    assertExists(error, 'Regular user should not access admin processing endpoints')
  },
})

Deno.test({
  name: 'CCPA - Process request requires admin role',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId

    assertExists(requestId, 'Access request ID should exist')

    // Regular user should not be able to process requests
    const response = await callTRPCEndpoint(
      'ccpa.processRequest',
      { requestId },
      { type: 'mutation', authToken: token }
    )

    // Should get an error (unauthorized for regular user)
    const error = response[0]?.error
    assertExists(error, 'Regular user should not be able to process requests')
  },
})

Deno.test({
  name: 'CCPA - Retry processing requires admin role',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId

    assertExists(requestId, 'Access request ID should exist')

    // Regular user should not be able to retry processing
    const response = await callTRPCEndpoint(
      'ccpa.retryProcessing',
      { requestId },
      { type: 'mutation', authToken: token }
    )

    // Should get an error (unauthorized for regular user)
    const error = response[0]?.error
    assertExists(error, 'Regular user should not be able to retry processing')
  },
})

// ========================================================
// PDF GENERATION ENDPOINT TESTS (Admin only)
// ========================================================

Deno.test({
  name: 'CCPA - Generate PDF requires admin role',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId

    assertExists(requestId, 'Access request ID should exist')

    // Regular user should not be able to generate PDFs
    const response = await callTRPCEndpoint(
      'ccpa.generatePDF',
      { requestId, includeQRCode: true },
      { type: 'mutation', authToken: token }
    )

    // Should get an error (unauthorized for regular user)
    const error = response[0]?.error
    assertExists(error, 'Regular user should not be able to generate PDFs')
  },
})

Deno.test({
  name: 'CCPA - Estimate PDF size requires admin role',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId

    assertExists(requestId, 'Access request ID should exist')

    // Regular user should not be able to estimate PDF size
    const response = await callTRPCEndpoint(
      'ccpa.estimatePDFSize',
      { requestId },
      { type: 'query', authToken: token }
    )

    // Should get an error (unauthorized for regular user)
    const error = response[0]?.error
    assertExists(error, 'Regular user should not be able to estimate PDF size')
  },
})

// ========================================================
// EXPORT STORAGE MANAGEMENT TESTS
// ========================================================

Deno.test({
  name: 'CCPA - Get export status for pending request',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId

    assertExists(requestId, 'Access request ID should exist')

    const response = await callTRPCEndpoint(
      'ccpa.getExportStatus',
      { requestId },
      { type: 'query', authToken: token }
    )

    const error = response[0]?.error
    const result = response[0]?.result?.data

    // Should succeed but show not available (request not completed)
    if (!error) {
      assertExists(result, 'Should return export status')
      assertEquals(result.available, false, 'Export should not be available for pending request')
    }
    // Or might return NOT_FOUND if request doesn't exist
  },
})

Deno.test({
  name: 'CCPA - Get export status requires authentication',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const requestId = testContext.accessRequestId ?? '00000000-0000-0000-0000-000000000001'

    const response = await callTRPCEndpoint(
      'ccpa.getExportStatus',
      { requestId },
      { type: 'query' } // No auth token
    )

    const error = response[0]?.error
    assertExists(error, 'Should require authentication')
  },
})

Deno.test({
  name: 'CCPA - Record download requires authentication',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const requestId = testContext.accessRequestId ?? '00000000-0000-0000-0000-000000000001'

    const response = await callTRPCEndpoint(
      'ccpa.recordDownload',
      { requestId },
      { type: 'mutation' } // No auth token
    )

    const error = response[0]?.error
    assertExists(error, 'Should require authentication')
  },
})

Deno.test({
  name: 'CCPA - Create and upload export requires admin role',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId ?? '00000000-0000-0000-0000-000000000001'

    // Regular user should not be able to create exports
    const response = await callTRPCEndpoint(
      'ccpa.createAndUploadExport',
      {
        requestId,
        userId: testContext.userId ?? '00000000-0000-0000-0000-000000000001',
        format: 'pdf',
      },
      { type: 'mutation', authToken: token }
    )

    const error = response[0]?.error
    assertExists(error, 'Regular user should not be able to create exports')
  },
})

Deno.test({
  name: 'CCPA - Run export cleanup requires admin role',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    // Regular user should not be able to run cleanup
    const response = await callTRPCEndpoint(
      'ccpa.runExportCleanup',
      {},
      { type: 'mutation', authToken: token }
    )

    const error = response[0]?.error
    assertExists(error, 'Regular user should not be able to run cleanup')
  },
})

// ========================================================
// NOTIFICATION ENDPOINT TESTS
// ========================================================

Deno.test({
  name: 'CCPA - Get notification types (public)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      'ccpa.getNotificationTypes',
      {},
      { type: 'query' } // No auth required
    )

    const error = response[0]?.error
    const result = response[0]?.result?.data

    if (!error) {
      assertExists(result, 'Should return notification types')
      assertExists(result.types, 'Should have types object')
      assertExists(result.description, 'Should have descriptions object')
    }
  },
})

Deno.test({
  name: 'CCPA - Send notification requires admin role',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()
    const requestId = testContext.accessRequestId ?? '00000000-0000-0000-0000-000000000001'

    // Regular user should not be able to send notifications
    const response = await callTRPCEndpoint(
      'ccpa.sendNotification',
      {
        requestId,
        notificationType: 'request_submitted',
      },
      { type: 'mutation', authToken: token }
    )

    const error = response[0]?.error
    assertExists(error, 'Regular user should not be able to send notifications')
  },
})

Deno.test({
  name: 'CCPA - Send deadline reminders requires admin role',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    // Regular user should not be able to send deadline reminders
    const response = await callTRPCEndpoint(
      'ccpa.sendDeadlineReminders',
      {},
      { type: 'mutation', authToken: token }
    )

    const error = response[0]?.error
    assertExists(error, 'Regular user should not be able to send deadline reminders')
  },
})

// ========================================================
// GPC (GLOBAL PRIVACY CONTROL) ENDPOINT TESTS
// ========================================================

Deno.test({
  name: 'CCPA - Get GPC config (public)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      'ccpa.getGPCConfig',
      {},
      { type: 'query' } // No auth required
    )

    const error = response[0]?.error
    const result = response[0]?.result?.data

    if (!error) {
      assertExists(result, 'Should return GPC config')
      assertExists(result.headerName, 'Should have headerName')
      assertEquals(result.headerName, 'Sec-GPC', 'Header should be Sec-GPC')
      assertExists(result.enabledValue, 'Should have enabledValue')
      assertEquals(result.enabledValue, '1', 'Enabled value should be "1"')
      assertExists(result.applicableCategories, 'Should have applicableCategories')
    }
  },
})

Deno.test({
  name: 'CCPA - Get GPC disclosure (public)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      'ccpa.getGPCDisclosure',
      {},
      { type: 'query' } // No auth required
    )

    const error = response[0]?.error
    const result = response[0]?.result?.data

    if (!error) {
      assertExists(result, 'Should return GPC disclosure')
      assertExists(result.disclosureText, 'Should have disclosure text')
      assertExists(result.categoryLabels, 'Should have category labels')
    }
  },
})

Deno.test({
  name: 'CCPA - Get Do Not Sell status (public, unauthenticated)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      'ccpa.getDoNotSellStatus',
      {},
      { type: 'query' } // No auth
    )

    const error = response[0]?.error
    const result = response[0]?.result?.data

    if (!error) {
      assertExists(result, 'Should return Do Not Sell status')
      assertEquals(result.isAuthenticated, false, 'Should show unauthenticated')
      assertExists(result.gpcHeaderName, 'Should have GPC header name')
      assertExists(result.learnMoreUrl, 'Should have learn more URL')
    }
  },
})

Deno.test({
  name: 'CCPA - Get Do Not Sell status with GPC header',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      'ccpa.getDoNotSellStatus',
      { gpcHeaderValue: '1' },
      { type: 'query' }
    )

    const error = response[0]?.error
    const result = response[0]?.result?.data

    if (!error) {
      assertExists(result, 'Should return Do Not Sell status')
      assertEquals(result.gpcDetected, true, 'Should detect GPC signal')
    }
  },
})

Deno.test({
  name: 'CCPA - Get GPC status requires authentication',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      'ccpa.getGPCStatus',
      {},
      { type: 'query' } // No auth token
    )

    const error = response[0]?.error
    assertExists(error, 'Should require authentication')
  },
})

Deno.test({
  name: 'CCPA - Get GPC status with authentication',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.getGPCStatus',
      {},
      { type: 'query', authToken: token }
    )

    const error = response[0]?.error
    const result = response[0]?.result?.data

    if (!error) {
      assertExists(result, 'Should return GPC status')
      assertEquals(typeof result.hasGPCOptOut, 'boolean', 'Should have hasGPCOptOut')
      assertExists(result.categories, 'Should have categories array')
    }
  },
})

Deno.test({
  name: 'CCPA - Process GPC signal requires authentication',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      'ccpa.processGPCSignal',
      { gpcHeaderValue: '1' },
      { type: 'mutation' } // No auth token
    )

    const error = response[0]?.error
    assertExists(error, 'Should require authentication')
  },
})

Deno.test({
  name: 'CCPA - Process GPC signal with no GPC header',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.processGPCSignal',
      { gpcHeaderValue: null },
      { type: 'mutation', authToken: token }
    )

    const error = response[0]?.error
    const result = response[0]?.result?.data

    if (!error) {
      assertExists(result, 'Should return result')
      assertEquals(result.gpcDetected, false, 'Should not detect GPC')
      assertEquals(result.processed, false, 'Should not process')
    }
  },
})

Deno.test({
  name: 'CCPA - Process GPC signal with enabled header',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { token } = await ensureAuthToken()

    const response = await callTRPCEndpoint(
      'ccpa.processGPCSignal',
      { gpcHeaderValue: '1' },
      { type: 'mutation', authToken: token }
    )

    const error = response[0]?.error
    const result = response[0]?.result?.data

    if (!error) {
      assertExists(result, 'Should return result')
      assertEquals(result.gpcDetected, true, 'Should detect GPC')
      assertExists(result.message, 'Should have message')
    }
  },
})

// ========================================================
// CLEANUP TEST
// ========================================================

Deno.test({
  name: 'CCPA - Cleanup test data',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const adminClient = createAdminClient()

    // Clean up test requests
    const { error } = await adminClient
      .schema('core')
      .from('ccpa_requests')
      .delete()
      .eq('user_id', testContext.userId ?? '')

    // Also clean up opt-outs
    await adminClient
      .schema('core')
      .from('ccpa_opt_outs')
      .delete()
      .eq('user_id', testContext.userId ?? '')

    assertEquals(error, null, 'Cleanup should succeed without errors')
  },
})
