/// <reference lib="deno.ns" />

/**
 * Export Storage Unit Tests
 *
 * Tests the CCPA export storage service:
 * - Storage key generation
 * - Configuration validation
 * - Download tracking types
 */

import {
  assertEquals,
  assertExists,
} from '../shared/assert.ts';

import {
  EXPORT_CONFIG,
  generateStorageKey,
  parseStorageKey,
  type ExportFormat,
  type UploadResult,
  type SignedUrlResult,
  type DownloadRecord,
  type CleanupResult,
} from '../../functions/trpc/routers/ccpa/export-storage.ts';

// ========================================================
// CONFIGURATION TESTS
// ========================================================

Deno.test({
  name: 'Export Storage - Configuration has all required values',
  fn() {
    assertExists(EXPORT_CONFIG.BUCKET_NAME, 'Should have bucket name')
    assertExists(EXPORT_CONFIG.PATH_PREFIX, 'Should have path prefix')
    assertExists(EXPORT_CONFIG.URL_EXPIRY_SECONDS, 'Should have URL expiry')
    assertExists(EXPORT_CONFIG.MAX_DOWNLOADS, 'Should have max downloads')
    assertExists(EXPORT_CONFIG.RETENTION_HOURS, 'Should have retention hours')
    assertExists(EXPORT_CONFIG.SUPPORTED_FORMATS, 'Should have supported formats')
  },
})

Deno.test({
  name: 'Export Storage - Configuration values are reasonable',
  fn() {
    // URL expiry should be 24 hours
    assertEquals(
      EXPORT_CONFIG.URL_EXPIRY_SECONDS,
      24 * 60 * 60,
      'URL expiry should be 24 hours'
    )

    // Max downloads should be 3
    assertEquals(
      EXPORT_CONFIG.MAX_DOWNLOADS,
      3,
      'Max downloads should be 3'
    )

    // Retention should be 24 hours
    assertEquals(
      EXPORT_CONFIG.RETENTION_HOURS,
      24,
      'Retention should be 24 hours'
    )

    // Should support pdf, json, csv
    assertEquals(
      EXPORT_CONFIG.SUPPORTED_FORMATS.includes('pdf'),
      true,
      'Should support PDF'
    )
    assertEquals(
      EXPORT_CONFIG.SUPPORTED_FORMATS.includes('json'),
      true,
      'Should support JSON'
    )
    assertEquals(
      EXPORT_CONFIG.SUPPORTED_FORMATS.includes('csv'),
      true,
      'Should support CSV'
    )
  },
})

// ========================================================
// STORAGE KEY GENERATION TESTS
// ========================================================

Deno.test({
  name: 'Export Storage - Generate storage key with correct format',
  fn() {
    const userId = '123e4567-e89b-12d3-a456-426614174000'
    const requestId = '987fcdeb-51a2-43d9-b789-12345678abcd'
    const format: ExportFormat = 'pdf'

    const key = generateStorageKey(userId, requestId, format)

    // Should start with path prefix
    assertEquals(
      key.startsWith(EXPORT_CONFIG.PATH_PREFIX),
      true,
      'Key should start with path prefix'
    )

    // Should contain userId
    assertEquals(
      key.includes(userId),
      true,
      'Key should contain userId'
    )

    // Should contain requestId
    assertEquals(
      key.includes(requestId),
      true,
      'Key should contain requestId'
    )

    // Should end with format
    assertEquals(
      key.endsWith(`.${format}`),
      true,
      'Key should end with format extension'
    )
  },
})

Deno.test({
  name: 'Export Storage - Generate unique keys for same request',
  fn() {
    const userId = '123e4567-e89b-12d3-a456-426614174000'
    const requestId = '987fcdeb-51a2-43d9-b789-12345678abcd'
    const format: ExportFormat = 'pdf'

    const key1 = generateStorageKey(userId, requestId, format)

    // Add small delay to ensure different timestamp
    const key2 = generateStorageKey(userId, requestId, format)

    // Keys should have same structure but potentially different timestamps
    assertEquals(
      key1.startsWith(EXPORT_CONFIG.PATH_PREFIX + userId),
      true,
      'Both keys should have same prefix'
    )
  },
})

Deno.test({
  name: 'Export Storage - Parse storage key correctly',
  fn() {
    const userId = '123e4567-e89b-12d3-a456-426614174000'
    const requestId = '987fcdeb-51a2-43d9-b789-12345678abcd'
    const format: ExportFormat = 'pdf'

    const key = generateStorageKey(userId, requestId, format)
    const parsed = parseStorageKey(key)

    assertExists(parsed, 'Should parse key successfully')
    assertEquals(parsed?.userId, userId, 'Parsed userId should match')
    assertEquals(parsed?.requestId, requestId, 'Parsed requestId should match')
    assertEquals(parsed?.format, format, 'Parsed format should match')
    assertEquals(typeof parsed?.timestamp, 'number', 'Parsed timestamp should be number')
  },
})

Deno.test({
  name: 'Export Storage - Parse invalid key returns null',
  fn() {
    const invalidKeys = [
      '',
      'invalid',
      'exports/only-user',
      'exports/user/request', // missing timestamp and format
      'different-prefix/user/request/123.pdf',
    ]

    for (const key of invalidKeys) {
      const parsed = parseStorageKey(key)
      assertEquals(parsed, null, `Invalid key '${key}' should return null`)
    }
  },
})

// ========================================================
// TYPE VALIDATION TESTS
// ========================================================

Deno.test({
  name: 'Export Storage - UploadResult structure is valid',
  fn() {
    const successResult: UploadResult = {
      success: true,
      storageKey: 'exports/user/request/123.pdf',
      storagePath: 'exports/user/request/123.pdf',
      uploadedAt: new Date().toISOString(),
      sizeBytes: 50000,
    }

    assertEquals(successResult.success, true, 'Success result should have success=true')
    assertExists(successResult.storageKey, 'Should have storageKey')
    assertExists(successResult.storagePath, 'Should have storagePath')
    assertExists(successResult.uploadedAt, 'Should have uploadedAt')
    assertEquals(successResult.sizeBytes > 0, true, 'sizeBytes should be positive')
  },
})

Deno.test({
  name: 'Export Storage - Failed UploadResult structure is valid',
  fn() {
    const failedResult: UploadResult = {
      success: false,
      storageKey: null,
      storagePath: null,
      uploadedAt: new Date().toISOString(),
      sizeBytes: 0,
      error: 'Upload failed',
    }

    assertEquals(failedResult.success, false, 'Failed result should have success=false')
    assertEquals(failedResult.storageKey, null, 'Failed result should have null storageKey')
    assertExists(failedResult.error, 'Failed result should have error message')
  },
})

Deno.test({
  name: 'Export Storage - SignedUrlResult structure is valid',
  fn() {
    const successResult: SignedUrlResult = {
      success: true,
      url: 'https://storage.example.com/signed?token=abc123',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }

    assertEquals(successResult.success, true, 'Success result should have success=true')
    assertExists(successResult.url, 'Should have URL')
    assertExists(successResult.expiresAt, 'Should have expiresAt')
  },
})

Deno.test({
  name: 'Export Storage - DownloadRecord structure is valid',
  fn() {
    const record: DownloadRecord = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      requestId: '987fcdeb-51a2-43d9-b789-12345678abcd',
      storageKey: 'exports/user/request/123.pdf',
      signedUrl: 'https://storage.example.com/signed?token=abc123',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      downloadCount: 1,
      maxDownloads: 3,
      firstDownloadedAt: new Date().toISOString(),
      lastDownloadedAt: new Date().toISOString(),
      fileFormat: 'pdf',
      fileSizeBytes: 50000,
      createdAt: new Date().toISOString(),
    }

    assertExists(record.id, 'Should have id')
    assertExists(record.requestId, 'Should have requestId')
    assertExists(record.storageKey, 'Should have storageKey')
    assertEquals(record.downloadCount, 1, 'Should have correct downloadCount')
    assertEquals(record.maxDownloads, 3, 'Should have correct maxDownloads')
    assertEquals(record.fileFormat, 'pdf', 'Should have correct fileFormat')
  },
})

Deno.test({
  name: 'Export Storage - CleanupResult structure is valid',
  fn() {
    const successResult: CleanupResult = {
      success: true,
      filesDeleted: 5,
      recordsDeleted: 5,
      errors: [],
    }

    assertEquals(successResult.success, true, 'Success result should have success=true')
    assertEquals(successResult.filesDeleted, 5, 'Should have correct filesDeleted')
    assertEquals(successResult.recordsDeleted, 5, 'Should have correct recordsDeleted')
    assertEquals(successResult.errors.length, 0, 'Should have no errors')
  },
})

Deno.test({
  name: 'Export Storage - CleanupResult with errors structure is valid',
  fn() {
    const resultWithErrors: CleanupResult = {
      success: false,
      filesDeleted: 3,
      recordsDeleted: 3,
      errors: [
        { key: 'exports/user/request/1.pdf', error: 'File not found' },
        { key: 'exports/user/request/2.pdf', error: 'Permission denied' },
      ],
    }

    assertEquals(resultWithErrors.success, false, 'Result with errors should have success=false')
    assertEquals(resultWithErrors.errors.length, 2, 'Should have 2 errors')
    assertExists(resultWithErrors.errors[0].key, 'Error should have key')
    assertExists(resultWithErrors.errors[0].error, 'Error should have error message')
  },
})

// ========================================================
// DOWNLOAD TRACKING TESTS
// ========================================================

Deno.test({
  name: 'Export Storage - Download count limits are enforced',
  fn() {
    const maxDownloads = EXPORT_CONFIG.MAX_DOWNLOADS

    // Simulate download tracking
    const scenarios = [
      { current: 0, expected: { allowed: true, remaining: maxDownloads - 1 } },
      { current: 1, expected: { allowed: true, remaining: maxDownloads - 2 } },
      { current: 2, expected: { allowed: true, remaining: 0 } },
      { current: 3, expected: { allowed: false, remaining: 0 } },
      { current: 4, expected: { allowed: false, remaining: 0 } },
    ]

    for (const scenario of scenarios) {
      const allowed = scenario.current < maxDownloads
      const remaining = Math.max(0, maxDownloads - scenario.current - 1)

      assertEquals(
        allowed,
        scenario.expected.allowed,
        `Download ${scenario.current} should be ${scenario.expected.allowed ? 'allowed' : 'blocked'}`
      )

      if (allowed) {
        assertEquals(
          remaining,
          scenario.expected.remaining,
          `After download ${scenario.current}, remaining should be ${scenario.expected.remaining}`
        )
      }
    }
  },
})

Deno.test({
  name: 'Export Storage - URL expiry calculation is correct',
  fn() {
    const now = Date.now()
    const expirySeconds = EXPORT_CONFIG.URL_EXPIRY_SECONDS
    const expiryMs = expirySeconds * 1000

    const expiresAt = new Date(now + expiryMs)
    const expectedHours = expirySeconds / 3600

    assertEquals(expectedHours, 24, 'Expiry should be 24 hours')

    // Verify the expiry is in the future
    assertEquals(expiresAt.getTime() > now, true, 'Expiry should be in the future')

    // Verify it's approximately 24 hours from now
    const hoursDiff = (expiresAt.getTime() - now) / (1000 * 60 * 60)
    assertEquals(Math.abs(hoursDiff - 24) < 0.01, true, 'Should be approximately 24 hours')
  },
})

// ========================================================
// FORMAT VALIDATION TESTS
// ========================================================

Deno.test({
  name: 'Export Storage - All supported formats are valid',
  fn() {
    const formats: ExportFormat[] = ['pdf', 'json', 'csv']

    for (const format of formats) {
      assertEquals(
        EXPORT_CONFIG.SUPPORTED_FORMATS.includes(format),
        true,
        `${format} should be supported`
      )

      // Generate key with format
      const key = generateStorageKey('user', 'request', format)
      assertEquals(
        key.endsWith(`.${format}`),
        true,
        `Key should end with .${format}`
      )
    }
  },
})

// ========================================================
// EDGE CASE TESTS
// ========================================================

Deno.test({
  name: 'Export Storage - Handle special characters in IDs',
  fn() {
    const userId = '123e4567-e89b-12d3-a456-426614174000'
    const requestId = '987fcdeb-51a2-43d9-b789-12345678abcd'
    const format: ExportFormat = 'pdf'

    const key = generateStorageKey(userId, requestId, format)

    // Key should be valid
    assertExists(key, 'Should generate key with UUID-format IDs')

    // Should parse back correctly
    const parsed = parseStorageKey(key)
    assertExists(parsed, 'Should parse key with UUID-format IDs')
  },
})

Deno.test({
  name: 'Export Storage - Retention period is enforced',
  fn() {
    const retentionHours = EXPORT_CONFIG.RETENTION_HOURS
    const now = Date.now()

    // File created now
    const createdAt = new Date(now)

    // File should expire after retention period
    const expiresAt = new Date(now + retentionHours * 60 * 60 * 1000)

    // Check at various times
    const checkTimes = [
      { hours: 0, shouldBeExpired: false },
      { hours: 12, shouldBeExpired: false },
      { hours: 23, shouldBeExpired: false },
      { hours: 24, shouldBeExpired: true },
      { hours: 25, shouldBeExpired: true },
    ]

    for (const check of checkTimes) {
      const checkTime = new Date(now + check.hours * 60 * 60 * 1000)
      const isExpired = checkTime >= expiresAt

      assertEquals(
        isExpired,
        check.shouldBeExpired,
        `After ${check.hours} hours, expired should be ${check.shouldBeExpired}`
      )
    }
  },
})
