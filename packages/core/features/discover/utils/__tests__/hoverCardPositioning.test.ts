import { describe, expect, it } from 'vitest'
import {
  computeHoverCardPadding,
  isPinNearViewportEdge,
} from '../hoverCardPositioning'

describe('computeHoverCardPadding', () => {
  it('returns base padding when viewport unavailable', () => {
    const padding = computeHoverCardPadding(null, { horizontal: 220, vertical: 200 })
    expect(padding).toEqual({ horizontal: 220, vertical: 200 })
  })

  it('clamps padding based on viewport size', () => {
    const padding = computeHoverCardPadding(
      { width: 300, height: 260 },
      { horizontal: 220, vertical: 220 }
    )
    expect(padding.horizontal).toBeLessThanOrEqual(220)
    expect(padding.vertical).toBeLessThanOrEqual(220)
    expect(padding.horizontal).toBeGreaterThanOrEqual(80)
    expect(padding.vertical).toBeGreaterThanOrEqual(80)
  })
})

describe('isPinNearViewportEdge', () => {
  const viewport = { width: 800, height: 600 }
  const padding = { horizontal: 220, vertical: 200 }

  it('returns false when pin has safe margin', () => {
    const result = isPinNearViewportEdge({ x: 400, y: 300 }, viewport, padding)
    expect(result).toBe(false)
  })

  it('detects pins near horizontal edge', () => {
    const result = isPinNearViewportEdge({ x: 50, y: 300 }, viewport, padding)
    expect(result).toBe(true)
  })

  it('detects pins near vertical edge', () => {
    const result = isPinNearViewportEdge({ x: 400, y: 50 }, viewport, padding)
    expect(result).toBe(true)
  })
})

