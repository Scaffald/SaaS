import { describe, expect, it } from 'vitest'

import { detectMimeTypeFromSrc, getNativeTransform, getWebTransform } from '../utils/helpers'

describe('AvatarCropModal helpers', () => {
  it('detects mime type from data URL', () => {
    expect(detectMimeTypeFromSrc('data:image/png;base64,abcd')).toEqual('image/png')
  })

  it('falls back to jpg when no mime header is present', () => {
    expect(detectMimeTypeFromSrc('avatar-file.JPG')).toEqual('image/jpeg')
    expect(detectMimeTypeFromSrc('avatar-file.webp')).toEqual('image/webp')
    expect(detectMimeTypeFromSrc('avatar-file.png')).toEqual('image/png')
  })

  it('returns undefined transform for web when no flips applied', () => {
    expect(getWebTransform(100, 100, false, false)).toBeUndefined()
  })

  it('computes web transform string when flips are active', () => {
    expect(getWebTransform(100, 120, true, false)).toContain('scaleX(-1)')
    expect(getWebTransform(80, 60, false, true)).toContain('scaleY(-1)')
  })

  it('generates native transform instructions', () => {
    const horizontal = getNativeTransform(100, 120, true, false)
    expect(horizontal).toEqual(
      expect.arrayContaining([{ translateX: 100 }, { scaleX: -1 }, { scaleY: 1 }])
    )

    const vertical = getNativeTransform(80, 60, false, true)
    expect(vertical).toEqual(
      expect.arrayContaining([{ translateY: 60 }, { scaleX: 1 }, { scaleY: -1 }])
    )
  })
})
