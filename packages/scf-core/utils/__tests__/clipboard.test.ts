import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock expo-clipboard
vi.mock('expo-clipboard', () => ({
  setStringAsync: vi.fn(),
  getStringAsync: vi.fn(),
}))

// Mock react-native Platform
vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}))

import * as ExpoClipboard from 'expo-clipboard'
import { Platform } from 'react-native'

import { copyToClipboard, getFromClipboard } from '../clipboard'

describe('clipboard utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset Platform to web for each test
    ;(Platform as any).OS = 'web'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('copyToClipboard', () => {
    it('returns false and warns when given empty text', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = await copyToClipboard('')
      expect(result).toBe(false)
      expect(warnSpy).toHaveBeenCalledWith('copyToClipboard: Empty text provided')
    })

    describe('web platform', () => {
      beforeEach(() => {
        ;(Platform as any).OS = 'web'
      })

      it('copies text using navigator.clipboard.writeText', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.assign(navigator, { clipboard: { writeText, readText: vi.fn() } })

        const result = await copyToClipboard('hello')
        expect(result).toBe(true)
        expect(writeText).toHaveBeenCalledWith('hello')
      })

      it('returns false when navigator.clipboard.writeText rejects', async () => {
        const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'))
        Object.assign(navigator, { clipboard: { writeText, readText: vi.fn() } })
        vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await copyToClipboard('hello')
        expect(result).toBe(false)
      })

      it('falls back to document.execCommand when navigator.clipboard is unavailable', async () => {
        Object.assign(navigator, { clipboard: undefined })
        document.execCommand = vi.fn().mockReturnValue(true)
        const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => el)
        const removeChild = vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el)

        const result = await copyToClipboard('fallback text')
        expect(result).toBe(true)
        expect(document.execCommand).toHaveBeenCalledWith('copy')
        expect(appendChild).toHaveBeenCalled()
        expect(removeChild).toHaveBeenCalled()
      })

      it('returns false when the fallback execCommand fails', async () => {
        Object.assign(navigator, { clipboard: undefined })
        document.execCommand = vi.fn().mockReturnValue(false)
        vi.spyOn(document.body, 'appendChild').mockImplementation((el) => el)
        vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el)

        const result = await copyToClipboard('fallback text')
        expect(result).toBe(false)
      })

      it('returns false when the fallback execCommand throws', async () => {
        Object.assign(navigator, { clipboard: undefined })
        document.execCommand = vi.fn().mockImplementation(() => {
          throw new Error('execCommand error')
        })
        vi.spyOn(document.body, 'appendChild').mockImplementation((el) => el)
        vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el)
        vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await copyToClipboard('fallback text')
        expect(result).toBe(false)
      })
    })

    describe('native platform', () => {
      beforeEach(() => {
        ;(Platform as any).OS = 'ios'
      })

      it('copies text using ExpoClipboard.setStringAsync', async () => {
        vi.mocked(ExpoClipboard.setStringAsync).mockResolvedValue(undefined as any)

        const result = await copyToClipboard('native text')
        expect(result).toBe(true)
        expect(ExpoClipboard.setStringAsync).toHaveBeenCalledWith('native text')
      })

      it('returns false when ExpoClipboard.setStringAsync is not a function', async () => {
        const original = ExpoClipboard.setStringAsync
        ;(ExpoClipboard as any).setStringAsync = 'not a function'
        vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await copyToClipboard('native text')
        expect(result).toBe(false)

        ;(ExpoClipboard as any).setStringAsync = original
      })

      it('returns false when ExpoClipboard.setStringAsync rejects', async () => {
        vi.mocked(ExpoClipboard.setStringAsync).mockRejectedValue(new Error('fail'))
        vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await copyToClipboard('native text')
        expect(result).toBe(false)
      })
    })
  })

  describe('getFromClipboard', () => {
    describe('web platform', () => {
      beforeEach(() => {
        ;(Platform as any).OS = 'web'
      })

      it('reads text using navigator.clipboard.readText', async () => {
        const readText = vi.fn().mockResolvedValue('clipboard content')
        Object.assign(navigator, { clipboard: { readText, writeText: vi.fn() } })

        const result = await getFromClipboard()
        expect(result).toBe('clipboard content')
      })

      it('returns empty string when navigator.clipboard is unavailable', async () => {
        Object.assign(navigator, { clipboard: undefined })

        const result = await getFromClipboard()
        expect(result).toBe('')
      })

      it('returns empty string when readText rejects', async () => {
        const readText = vi.fn().mockRejectedValue(new Error('denied'))
        Object.assign(navigator, { clipboard: { readText, writeText: vi.fn() } })
        vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await getFromClipboard()
        expect(result).toBe('')
      })
    })

    describe('native platform', () => {
      beforeEach(() => {
        ;(Platform as any).OS = 'ios'
      })

      it('reads text using ExpoClipboard.getStringAsync', async () => {
        vi.mocked(ExpoClipboard.getStringAsync).mockResolvedValue('native clipboard')

        const result = await getFromClipboard()
        expect(result).toBe('native clipboard')
      })

      it('returns empty string when getStringAsync is not a function', async () => {
        const original = ExpoClipboard.getStringAsync
        ;(ExpoClipboard as any).getStringAsync = 'not a function'
        vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await getFromClipboard()
        expect(result).toBe('')

        ;(ExpoClipboard as any).getStringAsync = original
      })
    })
  })
})
