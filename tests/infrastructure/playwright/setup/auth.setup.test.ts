/**
 * Unit tests for auth setup functions
 * Tests the authFileIsValid() function and related utilities
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { mkdirSync, writeFileSync, unlinkSync, utimesSync } from 'fs'
import { authFileIsValid } from './setup/auth.setup'

describe('auth.setup.ts utilities', () => {
  const testAuthDir = 'tests/.auth/test'
  const testAuthFile = path.join(testAuthDir, 'test-auth.json')

  beforeEach(() => {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(testAuthDir)) {
      mkdirSync(testAuthDir, { recursive: true })
    }
  })

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testAuthFile)) {
      unlinkSync(testAuthFile)
    }
  })

  describe('authFileIsValid', () => {
    it('should return true for file less than 7 days old', () => {
      // Create a fresh file
      writeFileSync(testAuthFile, JSON.stringify({ test: 'data' }))
      
      // The file was just created, so it should be valid
      expect(authFileIsValid(testAuthFile)).toBe(true)
    })

    it('should return false for file more than 7 days old', () => {
      // Create a file
      writeFileSync(testAuthFile, JSON.stringify({ test: 'data' }))
      
      // Set the file's modification time to 8 days ago
      const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000)
      utimesSync(testAuthFile, new Date(eightDaysAgo), new Date(eightDaysAgo))
      
      // The file should be considered invalid (too old)
      expect(authFileIsValid(testAuthFile)).toBe(false)
    })

    it('should return false for missing file', () => {
      const missingFile = path.join(testAuthDir, 'missing.json')
      expect(authFileIsValid(missingFile)).toBe(false)
    })

    it('should handle invalid JSON gracefully', () => {
      // Create a file with invalid JSON
      writeFileSync(testAuthFile, 'invalid json content')
      
      // The file exists and is recent, so it should be valid
      // (authFileIsValid only checks age, not JSON validity)
      expect(authFileIsValid(testAuthFile)).toBe(true)
    })
  })

  describe('getSession helper integration', () => {
    it('should be able to import getSession from auth helper', async () => {
      // Test that we can import the function
      const { getSession } = await import('../../playwright-helpers/playwright-helpers/auth')
      expect(typeof getSession).toBe('function')
    })
  })

  describe('storage key generation', () => {
    it('should generate correct storage key for localhost Supabase', () => {
      const supabaseUrl = 'http://127.0.0.1:54321'
      const host = new URL(supabaseUrl).host.replace(/[.:]/g, '-')
      const storageKey = `sb-${host}-auth-token`
      
      expect(storageKey).toBe('sb-127-0-0-1-54321-auth-token')
    })

    it('should handle different Supabase URLs', () => {
      const supabaseUrl = 'https://example.supabase.co'
      const host = new URL(supabaseUrl).host.replace(/[.:]/g, '-')
      const storageKey = `sb-${host}-auth-token`
      
      expect(storageKey).toBe('sb-example-supabase-co-auth-token')
    })
  })
})

