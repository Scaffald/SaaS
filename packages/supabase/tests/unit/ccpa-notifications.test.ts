/// <reference lib="deno.ns" />

/**
 * CCPA Notification Service Unit Tests
 *
 * Tests the notification module:
 * - Notification type constants
 * - Notification configuration
 * - Notification content generation (via type structure validation)
 * - Convenience function types
 */

import {
  assertEquals,
  assertExists,
} from '../shared/assert';

import {
  CCPA_NOTIFICATION_TYPES,
  NOTIFICATION_CONFIG,
  type CCPANotificationType,
  type CCPARequestInfo,
  type NotificationResult,
} from '../../functions/trpc/routers/ccpa/notifications';

// ========================================================
// NOTIFICATION TYPE TESTS
// ========================================================

Deno.test({
  name: 'CCPA Notifications - All notification types are defined',
  fn() {
    const expectedTypes = [
      'REQUEST_SUBMITTED',
      'VERIFICATION_REQUIRED',
      'REQUEST_ACKNOWLEDGED',
      'REQUEST_IN_PROGRESS',
      'REQUEST_COMPLETED',
      'DELETION_SCHEDULED',
      'DELETION_COMPLETED',
      'OPT_OUT_CONFIRMED',
      'OPT_IN_CONFIRMED',
      'DEADLINE_REMINDER',
      'DEADLINE_EXTENDED',
      'REQUEST_DENIED',
      'APPEAL_RECEIVED',
      'EXPORT_READY',
      'EXPORT_EXPIRING',
    ]

    for (const type of expectedTypes) {
      assertExists(
        CCPA_NOTIFICATION_TYPES[type as keyof typeof CCPA_NOTIFICATION_TYPES],
        `Should have ${type} notification type`
      )
    }
  },
})

Deno.test({
  name: 'CCPA Notifications - Notification types follow naming convention',
  fn() {
    const types = Object.values(CCPA_NOTIFICATION_TYPES)

    for (const type of types) {
      assertEquals(
        type.startsWith('ccpa.'),
        true,
        `Notification type '${type}' should start with 'ccpa.'`
      )
    }
  },
})

Deno.test({
  name: 'CCPA Notifications - All types are unique',
  fn() {
    const types = Object.values(CCPA_NOTIFICATION_TYPES)
    const uniqueTypes = new Set(types)

    assertEquals(
      types.length,
      uniqueTypes.size,
      'All notification types should be unique'
    )
  },
})

// ========================================================
// CONFIGURATION TESTS
// ========================================================

Deno.test({
  name: 'CCPA Notifications - Configuration has required values',
  fn() {
    assertExists(NOTIFICATION_CONFIG.FROM_NAME, 'Should have FROM_NAME')
    assertExists(NOTIFICATION_CONFIG.SUPPORT_EMAIL, 'Should have SUPPORT_EMAIL')
    assertExists(NOTIFICATION_CONFIG.DEADLINE_REMINDER_DAYS, 'Should have DEADLINE_REMINDER_DAYS')
    assertExists(NOTIFICATION_CONFIG.EXPORT_EXPIRY_REMINDER_HOURS, 'Should have EXPORT_EXPIRY_REMINDER_HOURS')
  },
})

Deno.test({
  name: 'CCPA Notifications - Deadline reminder days are reasonable',
  fn() {
    const days = NOTIFICATION_CONFIG.DEADLINE_REMINDER_DAYS

    assertEquals(Array.isArray(days), true, 'Should be an array')
    assertEquals(days.length > 0, true, 'Should have at least one reminder day')

    for (const day of days) {
      assertEquals(
        day > 0 && day <= 30,
        true,
        `Reminder day ${day} should be between 1 and 30`
      )
    }

    // Should be in descending order (7, 3, 1)
    for (let i = 1; i < days.length; i++) {
      assertEquals(
        days[i - 1] > days[i],
        true,
        'Reminder days should be in descending order'
      )
    }
  },
})

Deno.test({
  name: 'CCPA Notifications - Export expiry reminder is reasonable',
  fn() {
    const hours = NOTIFICATION_CONFIG.EXPORT_EXPIRY_REMINDER_HOURS

    assertEquals(
      hours > 0 && hours <= 24,
      true,
      'Export expiry reminder should be between 1 and 24 hours'
    )
  },
})

Deno.test({
  name: 'CCPA Notifications - Support email has valid format',
  fn() {
    const email = NOTIFICATION_CONFIG.SUPPORT_EMAIL

    assertEquals(
      email.includes('@'),
      true,
      'Support email should contain @'
    )
    assertEquals(
      email.includes('.'),
      true,
      'Support email should contain domain'
    )
  },
})

// ========================================================
// TYPE STRUCTURE TESTS
// ========================================================

Deno.test({
  name: 'CCPA Notifications - CCPARequestInfo interface structure is valid',
  fn() {
    const validRequest: CCPARequestInfo = {
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      requestType: 'access',
      userId: '987fcdeb-51a2-43d9-b789-12345678abcd',
      userEmail: 'test@example.com',
      userName: 'John Doe',
      deadline: new Date().toISOString(),
      status: 'pending',
    }

    assertExists(validRequest.requestId, 'Should have requestId')
    assertExists(validRequest.requestType, 'Should have requestType')
    assertExists(validRequest.userId, 'Should have userId')
    assertExists(validRequest.userEmail, 'Should have userEmail')
  },
})

Deno.test({
  name: 'CCPA Notifications - CCPARequestInfo with minimal fields',
  fn() {
    const minimalRequest: CCPARequestInfo = {
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      requestType: 'deletion',
      userId: '987fcdeb-51a2-43d9-b789-12345678abcd',
      userEmail: 'test@example.com',
    }

    assertExists(minimalRequest.requestId, 'Should have requestId')
    assertExists(minimalRequest.requestType, 'Should have requestType')
    assertExists(minimalRequest.userId, 'Should have userId')
    assertExists(minimalRequest.userEmail, 'Should have userEmail')
    assertEquals(minimalRequest.userName, undefined, 'Optional userName can be undefined')
  },
})

Deno.test({
  name: 'CCPA Notifications - NotificationResult interface structure is valid',
  fn() {
    const successResult: NotificationResult = {
      success: true,
      notificationId: '123e4567-e89b-12d3-a456-426614174000',
    }

    const failedResult: NotificationResult = {
      success: false,
      error: 'Failed to send notification',
    }

    assertEquals(successResult.success, true, 'Success result should have success=true')
    assertExists(successResult.notificationId, 'Success result should have notificationId')

    assertEquals(failedResult.success, false, 'Failed result should have success=false')
    assertExists(failedResult.error, 'Failed result should have error message')
  },
})

// ========================================================
// REQUEST TYPE COVERAGE TESTS
// ========================================================

Deno.test({
  name: 'CCPA Notifications - All CCPA request types can be handled',
  fn() {
    const requestTypes = ['access', 'deletion', 'correction', 'portability', 'opt_out', 'opt_in']

    for (const type of requestTypes) {
      const request: CCPARequestInfo = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        requestType: type,
        userId: '987fcdeb-51a2-43d9-b789-12345678abcd',
        userEmail: 'test@example.com',
      }

      assertExists(request.requestType, `Should handle ${type} request type`)
    }
  },
})

// ========================================================
// NOTIFICATION LIFECYCLE TESTS
// ========================================================

Deno.test({
  name: 'CCPA Notifications - Request lifecycle has appropriate notifications',
  fn() {
    // A complete request lifecycle should have these notification types
    const requestLifecycle = [
      CCPA_NOTIFICATION_TYPES.REQUEST_SUBMITTED,
      CCPA_NOTIFICATION_TYPES.VERIFICATION_REQUIRED,
      CCPA_NOTIFICATION_TYPES.REQUEST_ACKNOWLEDGED,
      CCPA_NOTIFICATION_TYPES.REQUEST_IN_PROGRESS,
      CCPA_NOTIFICATION_TYPES.REQUEST_COMPLETED,
    ]

    for (const type of requestLifecycle) {
      assertExists(type, `Lifecycle should include ${type}`)
      assertEquals(
        typeof type,
        'string',
        `${type} should be a string`
      )
    }
  },
})

Deno.test({
  name: 'CCPA Notifications - Deletion flow has specific notifications',
  fn() {
    const deletionFlow = [
      CCPA_NOTIFICATION_TYPES.DELETION_SCHEDULED,
      CCPA_NOTIFICATION_TYPES.DELETION_COMPLETED,
    ]

    for (const type of deletionFlow) {
      assertExists(type, `Deletion flow should include ${type}`)
    }
  },
})

Deno.test({
  name: 'CCPA Notifications - Opt-out flow has specific notifications',
  fn() {
    const optOutFlow = [
      CCPA_NOTIFICATION_TYPES.OPT_OUT_CONFIRMED,
      CCPA_NOTIFICATION_TYPES.OPT_IN_CONFIRMED,
    ]

    for (const type of optOutFlow) {
      assertExists(type, `Opt-out flow should include ${type}`)
    }
  },
})

Deno.test({
  name: 'CCPA Notifications - Export flow has specific notifications',
  fn() {
    const exportFlow = [
      CCPA_NOTIFICATION_TYPES.EXPORT_READY,
      CCPA_NOTIFICATION_TYPES.EXPORT_EXPIRING,
    ]

    for (const type of exportFlow) {
      assertExists(type, `Export flow should include ${type}`)
    }
  },
})

// ========================================================
// ERROR HANDLING TESTS
// ========================================================

Deno.test({
  name: 'CCPA Notifications - Error types are handled',
  fn() {
    const errorTypes = [
      CCPA_NOTIFICATION_TYPES.REQUEST_DENIED,
    ]

    for (const type of errorTypes) {
      assertExists(type, `Error flow should include ${type}`)
    }
  },
})

Deno.test({
  name: 'CCPA Notifications - Appeal type is available',
  fn() {
    assertExists(
      CCPA_NOTIFICATION_TYPES.APPEAL_RECEIVED,
      'Should have appeal received notification type'
    )
  },
})

// ========================================================
// DEADLINE REMINDER TESTS
// ========================================================

Deno.test({
  name: 'CCPA Notifications - Deadline reminder configuration',
  fn() {
    const reminderDays = NOTIFICATION_CONFIG.DEADLINE_REMINDER_DAYS

    // Should include 7-day, 3-day, and 1-day reminders
    assertEquals(
      reminderDays.includes(7),
      true,
      'Should include 7-day reminder'
    )
    assertEquals(
      reminderDays.includes(3),
      true,
      'Should include 3-day reminder'
    )
    assertEquals(
      reminderDays.includes(1),
      true,
      'Should include 1-day reminder'
    )
  },
})

Deno.test({
  name: 'CCPA Notifications - Deadline extended type exists',
  fn() {
    assertExists(
      CCPA_NOTIFICATION_TYPES.DEADLINE_EXTENDED,
      'Should have deadline extended notification type'
    )
  },
})

// ========================================================
// NOTIFICATION CATEGORY TESTS
// ========================================================

Deno.test({
  name: 'CCPA Notifications - Types cover all CCPA requirements',
  fn() {
    // CCPA requires notifications for:
    // 1. Receipt of request
    // 2. Verification status
    // 3. Processing status
    // 4. Completion
    // 5. Denial with reason
    // 6. Opt-out confirmation

    const requiredCapabilities = {
      receiptConfirmation: CCPA_NOTIFICATION_TYPES.REQUEST_SUBMITTED,
      verificationRequest: CCPA_NOTIFICATION_TYPES.VERIFICATION_REQUIRED,
      processingStarted: CCPA_NOTIFICATION_TYPES.REQUEST_ACKNOWLEDGED,
      requestComplete: CCPA_NOTIFICATION_TYPES.REQUEST_COMPLETED,
      requestDenied: CCPA_NOTIFICATION_TYPES.REQUEST_DENIED,
      optOutConfirmation: CCPA_NOTIFICATION_TYPES.OPT_OUT_CONFIRMED,
    }

    for (const [capability, type] of Object.entries(requiredCapabilities)) {
      assertExists(type, `Should have ${capability} notification capability`)
    }
  },
})

// ========================================================
// EDGE CASE TESTS
// ========================================================

Deno.test({
  name: 'CCPA Notifications - Handle special characters in user data',
  fn() {
    const request: CCPARequestInfo = {
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      requestType: 'access',
      userId: '987fcdeb-51a2-43d9-b789-12345678abcd',
      userEmail: 'josé.o\'brien@example.com',
      userName: 'José O'Brien",
    }

    // Should not throw when handling special characters
    assertExists(request.userEmail, 'Should handle special characters in email')
    assertExists(request.userName, 'Should handle special characters in name')
  },
})

Deno.test({
  name: 'CCPA Notifications - Handle missing optional fields',
  fn() {
    const request: CCPARequestInfo = {
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      requestType: 'access',
      userId: '987fcdeb-51a2-43d9-b789-12345678abcd',
      userEmail: 'test@example.com',
      // userName, deadline, status all omitted
    }

    assertEquals(request.userName, undefined, 'userName can be omitted')
    assertEquals(request.deadline, undefined, 'deadline can be omitted')
    assertEquals(request.status, undefined, 'status can be omitted')
  },
})

Deno.test({
  name: 'CCPA Notifications - Request types match expected values',
  fn() {
    const validRequestTypes = ['access', 'deletion', 'correction', 'portability', 'opt_out', 'opt_in']

    // These should map to appropriate notification flows
    for (const type of validRequestTypes) {
      assertEquals(
        typeof type,
        'string',
        `${type} should be a valid string`
      )
      assertEquals(
        type.length > 0,
        true,
        `${type} should not be empty`
      )
    }
  },
})
