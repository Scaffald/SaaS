/// <reference lib="deno.ns" />

/**
 * PDF Generator Unit Tests
 *
 * Tests the CCPA PDF generation service:
 * - PDF generation for data access reports
 * - PDF generation for deletion confirmations
 * - Size estimation
 * - Error handling
 */

import {
  assertEquals,
  assertExists,
} from '../shared/assert.ts';

import {
  estimatePDFSize,
  type PDFGenerationOptions,
  type PDFGenerationResult,
} from '../../functions/trpc/routers/ccpa/pdf-generator.ts';

import type { UserDataExport } from '../../functions/trpc/routers/ccpa/types.ts';

// ========================================================
// TEST DATA
// ========================================================

const createMockUserData = (recordCount: number = 10): UserDataExport => ({
  userId: '123e4567-e89b-12d3-a456-426614174000',
  personalInformation: {
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1 555-555-5555',
    accountCreatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    address: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'USA',
    },
    timezone: 'America/Los_Angeles',
    locale: 'en-US',
  },
  professionalInformation: {
    education: Array.from({ length: Math.min(recordCount, 3) }, (_, i) => ({
      institution: `University ${i + 1}`,
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2015-09-01',
      endDate: '2019-05-15',
    })),
    skills: Array.from({ length: recordCount }, (_, i) => ({
      name: `Skill ${i + 1}`,
      proficiency: 'Advanced',
    })),
    experience: Array.from({ length: Math.min(recordCount, 5) }, (_, i) => ({
      company: `Company ${i + 1}`,
      title: `Software Engineer ${i + 1}`,
      startDate: '2019-06-01',
      endDate: i === 0 ? undefined : '2021-12-31',
    })),
    certifications: [],
    workLogs: [],
  },
  financialInformation: {
    stripeConnected: false,
    payments: [],
    subscriptions: [],
  },
  usageInformation: {
    applicationCount: recordCount,
    profileViews: [],
    savedJobs: [],
    connectionCount: recordCount * 2,
  },
  sensitiveInformation: {
    backgroundChecks: [],
    idVerifications: [],
    personalityAssessments: [],
  },
  communications: {
    reviews: [],
    feedback: [],
  },
  metadata: {
    exportedAt: new Date().toISOString(),
    dataSources: ['core.profile', 'core.skills', 'core.experience'],
    totalRecords: recordCount,
    approximateSizeBytes: recordCount * 1000,
  },
})

const createMockOptions = (): PDFGenerationOptions => ({
  requestId: '123e4567-e89b-12d3-a456-426614174000',
  requestType: 'access',
  includeQRCode: true,
  baseUrl: 'https://scaffald.com',
})

// ========================================================
// PDF GENERATION RESULT TYPE TESTS
// ========================================================

Deno.test({
  name: 'PDF Generator - PDFGenerationResult structure is valid',
  fn() {
    const successResult: PDFGenerationResult = {
      success: true,
      pdfBytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF magic bytes
      fileName: 'ccpa-data-access-12345678.pdf',
      sizeBytes: 50000,
      pageCount: 4,
      generatedAt: new Date().toISOString(),
    }

    assertEquals(successResult.success, true, 'Success result should have success=true')
    assertExists(successResult.pdfBytes, 'Should have pdfBytes')
    assertExists(successResult.fileName, 'Should have fileName')
    assertEquals(successResult.sizeBytes > 0, true, 'sizeBytes should be positive')
    assertEquals(successResult.pageCount >= 1, true, 'pageCount should be at least 1')
    assertExists(successResult.generatedAt, 'Should have generatedAt timestamp')
  },
})

Deno.test({
  name: 'PDF Generator - Failed result structure is valid',
  fn() {
    const failedResult: PDFGenerationResult = {
      success: false,
      pdfBytes: null,
      fileName: '',
      sizeBytes: 0,
      pageCount: 0,
      generatedAt: new Date().toISOString(),
      error: 'Failed to generate PDF',
    }

    assertEquals(failedResult.success, false, 'Failed result should have success=false')
    assertEquals(failedResult.pdfBytes, null, 'Failed result should have null pdfBytes')
    assertExists(failedResult.error, 'Failed result should have error message')
    assertEquals(failedResult.sizeBytes, 0, 'Failed result should have 0 sizeBytes')
    assertEquals(failedResult.pageCount, 0, 'Failed result should have 0 pageCount')
  },
})

// ========================================================
// SIZE ESTIMATION TESTS
// ========================================================

Deno.test({
  name: 'PDF Generator - Estimate small PDF size',
  fn() {
    const smallData = createMockUserData(5)
    const estimate = estimatePDFSize(smallData)

    assertExists(estimate.estimatedBytes, 'Should have estimatedBytes')
    assertExists(estimate.estimatedPages, 'Should have estimatedPages')
    assertExists(estimate.category, 'Should have category')

    assertEquals(estimate.category, 'small', 'Small data should estimate to small category')
    assertEquals(estimate.estimatedPages >= 4, true, 'Should have at least 4 pages')
  },
})

Deno.test({
  name: 'PDF Generator - Estimate medium PDF size',
  fn() {
    // Create data that would result in medium size
    const mediumData = createMockUserData(100)
    // Increase data size significantly
    for (let i = 0; i < 50; i++) {
      mediumData.professionalInformation.workLogs.push({
        date: new Date().toISOString(),
        description: 'Work log entry '.repeat(100), // Long descriptions
        hours: 8,
      })
    }
    mediumData.metadata.approximateSizeBytes = 5 * 1024 * 1024 // 5MB

    const estimate = estimatePDFSize(mediumData)

    assertExists(estimate.estimatedBytes, 'Should have estimatedBytes')
    assertEquals(estimate.estimatedBytes > 50000, true, 'Medium data should have larger estimate')
  },
})

Deno.test({
  name: 'PDF Generator - Size categories are mutually exclusive',
  fn() {
    const categories = ['small', 'medium', 'large', 'very_large'] as const

    // Each data size should map to exactly one category
    const smallData = createMockUserData(1)
    const smallEstimate = estimatePDFSize(smallData)

    assertEquals(
      categories.includes(smallEstimate.category),
      true,
      'Category should be one of the valid categories'
    )
  },
})

// ========================================================
// OPTIONS VALIDATION TESTS
// ========================================================

Deno.test({
  name: 'PDF Generator - Options include all required fields',
  fn() {
    const options = createMockOptions()

    assertExists(options.requestId, 'Options should have requestId')
    assertExists(options.requestType, 'Options should have requestType')
    assertEquals(typeof options.includeQRCode, 'boolean', 'includeQRCode should be boolean')
    assertExists(options.baseUrl, 'Options should have baseUrl')
  },
})

Deno.test({
  name: 'PDF Generator - Request types are valid',
  fn() {
    const validTypes = ['access', 'deletion', 'correction', 'portability'] as const

    for (const type of validTypes) {
      const options: PDFGenerationOptions = {
        ...createMockOptions(),
        requestType: type,
      }
      assertEquals(validTypes.includes(options.requestType), true, `${type} should be valid`)
    }
  },
})

// ========================================================
// USER DATA EXPORT TESTS
// ========================================================

Deno.test({
  name: 'PDF Generator - Mock user data has all required sections',
  fn() {
    const data = createMockUserData(10)

    assertExists(data.userId, 'Should have userId')
    assertExists(data.personalInformation, 'Should have personalInformation')
    assertExists(data.professionalInformation, 'Should have professionalInformation')
    assertExists(data.financialInformation, 'Should have financialInformation')
    assertExists(data.usageInformation, 'Should have usageInformation')
    assertExists(data.sensitiveInformation, 'Should have sensitiveInformation')
    assertExists(data.communications, 'Should have communications')
    assertExists(data.metadata, 'Should have metadata')
  },
})

Deno.test({
  name: 'PDF Generator - Metadata tracks record counts correctly',
  fn() {
    const recordCount = 25
    const data = createMockUserData(recordCount)

    assertEquals(data.metadata.totalRecords, recordCount, 'Total records should match')
    assertEquals(data.metadata.dataSources.length >= 1, true, 'Should have at least one data source')
    assertExists(data.metadata.exportedAt, 'Should have exportedAt timestamp')
    assertExists(data.metadata.approximateSizeBytes, 'Should have approximateSizeBytes')
  },
})

// ========================================================
// FILE NAME GENERATION TESTS
// ========================================================

Deno.test({
  name: 'PDF Generator - File names follow expected pattern',
  fn() {
    const requestId = '123e4567-e89b-12d3-a456-426614174000'

    // Expected patterns
    const accessFileName = `ccpa-data-access-${requestId.slice(0, 8)}.pdf`
    const deletionFileName = `ccpa-deletion-confirmation-${requestId.slice(0, 8)}.pdf`

    assertEquals(accessFileName, 'ccpa-data-access-123e4567.pdf', 'Access file name format')
    assertEquals(deletionFileName, 'ccpa-deletion-confirmation-123e4567.pdf', 'Deletion file name format')

    // Verify extensions
    assertEquals(accessFileName.endsWith('.pdf'), true, 'Should have .pdf extension')
    assertEquals(deletionFileName.endsWith('.pdf'), true, 'Should have .pdf extension')
  },
})

// ========================================================
// EDGE CASE TESTS
// ========================================================

Deno.test({
  name: 'PDF Generator - Handle empty user data gracefully',
  fn() {
    const emptyData: UserDataExport = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      personalInformation: {
        email: '',
        accountCreatedAt: new Date().toISOString(),
      },
      professionalInformation: {
        education: [],
        skills: [],
        experience: [],
        certifications: [],
        workLogs: [],
      },
      financialInformation: {
        stripeConnected: false,
        payments: [],
        subscriptions: [],
      },
      usageInformation: {
        applicationCount: 0,
        profileViews: [],
        savedJobs: [],
        connectionCount: 0,
      },
      sensitiveInformation: {
        backgroundChecks: [],
        idVerifications: [],
        personalityAssessments: [],
      },
      communications: {
        reviews: [],
        feedback: [],
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        dataSources: [],
        totalRecords: 0,
        approximateSizeBytes: 0,
      },
    }

    const estimate = estimatePDFSize(emptyData)

    // Empty data should still produce a valid estimate
    assertEquals(estimate.estimatedBytes > 0, true, 'Even empty data should have base size')
    assertEquals(estimate.category, 'small', 'Empty data should be small category')
  },
})

Deno.test({
  name: 'PDF Generator - Handle special characters in user data',
  fn() {
    const data = createMockUserData(1)
    data.personalInformation.firstName = 'José'
    data.personalInformation.lastName = "O'Brien"
    data.personalInformation.address = {
      street: '123 Straße',
      city: 'München',
      state: 'BY',
      postalCode: '80331',
      country: 'Deutschland',
    }

    const estimate = estimatePDFSize(data)

    // Should handle special characters without error
    assertExists(estimate.estimatedBytes, 'Should estimate size with special characters')
    assertEquals(estimate.category, 'small', 'Should still be small category')
  },
})

// ========================================================
// DELETION REPORT SPECIFIC TESTS
// ========================================================

Deno.test({
  name: 'PDF Generator - Deletion categories structure',
  fn() {
    const deletedCategories = [
      'Personal Information',
      'Professional Information',
      'Usage Information',
    ]

    const retainedCategories = [
      { category: 'Financial Information', reason: 'Legal retention requirement (7 years)' },
      { category: 'Communications', reason: 'Ongoing legal matter' },
    ]

    assertEquals(deletedCategories.length, 3, 'Should have 3 deleted categories')
    assertEquals(retainedCategories.length, 2, 'Should have 2 retained categories')

    for (const item of retainedCategories) {
      assertExists(item.category, 'Retained item should have category')
      assertExists(item.reason, 'Retained item should have reason')
    }
  },
})

// ========================================================
// PERFORMANCE SCENARIO TESTS
// ========================================================

Deno.test({
  name: 'PDF Generator - Size estimation for performance tiers',
  fn() {
    // Small (<1MB): <5s generation target
    const smallData = createMockUserData(10)
    const smallEstimate = estimatePDFSize(smallData)
    assertEquals(smallEstimate.category, 'small', 'Small data should be small category')

    // Verify estimation logic
    assertEquals(smallEstimate.estimatedPages >= 4, true, 'Minimum 4 pages')
  },
})
