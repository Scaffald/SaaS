import { describe, expect, it } from 'vitest'

import {
  RESERVED_SLUGS,
  generateSlug,
  isReservedSlug,
  isSlugValid,
  normalizeSlug,
  suggestSlugVariations,
} from '../slugify'

describe('slugify utilities', () => {
  describe('generateSlug', () => {
    it('normalizes casing, whitespace, and special characters', () => {
      expect(generateSlug(' Senior Software Engineer @ Acme Inc. ')).toBe(
        'senior-software-engineer-acme-inc',
      )
    })

    it('caps the slug at 50 characters', () => {
      const longLabel = 'Full Stack Engineer with ten years of experience and certifications'
      expect(generateSlug(longLabel)).toHaveLength(50)
    })
  })

  describe('isSlugValid', () => {
    it('accepts slugs that meet all formatting requirements', () => {
      expect(isSlugValid('john-doe')).toBe(true)
    })

    it('rejects values that violate validation rules', () => {
      expect(isSlugValid('')).toBe(false)
      expect(isSlugValid('a'.repeat(2))).toBe(false)
      expect(isSlugValid('a'.repeat(51))).toBe(false)
      expect(isSlugValid('john__doe')).toBe(false)
      expect(isSlugValid('-john-doe-')).toBe(false)
      expect(isSlugValid('john--doe')).toBe(false)
    })

    it('treats reserved words as invalid options', () => {
      expect(isSlugValid(RESERVED_SLUGS[0])).toBe(false)
    })
  })

  describe('isReservedSlug', () => {
    it('performs a case-insensitive lookup', () => {
      expect(isReservedSlug('Admin')).toBe(true)
      expect(isReservedSlug('unique-handle')).toBe(false)
    })
  })

  describe('normalizeSlug', () => {
    it('returns a valid slug when normalization succeeds', () => {
      expect(normalizeSlug('John Doe')).toBe('john-doe')
    })

    it('falls back to an empty string when slug cannot be normalized', () => {
      expect(normalizeSlug('@@@')).toBe('')
    })
  })

  describe('suggestSlugVariations', () => {
    it('returns unique suggestions not present in the existing set', () => {
      const suggestions = suggestSlugVariations('john-doe', ['john-doe', 'john-doe-2'], 3)

      expect(suggestions).toHaveLength(3)
      suggestions.forEach((candidate) => {
        expect(candidate).not.toBe('john-doe')
        expect(['john-doe', 'john-doe-2']).not.toContain(candidate)
        expect(isSlugValid(candidate)).toBe(true)
      })
    })
  })
})

