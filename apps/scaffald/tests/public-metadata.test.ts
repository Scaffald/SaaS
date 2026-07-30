import { FAQ_TABS } from '@scf/core/features/marketing/content/faq'
import { describe, expect, test } from 'vitest'
import { extractPlainText, firstParam, truncate } from '../utils/public-content-loader'
import { OG_IMAGE } from '../utils/og'

/**
 * Contracts the public routes' metadata has to keep. These are the properties
 * that break silently — nothing crashes when an og:image URL goes relative or a
 * description balloons past what a crawler will show.
 */

describe('social card', () => {
  test('og:image is absolute — unfurlers ignore relative paths', () => {
    expect(OG_IMAGE.url).toMatch(/^https?:\/\//)
  })

  test('uses the dimensions every major unfurler expects', () => {
    expect(OG_IMAGE.width).toBe(1200)
    expect(OG_IMAGE.height).toBe(630)
    expect(OG_IMAGE.type).toBe('image/png')
  })

  test('carries alt text', () => {
    expect(OG_IMAGE.alt.length).toBeGreaterThan(10)
  })
})

describe('description helpers', () => {
  test('truncate keeps descriptions within a crawler-friendly length', () => {
    const out = truncate('x'.repeat(500), 200)

    expect(out.length).toBeLessThanOrEqual(200)
    expect(out.endsWith('…')).toBe(true)
  })

  test('truncate leaves short text untouched and unpadded', () => {
    expect(truncate('Short description.', 200)).toBe('Short description.')
  })

  test('truncate collapses whitespace so meta tags stay single-line', () => {
    expect(truncate('a\n\n  b\t c', 200)).toBe('a b c')
  })

  test('extractPlainText flattens rich-text JSON into indexable prose', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Weld carbon steel' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'AWS D1.1 required' }] },
      ],
    }

    const text = extractPlainText(doc)
    expect(text).toContain('Weld carbon steel')
    expect(text).toContain('AWS D1.1 required')
    expect(text).not.toContain('paragraph')
  })

  test('extractPlainText tolerates null, strings, and malformed nodes', () => {
    expect(extractPlainText(null)).toBe('')
    expect(extractPlainText(undefined)).toBe('')
    expect(extractPlainText('already text')).toBe('already text')
    expect(extractPlainText({ nonsense: true })).toBe('')
  })
})

describe('route params', () => {
  test('firstParam normalises expo-router catch-all arrays', () => {
    expect(firstParam('welder')).toBe('welder')
    expect(firstParam(['welder', 'ignored'])).toBe('welder')
    expect(firstParam(undefined)).toBeUndefined()
  })
})

describe('FAQ structured data', () => {
  test('every marked-up answer is real content, not a placeholder', () => {
    const entries = Object.values(FAQ_TABS).flat()

    expect(entries.length).toBeGreaterThan(0)
    for (const entry of entries) {
      expect(entry.q.trim().length).toBeGreaterThan(10)
      expect(entry.a.trim().length).toBeGreaterThan(20)
    }
  })

  test('questions are unique, so JSON-LD has no duplicate entities', () => {
    const questions = Object.values(FAQ_TABS)
      .flat()
      .map((e) => e.q)

    expect(new Set(questions).size).toBe(questions.length)
  })
})
