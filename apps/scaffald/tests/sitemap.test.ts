import { describe, expect, test } from 'vitest'
import { renderSitemapIndex, renderUrlSet, type SitemapEntry } from '../utils/sitemap'

/**
 * Sitemaps are generated from user-controlled slugs, so the escaping matters:
 * a single unescaped `&` makes the whole document invalid and Search Console
 * rejects it silently.
 */

describe('renderUrlSet', () => {
  test('emits a valid urlset with all optional fields', () => {
    const entries: SitemapEntry[] = [
      {
        loc: 'https://scaffald.com/jobs/welder',
        lastmod: '2026-07-28',
        changefreq: 'daily',
        priority: 0.7,
      },
    ]
    const xml = renderUrlSet(entries)

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('<loc>https://scaffald.com/jobs/welder</loc>')
    expect(xml).toContain('<lastmod>2026-07-28</lastmod>')
    expect(xml).toContain('<changefreq>daily</changefreq>')
    expect(xml).toContain('<priority>0.7</priority>')
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true)
  })

  test('omits optional fields that were not provided', () => {
    const xml = renderUrlSet([{ loc: 'https://scaffald.com/' }])

    expect(xml).toContain('<loc>https://scaffald.com/</loc>')
    expect(xml).not.toContain('<lastmod>')
    expect(xml).not.toContain('<changefreq>')
    expect(xml).not.toContain('<priority>')
  })

  test('escapes XML metacharacters in slugs', () => {
    const xml = renderUrlSet([{ loc: 'https://scaffald.com/users/a&b<c>d"e\'f' }])

    expect(xml).toContain('&amp;')
    expect(xml).toContain('&lt;')
    expect(xml).toContain('&gt;')
    expect(xml).toContain('&quot;')
    expect(xml).toContain('&apos;')
    // No raw metacharacter may survive inside the element body.
    const body = xml.slice(xml.indexOf('<loc>') + 5, xml.indexOf('</loc>'))
    expect(body).not.toMatch(/[<>"']/)
    expect(body.replace(/&(amp|lt|gt|quot|apos);/g, '')).not.toContain('&')
  })

  test('handles an empty result set without producing broken XML', () => {
    const xml = renderUrlSet([])

    expect(xml).toContain('<urlset')
    expect(xml).toContain('</urlset>')
    expect(xml).not.toContain('<url>')
  })
})

describe('renderSitemapIndex', () => {
  test('lists each child sitemap as an absolute URL', () => {
    const xml = renderSitemapIndex(['/sitemap-pages.xml', '/sitemap-users.xml'])

    expect(xml).toContain('<sitemapindex')
    expect(xml.match(/<sitemap>/g)).toHaveLength(2)
    // Relative locs are invalid in a sitemap index.
    for (const loc of xml.match(/<loc>(.*?)<\/loc>/g) ?? []) {
      expect(loc).toMatch(/<loc>https?:\/\//)
    }
  })
})
