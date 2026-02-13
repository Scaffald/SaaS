/**
 * useId hook
 * Generates stable IDs for accessibility attributes
 *
 * This is a polyfill for React 18's useId hook, providing the same
 * functionality for earlier React versions and React Native.
 *
 * @example
 * ```tsx
 * import { useId } from '@scaffald/ui'
 *
 * function MyInput({ label }) {
 *   const id = useId()
 *   const labelId = useId()
 *
 *   return (
 *     <View>
 *       <Text nativeID={labelId}>{label}</Text>
 *       <TextInput
 *         nativeID={id}
 *         accessibilityLabelledBy={labelId}
 *       />
 *     </View>
 *   )
 * }
 * ```
 */

import { useRef, useMemo } from 'react'
import * as React from 'react'

// Check if React 18's useId is available at module load time
const hasReact18UseId = typeof (React as unknown as { useId?: () => string }).useId === 'function'

// Global counter for generating unique IDs
let idCounter = 0

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `beyond-ui-${++idCounter}`
}

/**
 * Fallback implementation for React < 18
 */
function useIdFallback(prefix?: string): string {
  const idRef = useRef<string | null>(null)

  if (idRef.current === null) {
    idRef.current = generateId()
  }

  return useMemo(
    () => (prefix ? `${prefix}-${idRef.current}` : idRef.current) as string,
    [prefix]
  )
}

/**
 * React 18 wrapper that uses native useId
 */
function useIdReact18(prefix?: string): string {
  const reactId = (React as unknown as { useId: () => string }).useId()
  return useMemo(
    () => (prefix ? `${prefix}-${reactId}` : reactId),
    [prefix, reactId]
  )
}

/**
 * Hook that generates a stable unique ID
 *
 * - Uses React 18's useId if available
 * - Falls back to a custom implementation for earlier versions
 * - IDs are stable across re-renders
 * - IDs are unique within the app session
 *
 * @param prefix Optional prefix for the ID
 * @returns A unique identifier string
 */
export const useId = hasReact18UseId ? useIdReact18 : useIdFallback

/**
 * Generate multiple related IDs
 *
 * @example
 * ```tsx
 * const { base, label, description, error } = useIds('input')
 * // Returns: { base: 'input-1', label: 'input-1-label', ... }
 * ```
 */
export function useIds(prefix: string = 'element') {
  const baseId = useId(prefix)

  return useMemo(
    () => ({
      base: baseId,
      label: `${baseId}-label`,
      description: `${baseId}-description`,
      error: `${baseId}-error`,
      listbox: `${baseId}-listbox`,
      option: (index: number) => `${baseId}-option-${index}`,
    }),
    [baseId]
  )
}
