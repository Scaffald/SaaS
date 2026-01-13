/**
 * CommandMenu utility functions tests
 */

import { describe, it, expect } from 'vitest'
import { filterItems, formatKeyboardShortcut, getPlatformModifier } from './CommandMenu.utils'
import type { CommandMenuItemData } from './CommandMenuItem/CommandMenuItem.types'

describe('CommandMenu.utils', () => {
  const mockItems: CommandMenuItemData[] = [
    { id: '1', title: 'Item One', subtitle: 'First item', tab: 'tab1' },
    { id: '2', title: 'Item Two', subtitle: 'Second item', tab: 'tab1' },
    { id: '3', title: 'Item Three', subtitle: 'Third item', tab: 'tab2' },
  ]

  describe('filterItems', () => {
    it('filters by search query', () => {
      const result = filterItems(mockItems, 'One')
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Item One')
    })

    it('filters by subtitle', () => {
      const result = filterItems(mockItems, 'Second')
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Item Two')
    })

    it('filters by tab', () => {
      const result = filterItems(mockItems, '', 'tab1')
      expect(result).toHaveLength(2)
      expect(result.every((item) => item.tab === 'tab1')).toBe(true)
    })

    it('filters by both search and tab', () => {
      const result = filterItems(mockItems, 'Item', 'tab1')
      expect(result).toHaveLength(2)
    })

    it('returns all items when no filters', () => {
      const result = filterItems(mockItems, '', '')
      expect(result).toHaveLength(3)
    })
  })

  describe('formatKeyboardShortcut', () => {
    it('formats single key', () => {
      const result = formatKeyboardShortcut(['K'])
      expect(result).toBe('K')
    })

    it('formats modifier keys', () => {
      const result = formatKeyboardShortcut(['⌘', 'K'])
      expect(result).toContain('K')
    })
  })

  describe('getPlatformModifier', () => {
    it('returns platform modifier', () => {
      const result = getPlatformModifier()
      expect(['⌘', 'Ctrl']).toContain(result)
    })
  })
})
