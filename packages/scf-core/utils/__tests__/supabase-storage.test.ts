import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getAvatarUrl,
  getStorageUrl,
} from '../supabase/storage'

const originalSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL

describe('supabase storage helpers', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = originalSupabaseUrl
  })

  it('returns null for empty avatar path', () => {
    expect(getAvatarUrl('')).toBeNull()
    expect(getAvatarUrl(null)).toBeNull()
  })

  it('returns avatar URL unchanged when already absolute', () => {
    expect(getAvatarUrl('https://cdn.example.com/avatar.png')).toBe(
      'https://cdn.example.com/avatar.png',
    )
  })

  it('builds avatar URL using environment when path provided', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://supabase.example.com'
    expect(getAvatarUrl('user/avatar.png')).toBe(
      'https://supabase.example.com/storage/v1/object/public/avatars/user/avatar.png',
    )
  })

  it('logs error and returns null when env missing for avatar', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env.EXPO_PUBLIC_SUPABASE_URL = ''
    expect(getAvatarUrl('user/avatar.png')).toBeNull()
    expect(errorSpy).toHaveBeenCalledWith('EXPO_PUBLIC_SUPABASE_URL is not set')
  })

  it('returns null for invalid storage arguments', () => {
    expect(getStorageUrl('', 'file.png')).toBeNull()
    expect(getStorageUrl('bucket', '')).toBeNull()
    expect(getStorageUrl('bucket', null)).toBeNull()
  })

  it('returns storage URL unchanged when already absolute', () => {
    expect(getStorageUrl('bucket', 'https://cdn.example.com/file.png')).toBe(
      'https://cdn.example.com/file.png',
    )
  })

  it('builds storage URLs for provided bucket and file', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://supabase.example.com'
    expect(getStorageUrl('bucket', 'file.png')).toBe(
      'https://supabase.example.com/storage/v1/object/public/bucket/file.png',
    )
  })

  it('returns null when storage URL is missing environment variable', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env.EXPO_PUBLIC_SUPABASE_URL = ''
    expect(getStorageUrl('bucket', 'file.png')).toBeNull()
    expect(errorSpy).toHaveBeenCalledWith('EXPO_PUBLIC_SUPABASE_URL is not set')
  })
})

