/**
 * Media Queries Configuration Test
 *
 * Tests that responsive media queries are properly configured
 * and available for use in Tamagui components.
 */

import { describe, it, expect } from 'vitest'
import { tamaguiConfig } from '../tamagui.config'

describe('Media Queries Configuration', () => {
  it('should have media configuration defined', () => {
    expect(tamaguiConfig.media).toBeDefined()
  })

  it('should include gtSm media query', () => {
    expect(tamaguiConfig.media).toHaveProperty('gtSm')
    expect(tamaguiConfig.media.gtSm).toEqual({ minWidth: 801 })
  })

  it('should include gtMd media query', () => {
    expect(tamaguiConfig.media).toHaveProperty('gtMd')
    expect(tamaguiConfig.media.gtMd).toEqual({ minWidth: 1021 })
  })

  it('should include gtLg media query', () => {
    expect(tamaguiConfig.media).toHaveProperty('gtLg')
    expect(tamaguiConfig.media.gtLg).toEqual({ minWidth: 1281 })
  })

  it('should include gtXl media query', () => {
    expect(tamaguiConfig.media).toHaveProperty('gtXl')
    expect(tamaguiConfig.media.gtXl).toEqual({ minWidth: 1421 })
  })

  it('should include xs media query', () => {
    expect(tamaguiConfig.media).toHaveProperty('xs')
    expect(tamaguiConfig.media.xs).toEqual({ maxWidth: 660 })
  })

  it('should include sm media query', () => {
    expect(tamaguiConfig.media).toHaveProperty('sm')
    expect(tamaguiConfig.media.sm).toEqual({ maxWidth: 800 })
  })

  it('should include md media query', () => {
    expect(tamaguiConfig.media).toHaveProperty('md')
    expect(tamaguiConfig.media.md).toEqual({ maxWidth: 1020 })
  })

  it('should include lg media query', () => {
    expect(tamaguiConfig.media).toHaveProperty('lg')
    expect(tamaguiConfig.media.lg).toEqual({ maxWidth: 1280 })
  })

  it('should include all expected media query keys', () => {
    const expectedKeys = [
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
      'xxl',
      'gtXs',
      'gtSm',
      'gtMd',
      'gtLg',
      'gtXl',
      'gtXxl',
      'short',
      'tall',
      'hoverNone',
      'pointerCoarse',
    ]

    expectedKeys.forEach((key) => {
      expect(tamaguiConfig.media).toHaveProperty(key)
    })
  })
})
