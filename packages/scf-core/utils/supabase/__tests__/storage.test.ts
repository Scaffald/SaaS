import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { getAvatarUrl, getCMSMediaUrl, getStorageUrl } from '../storage'

const SUPABASE_URL = 'https://supabase.test'

describe('supabase storage url helpers', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = SUPABASE_URL
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAvatarUrl', () => {
    it('returns null for missing or empty paths', () => {
      expect(getAvatarUrl(null)).toBeNull()
      expect(getAvatarUrl('')).toBeNull()
      expect(getAvatarUrl('   ')).toBeNull()
    })

    it('returns fully-qualified URLs unchanged', () => {
      const url = 'https://images.example.com/avatar.jpg'
      expect(getAvatarUrl(url)).toBe(url)
    })

    it('builds URLs when a path and env are present', () => {
      expect(getAvatarUrl('user-123/avatar.jpg')).toBe(
        `${SUPABASE_URL}/storage/v1/object/public/avatars/user-123/avatar.jpg`,
      )
    })

    it('logs and returns null when env var is missing', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      delete process.env.EXPO_PUBLIC_SUPABASE_URL

      expect(getAvatarUrl('avatar.jpg')).toBeNull()
      expect(errorSpy).toHaveBeenCalledWith('EXPO_PUBLIC_SUPABASE_URL is not set')
    })
  })

  describe('getStorageUrl', () => {
    it('returns null for invalid bucket or file path', () => {
      expect(getStorageUrl('', 'file.pdf')).toBeNull()
      expect(getStorageUrl('public', null)).toBeNull()
      expect(getStorageUrl('public', '   ')).toBeNull()
    })

    it('returns fully-qualified URLs unchanged', () => {
      const url = 'https://cdn.example.com/public/file.pdf'
      expect(getStorageUrl('public', url)).toBe(url)
    })

    it('constructs URLs when bucket and path are provided', () => {
      expect(getStorageUrl('documents', 'reports/file.pdf')).toBe(
        `${SUPABASE_URL}/storage/v1/object/public/documents/reports/file.pdf`,
      )
    })

    it('logs and returns null when base url is unavailable', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      delete process.env.EXPO_PUBLIC_SUPABASE_URL

      expect(getStorageUrl('public', 'file.pdf')).toBeNull()
      expect(errorSpy).toHaveBeenCalledWith('EXPO_PUBLIC_SUPABASE_URL is not set')
    })
  })

  describe('getCMSMediaUrl', () => {
    it('returns null for empty media paths', () => {
      expect(getCMSMediaUrl(undefined)).toBeNull()
      expect(getCMSMediaUrl('')).toBeNull()
    })

    it('returns fully-qualified URLs unchanged', () => {
      const url = 'https://cdn.example.com/media/file.mp4'
      expect(getCMSMediaUrl(url)).toBe(url)
    })

    it('delegates to storage helper for cms-media bucket', () => {
      expect(getCMSMediaUrl('welcome/slide.png')).toBe(
        `${SUPABASE_URL}/storage/v1/object/public/cms-media/welcome/slide.png`,
      )
    })
  })
})
