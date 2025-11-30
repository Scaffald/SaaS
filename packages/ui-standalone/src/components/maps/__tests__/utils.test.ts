import { describe, expect, it } from 'vitest'
import type { ViewportBounds } from '../types'
import { extractViewportBounds } from '../utils'

describe('extractViewportBounds', () => {
  it('extracts viewport bounds from a map instance', () => {
    const mockBounds = {
      getNorth: () => 42.3736,
      getSouth: () => 42.3389,
      getEast: () => -71.0328,
      getWest: () => -71.0958,
    }

    const mockMap = {
      getBounds: () => mockBounds,
    }

    const result = extractViewportBounds(mockMap as any)

    expect(result).toEqual({
      north: 42.3736,
      south: 42.3389,
      east: -71.0328,
      west: -71.0958,
    })
  })

  it('handles bounds crossing the international date line', () => {
    // Test case for bounds that cross 180/-180 longitude
    const mockBounds = {
      getNorth: () => 45.0,
      getSouth: () => 40.0,
      getEast: () => 179.0,
      getWest: () => -179.0,
    }

    const mockMap = {
      getBounds: () => mockBounds,
    }

    const result = extractViewportBounds(mockMap as any)

    expect(result).toEqual({
      north: 45.0,
      south: 40.0,
      east: 179.0,
      west: -179.0,
    })
  })

  it('handles bounds at the equator', () => {
    const mockBounds = {
      getNorth: () => 1.0,
      getSouth: () => -1.0,
      getEast: () => 1.0,
      getWest: () => -1.0,
    }

    const mockMap = {
      getBounds: () => mockBounds,
    }

    const result = extractViewportBounds(mockMap as any)

    expect(result).toEqual({
      north: 1.0,
      south: -1.0,
      east: 1.0,
      west: -1.0,
    })
  })

  it('handles bounds at the poles', () => {
    const mockBounds = {
      getNorth: () => 90.0,
      getSouth: () => 89.0,
      getEast: () => 180.0,
      getWest: () => -180.0,
    }

    const mockMap = {
      getBounds: () => mockBounds,
    }

    const result = extractViewportBounds(mockMap as any)

    expect(result).toEqual({
      north: 90.0,
      south: 89.0,
      east: 180.0,
      west: -180.0,
    })
  })

  it('handles very small viewport bounds', () => {
    const mockBounds = {
      getNorth: () => 42.3601,
      getSouth: () => 42.36,
      getEast: () => -71.0589,
      getWest: () => -71.059,
    }

    const mockMap = {
      getBounds: () => mockBounds,
    }

    const result = extractViewportBounds(mockMap as any)

    expect(result).toEqual({
      north: 42.3601,
      south: 42.36,
      east: -71.0589,
      west: -71.059,
    })
  })

  it('handles very large viewport bounds', () => {
    const mockBounds = {
      getNorth: () => 50.0,
      getSouth: () => 25.0,
      getEast: () => -65.0,
      getWest: () => -125.0,
    }

    const mockMap = {
      getBounds: () => mockBounds,
    }

    const result = extractViewportBounds(mockMap as any)

    expect(result).toEqual({
      north: 50.0,
      south: 25.0,
      east: -65.0,
      west: -125.0,
    })
  })

  it('returns correct ViewportBounds type', () => {
    const mockBounds = {
      getNorth: () => 42.3736,
      getSouth: () => 42.3389,
      getEast: () => -71.0328,
      getWest: () => -71.0958,
    }

    const mockMap = {
      getBounds: () => mockBounds,
    }

    const result = extractViewportBounds(mockMap as any)

    // Type check: result should match ViewportBounds interface
    const typedResult: ViewportBounds = result
    expect(typedResult).toHaveProperty('north')
    expect(typedResult).toHaveProperty('south')
    expect(typedResult).toHaveProperty('east')
    expect(typedResult).toHaveProperty('west')
    expect(typeof typedResult.north).toBe('number')
    expect(typeof typedResult.south).toBe('number')
    expect(typeof typedResult.east).toBe('number')
    expect(typeof typedResult.west).toBe('number')
  })

  it('throws error when map bounds are null', () => {
    const mockMap = {
      getBounds: () => null,
    }

    expect(() => extractViewportBounds(mockMap as any)).toThrow('Map bounds are not available')
  })
})
