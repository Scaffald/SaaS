/**
 * Unified Platform utilities
 *
 * Provides a centralized API for platform-specific logic, reducing
 * scattered Platform.OS checks throughout the codebase.
 *
 * @example
 * ```tsx
 * import { Platform } from '@scaffald/ui'
 *
 * // Check platform
 * if (Platform.isWeb) {
 *   // Web-specific code
 * }
 *
 * // Select value based on platform
 * const shadow = Platform.select({
 *   web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
 *   native: { elevation: 2 },
 *   default: {},
 * })
 * ```
 */

import { Platform as RNPlatform } from 'react-native'

export type PlatformOS = 'ios' | 'android' | 'web' | 'windows' | 'macos'

export interface PlatformSelectOptions<T> {
  /** Value for web platform */
  web?: T
  /** Value for iOS platform */
  ios?: T
  /** Value for Android platform */
  android?: T
  /** Value for any native platform (iOS or Android) */
  native?: T
  /** Value for desktop platforms (Windows, macOS) */
  desktop?: T
  /** Default fallback value (required) */
  default: T
}

/**
 * Unified Platform API
 */
export const Platform = {
  /**
   * Current platform OS
   */
  OS: RNPlatform.OS as PlatformOS,

  /**
   * Platform version
   */
  Version: RNPlatform.Version,

  /**
   * Whether running on web (React Native Web)
   */
  isWeb: RNPlatform.OS === 'web',

  /**
   * Whether running on iOS
   */
  isIOS: RNPlatform.OS === 'ios',

  /**
   * Whether running on Android
   */
  isAndroid: RNPlatform.OS === 'android',

  /**
   * Whether running on any native platform (iOS or Android)
   */
  isNative: RNPlatform.OS !== 'web',

  /**
   * Whether running on a mobile platform (iOS or Android)
   */
  isMobile: RNPlatform.OS === 'ios' || RNPlatform.OS === 'android',

  /**
   * Whether running in a desktop environment
   */
  isDesktop: RNPlatform.OS === 'windows' || RNPlatform.OS === 'macos',

  /**
   * Select a value based on the current platform with fallback chain
   *
   * Priority order:
   * 1. Specific platform (ios, android, web)
   * 2. Category (native, desktop)
   * 3. Default
   *
   * @example
   * ```tsx
   * const style = Platform.select({
   *   ios: { shadowOpacity: 0.2 },
   *   android: { elevation: 4 },
   *   web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
   *   default: {},
   * })
   * ```
   */
  select: <T>(options: PlatformSelectOptions<T>): T => {
    const { web, ios, android, native, desktop, default: defaultValue } = options
    const os = RNPlatform.OS

    // First try specific platform
    if (os === 'web' && web !== undefined) return web
    if (os === 'ios' && ios !== undefined) return ios
    if (os === 'android' && android !== undefined) return android

    // Then try category
    if ((os === 'ios' || os === 'android') && native !== undefined) return native
    if ((os === 'windows' || os === 'macos') && desktop !== undefined) return desktop

    // Finally return default
    return defaultValue
  },

  /**
   * Check if running in SSR (server-side rendering) context
   */
  isSSR: typeof window === 'undefined',

  /**
   * Check if touch events are supported
   */
  isTouchDevice: (): boolean => {
    if (RNPlatform.OS !== 'web') return true
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  },

  /**
   * Check if the platform supports hover interactions
   */
  supportsHover: (): boolean => {
    if (RNPlatform.OS !== 'web') return false
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(hover: hover)').matches ?? true
  },

  /**
   * Check if the platform supports pointer events
   */
  supportsPointer: (): boolean => {
    if (RNPlatform.OS !== 'web') return false
    if (typeof window === 'undefined') return false
    return 'PointerEvent' in window
  },
} as const

/** Type for the Platform object */
export type PlatformType = typeof Platform
