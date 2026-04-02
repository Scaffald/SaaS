import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

import AsyncStorage from '@react-native-async-storage/async-storage'

import { clearSessionId, getOrCreateSessionId } from '../sessionId'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('sessionId utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getOrCreateSessionId', () => {
    it('returns the existing session ID from storage when present', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue('existing-session-id')

      const result = await getOrCreateSessionId()
      expect(result).toBe('existing-session-id')
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@scaffald:session_id')
      expect(AsyncStorage.setItem).not.toHaveBeenCalled()
    })

    it('generates and stores a new UUID when no session ID exists', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined)

      const result = await getOrCreateSessionId()
      expect(result).toMatch(UUID_V4_REGEX)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@scaffald:session_id', result)
    })

    it('generates a valid UUID v4 format', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined)

      const result = await getOrCreateSessionId()
      // UUID v4: 8-4-4-4-12 hex digits, version nibble is 4, variant bits are 8/9/a/b
      expect(result).toMatch(UUID_V4_REGEX)
      expect(result).toHaveLength(36)
    })

    it('returns a temporary UUID when AsyncStorage.getItem fails', async () => {
      vi.mocked(AsyncStorage.getItem).mockRejectedValue(new Error('storage error'))
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await getOrCreateSessionId()
      expect(result).toMatch(UUID_V4_REGEX)
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to access AsyncStorage for session ID:',
        expect.any(Error),
      )
    })

    it('returns a temporary UUID when AsyncStorage.setItem fails', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockRejectedValue(new Error('write error'))
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await getOrCreateSessionId()
      expect(result).toMatch(UUID_V4_REGEX)
    })

    it('produces unique IDs on successive calls without storage', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined)

      const id1 = await getOrCreateSessionId()
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      const id2 = await getOrCreateSessionId()

      expect(id1).not.toBe(id2)
    })
  })

  describe('clearSessionId', () => {
    it('removes the session ID from storage', async () => {
      vi.mocked(AsyncStorage.removeItem).mockResolvedValue(undefined)

      await clearSessionId()
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@scaffald:session_id')
    })

    it('handles AsyncStorage errors gracefully', async () => {
      vi.mocked(AsyncStorage.removeItem).mockRejectedValue(new Error('remove error'))
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Should not throw
      await expect(clearSessionId()).resolves.toBeUndefined()
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to clear session ID:',
        expect.any(Error),
      )
    })
  })
})
