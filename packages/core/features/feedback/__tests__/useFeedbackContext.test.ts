import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dimensions, Platform, type ScaledSize } from 'react-native'

import { useFeedbackContext } from '../hooks/useFeedbackContext'

vi.mock('ua-parser-js', () => ({
  default: class {
    getBrowser() {
      return { name: 'TestBrowser', version: '123.0' }
    }
    getOS() {
      return { name: 'TestOS', version: '1.0' }
    }
  },
}))

vi.mock('@app/core/utils/usePathname', () => ({
  usePathname: () => '/dashboard/home',
}))

describe('useFeedbackContext', () => {
  const originalPlatform = Platform.OS
  const originalGet = Dimensions.get
  const originalInnerWidth = window.innerWidth
  const originalInnerHeight = window.innerHeight
  const originalScreen = window.screen
  const originalUserAgent = navigator.userAgent
  const originalTitle = document.title

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => originalPlatform,
    })
    Dimensions.get = originalGet

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    })
    Object.defineProperty(window, 'screen', {
      configurable: true,
      value: originalScreen,
    })
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    })
    document.title = originalTitle
  })

  it('captures browser information on web', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    })

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1440,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    })
    Object.defineProperty(window, 'screen', {
      configurable: true,
      value: { width: 1920, height: 1080 },
    })

    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser/100.0',
    })

    document.title = 'Dashboard - Home'

    const { result } = renderHook(() => useFeedbackContext())

    expect(result.current.pageUrl).toBe('/dashboard/home')
    expect(result.current.pageTitle).toBe('Dashboard - Home')
    expect(result.current.userAgent).toContain('TestBrowser')
    expect(result.current.browserName).toBe('TestBrowser')
    expect(result.current.screenResolution).toBe('1920x1080')
    expect(result.current.viewportSize).toBe('1440x900')
  })

  it('captures native device information', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    })

    const screenSize: ScaledSize = {
      width: 1170,
      height: 2532,
      scale: 3,
      fontScale: 3,
    }
    const windowSize: ScaledSize = {
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 3,
    }

    Dimensions.get = (
      vi.fn<[('screen' | 'window')], ScaledSize>((type: 'screen' | 'window') =>
        type === 'screen' ? screenSize : windowSize,
      ) as unknown
    ) as typeof Dimensions.get

    const { result } = renderHook(() => useFeedbackContext('Dashboard Native'))

    expect(result.current.pageTitle).toBe('Dashboard Native')
    expect(result.current.operatingSystem).toBe('ios')
    expect(result.current.screenResolution).toBe('1170x2532')
    expect(result.current.viewportSize).toBe('1024x768')
    expect(result.current.browserName).toBe('in-app')
  })
})


