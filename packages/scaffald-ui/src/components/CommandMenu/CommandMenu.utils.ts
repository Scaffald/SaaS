/**
 * CommandMenu utility functions
 * Search, filter, and keyboard shortcut utilities
 */

import { Platform } from 'react-native'
import type { CommandMenuItemData } from './CommandMenuItem/CommandMenuItem.types'

/**
 * Filter command menu items by search query and tab
 */
export function filterItems(
  items: CommandMenuItemData[],
  searchQuery: string,
  tab?: string
): CommandMenuItemData[] {
  let filtered = items

  // Filter by tab if provided
  if (tab) {
    // This assumes items have a tab property or can be filtered by tab
    // Adjust based on your data structure
    filtered = filtered.filter((item) => {
      // If item has a tab property, filter by it
      if ('tab' in item && item.tab) {
        return item.tab === tab
      }
      // Otherwise, include all items
      return true
    })
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim()
    filtered = filtered.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(query)
      const subtitleMatch = item.subtitle?.toLowerCase().includes(query)
      return titleMatch || subtitleMatch
    })
  }

  return filtered
}

/**
 * Format keyboard shortcut keys for display
 */
export function formatKeyboardShortcut(keys: string[]): string {
  if (!keys || keys.length === 0) {
    return ''
  }

  const formatted = keys.map((key) => {
    // Handle modifier keys
    if (key === 'Meta' || key === '⌘' || key === 'Cmd') {
      return Platform.OS === 'ios' || Platform.OS === 'macos' ? '⌘' : 'Ctrl'
    }
    if (key === 'Control' || key === 'Ctrl') {
      return 'Ctrl'
    }
    if (key === 'Alt' || key === 'Option') {
      return Platform.OS === 'ios' || Platform.OS === 'macos' ? '⌥' : 'Alt'
    }
    if (key === 'Shift') {
      return '⇧'
    }
    // Capitalize single characters
    if (key.length === 1) {
      return key.toUpperCase()
    }
    return key
  })

  return formatted.join('')
}

/**
 * Get platform-specific modifier key
 * Returns '⌘' on Mac/iOS, 'Ctrl' on Windows/Linux
 */
export function getPlatformModifier(): string {
  return Platform.OS === 'ios' || Platform.OS === 'macos' ? '⌘' : 'Ctrl'
}

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(
  event: {
    key: string
    metaKey?: boolean
    ctrlKey?: boolean
    altKey?: boolean
    shiftKey?: boolean
  },
  shortcut: string[]
): boolean {
  const modifiers: string[] = []
  const keys: string[] = []

  shortcut.forEach((key) => {
    if (['⌘', 'Meta', 'Cmd', 'Ctrl', 'Control', 'Alt', 'Option', 'Shift', '⇧'].includes(key)) {
      modifiers.push(key)
    } else {
      keys.push(key)
    }
  })

  // Check modifier keys
  const hasMeta = modifiers.some((m) => ['⌘', 'Meta', 'Cmd'].includes(m))
  const hasCtrl = modifiers.some((m) => ['Ctrl', 'Control'].includes(m))
  const hasAlt = modifiers.some((m) => ['Alt', 'Option'].includes(m))
  const hasShift = modifiers.some((m) => ['Shift', '⇧'].includes(m))

  const metaMatch = hasMeta ? event.metaKey || false : !event.metaKey
  const ctrlMatch = hasCtrl ? event.ctrlKey || false : !event.ctrlKey
  const altMatch = hasAlt ? event.altKey || false : !event.altKey
  const shiftMatch = hasShift ? event.shiftKey || false : !event.shiftKey

  if (!metaMatch || !ctrlMatch || !altMatch || !shiftMatch) {
    return false
  }

  // Check main key
  if (keys.length > 0) {
    const mainKey = keys[0].toLowerCase()
    return event.key.toLowerCase() === mainKey
  }

  return false
}
