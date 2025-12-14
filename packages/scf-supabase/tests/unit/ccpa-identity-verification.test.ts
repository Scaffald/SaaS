/// <reference lib="deno.ns" />

/**
 * Identity Verification Unit Tests
 *
 * Tests the CCPA identity verification utility functions:
 * - OTP generation
 * - Token generation
 * - Expiry calculations
 * - Verification status checks
 */

import {
  assertEquals,
  assertNotEquals,
} from '../shared/assert.ts'

import {
  generateOTP,
  generateVerificationToken,
  calculateOTPExpiry,
  isVerificationExpired,
} from '../../functions/trpc/routers/ccpa/identity-verification.ts'

// ========================================================
// OTP GENERATION TESTS
// ========================================================

Deno.test({
  name: 'Identity Verification - Generate 6-digit OTP',
  fn() {
    const otp = generateOTP()

    assertEquals(otp.length, 6, 'OTP should be 6 characters')
    assertEquals(/^\d{6}$/.test(otp), true, 'OTP should contain only digits')
  },
})

Deno.test({
  name: 'Identity Verification - Generate custom length OTP',
  fn() {
    const otp4 = generateOTP(4)
    const otp8 = generateOTP(8)

    assertEquals(otp4.length, 4, 'OTP should be 4 characters')
    assertEquals(otp8.length, 8, 'OTP should be 8 characters')
    assertEquals(/^\d{4}$/.test(otp4), true, 'OTP should contain only digits')
    assertEquals(/^\d{8}$/.test(otp8), true, 'OTP should contain only digits')
  },
})

Deno.test({
  name: 'Identity Verification - OTPs are unique',
  fn() {
    const otps = new Set<string>()

    // Generate 100 OTPs and check for uniqueness
    for (let i = 0; i < 100; i++) {
      otps.add(generateOTP())
    }

    // With 6-digit OTPs, collisions in 100 samples should be extremely rare
    // but we allow for a couple
    assertEquals(otps.size >= 95, true, 'Most OTPs should be unique')
  },
})

// ========================================================
// VERIFICATION TOKEN TESTS
// ========================================================

Deno.test({
  name: 'Identity Verification - Generate verification token',
  fn() {
    const token = generateVerificationToken()

    assertEquals(token.length, 32, 'Token should be 32 characters')
    assertEquals(/^[A-Za-z0-9]+$/.test(token), true, 'Token should be alphanumeric')
  },
})

Deno.test({
  name: 'Identity Verification - Tokens are unique',
  fn() {
    const token1 = generateVerificationToken()
    const token2 = generateVerificationToken()

    assertNotEquals(token1, token2, 'Tokens should be unique')
  },
})

// ========================================================
// EXPIRY CALCULATION TESTS
// ========================================================

Deno.test({
  name: 'Identity Verification - Calculate default OTP expiry (15 minutes)',
  fn() {
    const now = new Date()
    const expiry = calculateOTPExpiry()

    const diffMinutes = (expiry.getTime() - now.getTime()) / (1000 * 60)

    // Should be approximately 15 minutes (allow 1 minute tolerance for test execution)
    assertEquals(diffMinutes >= 14, true, 'Expiry should be at least 14 minutes from now')
    assertEquals(diffMinutes <= 16, true, 'Expiry should be at most 16 minutes from now')
  },
})

Deno.test({
  name: 'Identity Verification - Calculate custom expiry',
  fn() {
    const now = new Date()
    const expiry30 = calculateOTPExpiry(30)

    const diffMinutes = (expiry30.getTime() - now.getTime()) / (1000 * 60)

    assertEquals(diffMinutes >= 29, true, 'Expiry should be at least 29 minutes from now')
    assertEquals(diffMinutes <= 31, true, 'Expiry should be at most 31 minutes from now')
  },
})

// ========================================================
// EXPIRY CHECK TESTS
// ========================================================

Deno.test({
  name: 'Identity Verification - Check if verification is expired (Date object)',
  fn() {
    const pastDate = new Date(Date.now() - 60000) // 1 minute ago
    const futureDate = new Date(Date.now() + 60000) // 1 minute from now

    assertEquals(isVerificationExpired(pastDate), true, 'Past date should be expired')
    assertEquals(isVerificationExpired(futureDate), false, 'Future date should not be expired')
  },
})

Deno.test({
  name: 'Identity Verification - Check if verification is expired (ISO string)',
  fn() {
    const pastDateStr = new Date(Date.now() - 60000).toISOString()
    const futureDateStr = new Date(Date.now() + 60000).toISOString()

    assertEquals(isVerificationExpired(pastDateStr), true, 'Past date string should be expired')
    assertEquals(isVerificationExpired(futureDateStr), false, 'Future date string should not be expired')
  },
})

Deno.test({
  name: 'Identity Verification - Edge case: exactly now',
  fn() {
    const now = new Date()

    // Should be expired if it's exactly now (no time remaining)
    assertEquals(isVerificationExpired(now), true, 'Current time should be considered expired')
  },
})

// ========================================================
// INTEGRATION SCENARIO TESTS
// ========================================================

Deno.test({
  name: 'Identity Verification - Full email verification flow simulation',
  fn() {
    // Simulate the flow:
    // 1. Generate OTP
    const otp = generateOTP()
    assertEquals(otp.length, 6, 'OTP should be generated')

    // 2. Calculate expiry
    const expiry = calculateOTPExpiry(15)
    assertEquals(isVerificationExpired(expiry), false, 'Fresh expiry should not be expired')

    // 3. Store and verify later
    const storedOTP = otp
    const userInput = otp
    assertEquals(storedOTP === userInput, true, 'Valid OTP should match')

    // 4. Invalid input should fail
    const invalidInput = '000000'
    assertEquals(storedOTP === invalidInput, false, 'Invalid OTP should not match')
  },
})

Deno.test({
  name: 'Identity Verification - Full enhanced verification flow simulation',
  fn() {
    // Simulate enhanced verification:
    // 1. Generate token
    const token = generateVerificationToken()
    assertEquals(token.length, 32, 'Token should be generated')

    // 2. Calculate longer expiry (30 minutes)
    const expiry = calculateOTPExpiry(30)
    assertEquals(isVerificationExpired(expiry), false, 'Fresh expiry should not be expired')

    // 3. Verify token
    const storedToken = token
    const providedToken = token
    assertEquals(storedToken === providedToken, true, 'Valid token should match')

    // 4. Invalid token should fail
    const invalidToken = 'invalid-token-12345678901234567890'
    assertEquals(storedToken === invalidToken, false, 'Invalid token should not match')
  },
})
