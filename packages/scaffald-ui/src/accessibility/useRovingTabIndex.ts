/**
 * useRovingTabIndex hook
 * Implements roving tabindex pattern for keyboard navigation
 *
 * Used for composite widgets like tabs, radio groups, menus, etc.
 * where arrow keys should navigate between items and only one
 * item should be in the tab order at a time.
 *
 * @example
 * ```tsx
 * import { useRovingTabIndex } from '@scaffald/ui'
 *
 * function TabList({ tabs, selectedIndex, onSelect }) {
 *   const { getTabProps, focusedIndex } = useRovingTabIndex({
 *     items: tabs.length,
 *     selectedIndex,
 *     orientation: 'horizontal',
 *     onSelect,
 *   })
 *
 *   return (
 *     <View role="tablist">
 *       {tabs.map((tab, index) => (
 *         <Pressable
 *           key={tab.id}
 *           {...getTabProps(index)}
 *           role="tab"
 *         >
 *           {tab.label}
 *         </Pressable>
 *       ))}
 *     </View>
 *   )
 * }
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import type { RovingTabIndexConfig, NavigationKey } from './types'

export interface UseRovingTabIndexOptions extends RovingTabIndexConfig {
  /** Total number of items */
  items: number
  /** Currently selected index (controlled) */
  selectedIndex?: number
  /** Default selected index (uncontrolled) */
  defaultSelectedIndex?: number
  /** IDs of disabled items */
  disabledItems?: number[]
}

export interface RovingItemProps {
  /** Tab index (-1 for non-focused items, 0 for focused) */
  tabIndex: number
  /** Keyboard event handler */
  onKeyDown?: (event: KeyboardEvent) => void
  /** Focus event handler */
  onFocus?: () => void
  /** Whether this item is focused */
  'data-focused'?: boolean
}

export interface UseRovingTabIndexReturn {
  /** Current focused index */
  focusedIndex: number
  /** Set focused index programmatically */
  setFocusedIndex: (index: number) => void
  /** Get props for an item at the given index */
  getItemProps: (index: number) => RovingItemProps
  /** Move focus to next item */
  focusNext: () => void
  /** Move focus to previous item */
  focusPrevious: () => void
  /** Move focus to first item */
  focusFirst: () => void
  /** Move focus to last item */
  focusLast: () => void
}

/**
 * Hook for implementing roving tabindex pattern
 */
export function useRovingTabIndex(
  options: UseRovingTabIndexOptions
): UseRovingTabIndexReturn {
  const {
    items,
    selectedIndex,
    defaultSelectedIndex = 0,
    orientation = 'horizontal',
    loop = true,
    autoFocus = false,
    disabledItems = [],
    onSelect,
  } = options

  // Track focused index
  const [focusedIndex, setFocusedIndex] = useState(
    selectedIndex ?? defaultSelectedIndex
  )

  // Track item refs for focusing
  const itemRefs = useRef<(HTMLElement | null)[]>([])

  // Sync with controlled selectedIndex
  useEffect(() => {
    if (selectedIndex !== undefined) {
      setFocusedIndex(selectedIndex)
    }
  }, [selectedIndex])

  // Check if an index is disabled
  const isDisabled = useCallback(
    (index: number) => disabledItems.includes(index),
    [disabledItems]
  )

  // Find next non-disabled index
  const findNextIndex = useCallback(
    (currentIndex: number, direction: 1 | -1): number => {
      let nextIndex = currentIndex
      const totalItems = items

      for (let i = 0; i < totalItems; i++) {
        nextIndex = nextIndex + direction

        if (loop) {
          if (nextIndex >= totalItems) nextIndex = 0
          if (nextIndex < 0) nextIndex = totalItems - 1
        } else {
          if (nextIndex >= totalItems || nextIndex < 0) {
            return currentIndex
          }
        }

        if (!isDisabled(nextIndex)) {
          return nextIndex
        }
      }

      return currentIndex
    },
    [items, loop, isDisabled]
  )

  // Navigation functions
  const focusNext = useCallback(() => {
    const nextIndex = findNextIndex(focusedIndex, 1)
    setFocusedIndex(nextIndex)
    onSelect?.(nextIndex)
  }, [focusedIndex, findNextIndex, onSelect])

  const focusPrevious = useCallback(() => {
    const prevIndex = findNextIndex(focusedIndex, -1)
    setFocusedIndex(prevIndex)
    onSelect?.(prevIndex)
  }, [focusedIndex, findNextIndex, onSelect])

  const focusFirst = useCallback(() => {
    const firstIndex = findNextIndex(-1, 1)
    setFocusedIndex(firstIndex)
    onSelect?.(firstIndex)
  }, [findNextIndex, onSelect])

  const focusLast = useCallback(() => {
    const lastIndex = findNextIndex(items, -1)
    setFocusedIndex(lastIndex)
    onSelect?.(lastIndex)
  }, [items, findNextIndex, onSelect])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (Platform.OS !== 'web') return

      const key = event.key as NavigationKey
      let handled = false

      switch (key) {
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            focusNext()
            handled = true
          }
          break
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            focusPrevious()
            handled = true
          }
          break
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            focusNext()
            handled = true
          }
          break
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            focusPrevious()
            handled = true
          }
          break
        case 'Home':
          focusFirst()
          handled = true
          break
        case 'End':
          focusLast()
          handled = true
          break
        case 'Enter':
        case 'Space':
          // Selection is handled by the component
          break
      }

      if (handled) {
        event.preventDefault()
        event.stopPropagation()
      }
    },
    [orientation, focusNext, focusPrevious, focusFirst, focusLast]
  )

  // Get props for an item
  const getItemProps = useCallback(
    (index: number): RovingItemProps => {
      const isFocused = index === focusedIndex
      const disabled = isDisabled(index)

      if (Platform.OS !== 'web') {
        return {
          tabIndex: 0,
          'data-focused': isFocused,
        }
      }

      return {
        tabIndex: isFocused && !disabled ? 0 : -1,
        onKeyDown: (event: KeyboardEvent) => handleKeyDown(event),
        onFocus: () => {
          if (!disabled) {
            setFocusedIndex(index)
          }
        },
        'data-focused': isFocused,
      }
    },
    [focusedIndex, isDisabled, handleKeyDown]
  )

  // Auto-focus on mount - uses ref to track if already focused
  const hasAutoFocused = useRef(false)
  useEffect(() => {
    if (autoFocus && Platform.OS === 'web' && !hasAutoFocused.current) {
      hasAutoFocused.current = true
      const element = itemRefs.current[focusedIndex]
      element?.focus()
    }
  }, [autoFocus, focusedIndex])

  return {
    focusedIndex,
    setFocusedIndex,
    getItemProps,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  }
}
