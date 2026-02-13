/**
 * usePlatform hook
 * React hook for platform detection with additional runtime checks
 *
 * @example
 * ```tsx
 * import { usePlatform } from '@scaffald/ui'
 *
 * function MyComponent() {
 *   const { isWeb, isNative, isTouchDevice, supportsHover } = usePlatform()
 *
 *   return (
 *     <View>
 *       {supportsHover && <HoverEffects />}
 *       {isTouchDevice && <TouchInstructions />}
 *     </View>
 *   )
 * }
 * ```
 */

import { useState, useEffect, useMemo } from 'react'
import { Platform } from './Platform'

export interface UsePlatformReturn {
  /** Current platform OS */
  os: typeof Platform.OS
  /** Whether running on web */
  isWeb: boolean
  /** Whether running on iOS */
  isIOS: boolean
  /** Whether running on Android */
  isAndroid: boolean
  /** Whether running on native (iOS or Android) */
  isNative: boolean
  /** Whether running on a mobile platform */
  isMobile: boolean
  /** Whether running on a desktop platform */
  isDesktop: boolean
  /** Whether the device supports touch */
  isTouchDevice: boolean
  /** Whether the platform supports hover interactions */
  supportsHover: boolean
  /** Whether the platform supports pointer events */
  supportsPointer: boolean
  /** Whether running in SSR context */
  isSSR: boolean
}

/**
 * Hook for platform detection with additional runtime checks
 */
export function usePlatform(): UsePlatformReturn {
  // Static platform checks (computed once)
  const staticChecks = useMemo(
    () => ({
      os: Platform.OS,
      isWeb: Platform.isWeb,
      isIOS: Platform.isIOS,
      isAndroid: Platform.isAndroid,
      isNative: Platform.isNative,
      isMobile: Platform.isMobile,
      isDesktop: Platform.isDesktop,
      isSSR: Platform.isSSR,
    }),
    []
  )

  // Runtime checks that may change (e.g., device orientation, connected peripherals)
  const [runtimeChecks, setRuntimeChecks] = useState({
    isTouchDevice: Platform.isTouchDevice(),
    supportsHover: Platform.supportsHover(),
    supportsPointer: Platform.supportsPointer(),
  })

  // Update runtime checks on mount (for SSR hydration)
  useEffect(() => {
    setRuntimeChecks({
      isTouchDevice: Platform.isTouchDevice(),
      supportsHover: Platform.supportsHover(),
      supportsPointer: Platform.supportsPointer(),
    })
  }, [])

  return {
    ...staticChecks,
    ...runtimeChecks,
  }
}
