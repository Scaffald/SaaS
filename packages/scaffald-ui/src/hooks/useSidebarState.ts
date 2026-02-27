/**
 * useSidebarState hook
 * Manages sidebar collapsed state with localStorage persistence
 */

import { useState, useEffect } from 'react'

export interface UseSidebarStateOptions {
  /**
   * Storage key for localStorage
   */
  storageKey: string

  /**
   * Default collapsed state
   * @default false
   */
  defaultCollapsed?: boolean

  /**
   * Disable localStorage persistence
   * @default false
   */
  disablePersistence?: boolean
}

/**
 * Hook to manage sidebar collapsed state with optional localStorage persistence
 *
 * @example
 * ```tsx
 * const [collapsed, setCollapsed] = useSidebarState({
 *   storageKey: 'my-app-sidebar',
 *   defaultCollapsed: false
 * })
 * ```
 */
export function useSidebarState({
  storageKey,
  defaultCollapsed = false,
  disablePersistence = false,
}: UseSidebarStateOptions): [boolean, (collapsed: boolean) => void] {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (disablePersistence || typeof window === 'undefined') {
      return defaultCollapsed
    }

    try {
      const stored = localStorage.getItem(storageKey)
      return stored !== null ? stored === 'true' : defaultCollapsed
    } catch (error) {
      if (__DEV__) {
        console.warn('[useSidebarState] Failed to read from localStorage:', error)
      }
      return defaultCollapsed
    }
  })

  useEffect(() => {
    if (disablePersistence || typeof window === 'undefined') {
      return
    }

    try {
      localStorage.setItem(storageKey, String(collapsed))
    } catch (error) {
      if (__DEV__) {
        console.warn('[useSidebarState] Failed to write to localStorage:', error)
      }
    }
  }, [collapsed, storageKey, disablePersistence])

  return [collapsed, setCollapsed]
}
