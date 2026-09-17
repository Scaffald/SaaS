import { describe, expect, it } from 'vitest'
import { classifyViewport, VIEWPORT_SNAPSHOTS, viewportFromRequest } from '../utils/server-viewport'

const h = (o: Record<string, string>) => new Headers(o)

describe('classifyViewport (#782)', () => {
  it('trusts the client hint when Chromium sends one', () => {
    expect(classifyViewport(h({ 'sec-ch-ua-mobile': '?1', 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64)' }))).toBe('phone')
    expect(classifyViewport(h({ 'sec-ch-ua-mobile': '?0', 'user-agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126 Mobile Safari/537.36' }))).toBe('phone')
  })

  it('sniffs phones, tablets and desktops from the user agent', () => {
    expect(classifyViewport(h({ 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Version/17.5 Mobile/15E148 Safari/604.1' }))).toBe('phone')
    expect(classifyViewport(h({ 'user-agent': 'Mozilla/5.0 (Linux; Android 14; SM-S928B) Chrome/126.0 Mobile Safari/537.36' }))).toBe('phone')
    expect(classifyViewport(h({ 'user-agent': 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) Version/17.5 Safari/604.1' }))).toBe('tablet')
    expect(classifyViewport(h({ 'user-agent': 'Mozilla/5.0 (Linux; Android 14; SM-X910) Chrome/126.0 Safari/537.36' }))).toBe('tablet')
    expect(classifyViewport(h({ 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Chrome/126.0 Safari/537.36' }))).toBe('desktop')
    expect(classifyViewport(h({ 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }))).toBe('desktop')
  })

  it('defaults to desktop with no headers at all', () => {
    expect(classifyViewport(h({}))).toBe('desktop')
    expect(classifyViewport({})).toBe('desktop')
  })

  it('maps each class to a snapshot inside its breakpoint band', () => {
    expect(VIEWPORT_SNAPSHOTS.phone.width).toBeLessThan(800)
    expect(VIEWPORT_SNAPSHOTS.tablet.width).toBeGreaterThanOrEqual(800)
    expect(VIEWPORT_SNAPSHOTS.tablet.width).toBeLessThan(1280)
    expect(VIEWPORT_SNAPSHOTS.desktop.width).toBeGreaterThanOrEqual(1280)
  })

  it('reads the hint off a Request', () => {
    const req = new Request('https://scaffald.com/jobs', { headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)' } })
    expect(viewportFromRequest(req)).toEqual({ viewport: 'phone' })
  })
})
