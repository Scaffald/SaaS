/**
 * CommandMenu component
 * Complete command palette/menu with search, tabs, and keyboard navigation
 *
 * @example
 * ```tsx
 * import { CommandMenu } from '@scaffald/ui'
 *
 * <CommandMenu
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   tabs={[
 *     { value: "members", label: "Members" },
 *     { value: "files", label: "Files" }
 *   ]}
 *   items={menuItems}
 *   onItemSelect={(item) => console.log("Selected:", item)}
 * />
 * ```
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { View, ScrollView, Platform, Keyboard, type ViewStyle } from 'react-native'
import type { CommandMenuProps } from './CommandMenu.types'
import { Input } from '../../Input'
import { Tabs } from '../../Tabs'
import { CommandMenuItem } from '../CommandMenuItem'
import { CommandMenuFooter } from '../CommandMenuFooter'
import { filterItems } from '../CommandMenu.utils'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { Search } from 'lucide-react-native'

export function CommandMenu({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  placeholder = 'Search...',
  helperText,
  tabs = [],
  items = [],
  onItemSelect,
  searchValue: controlledSearchValue,
  onSearchChange,
  defaultSearchValue = '',
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  closeOnSelect = true,
  closeOnEscape = true,
  closeOnBackdropPress = true,
  style,
  testID,
}: CommandMenuProps) {
  // Open state
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlledOpen = controlledOpen !== undefined
  const isOpen = isControlledOpen ? controlledOpen : internalOpen

  // Search state
  const [internalSearchValue, setInternalSearchValue] = useState(defaultSearchValue)
  const isControlledSearch = controlledSearchValue !== undefined
  const searchValue = isControlledSearch ? controlledSearchValue : internalSearchValue

  // Tab state
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.value || '')
  const isControlledTab = controlledActiveTab !== undefined
  const activeTab = isControlledTab ? controlledActiveTab : internalActiveTab

  // Active item index for keyboard navigation
  const [activeIndex, setActiveIndex] = useState(-1)
  const scrollViewRef = useRef<ScrollView>(null)
  const itemRefs = useRef<Array<View | null>>([])

  // Handle open change
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!isControlledOpen) {
        setInternalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [isControlledOpen, onOpenChange]
  )

  // Handle search change
  const handleSearchChange = useCallback(
    (value: string) => {
      if (!isControlledSearch) {
        setInternalSearchValue(value)
      }
      onSearchChange?.(value)
      // Reset active index when search changes
      setActiveIndex(-1)
    },
    [isControlledSearch, onSearchChange]
  )

  // Handle tab change
  const handleTabChange = useCallback(
    (value: string) => {
      if (!isControlledTab) {
        setInternalActiveTab(value)
      }
      onTabChange?.(value)
      // Reset active index when tab changes
      setActiveIndex(-1)
    },
    [isControlledTab, onTabChange]
  )

  // Filter items based on search and tab
  const filteredItems = useMemo(
    () => filterItems(items, searchValue, activeTab),
    [items, searchValue, activeTab]
  )

  // Reset item refs when filtered items change
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filteredItems.length)
  }, [filteredItems.length])

  // Handle item select
  const handleItemSelect = useCallback(
    (item: typeof filteredItems[0]) => {
      onItemSelect?.(item)
      if (closeOnSelect) {
        handleOpenChange(false)
      }
      // Reset state
      if (!isControlledSearch) {
        setInternalSearchValue('')
      }
      setActiveIndex(-1)
    },
    [onItemSelect, closeOnSelect, handleOpenChange, isControlledSearch]
  )

  // Handle keyboard events (web only)
  useEffect(() => {
    if (!isOpen || Platform.OS !== 'web') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key

      switch (key) {
        case 'ArrowDown':
          event.preventDefault()
          setActiveIndex((prev) => {
            const next = prev < filteredItems.length - 1 ? prev + 1 : 0
            // Scroll to item - simplified for now
            setTimeout(() => {
              // ScrollView will handle scrolling based on focus
            }, 0)
            return next
          })
          break

        case 'ArrowUp':
          event.preventDefault()
          setActiveIndex((prev) => {
            const next = prev > 0 ? prev - 1 : filteredItems.length - 1
            // Scroll to item - simplified for now
            setTimeout(() => {
              // ScrollView will handle scrolling based on focus
            }, 0)
            return next
          })
          break

        case 'Enter':
          if (activeIndex >= 0 && activeIndex < filteredItems.length) {
            event.preventDefault()
            handleItemSelect(filteredItems[activeIndex])
          }
          break

        case 'Escape':
          if (closeOnEscape) {
            event.preventDefault()
            handleOpenChange(false)
          }
          break

        default:
          break
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [
    isOpen,
    closeOnEscape,
    handleOpenChange,
    filteredItems,
    activeIndex,
    handleItemSelect,
  ])

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && Platform.OS === 'web') {
      // Focus will be handled by Input component
      Keyboard.dismiss()
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  // Container style
  const containerStyle: ViewStyle = {
    backgroundColor: colors.bg.light.default,
    borderRadius: 12, // radius-l
    overflow: 'hidden',
    width: 587, // Fixed width from Figma
    ...style,
  }

  // Search wrap style
  const searchWrapStyle = {
    backgroundColor: colors.bg.light.default,
    paddingTop: spacing[24],
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[0],
    gap: spacing[12],
  }

  // List container style
  const listContainerStyle = {
    backgroundColor: colors.bg.light.default,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light.default,
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[8],
    maxHeight: 400,
  }

  return (
    <View
      style={[
        containerStyle,
        Platform.OS === 'web' && {
          position: 'absolute' as const,
          zIndex: 1000,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
        },
      ]}
      testID={testID}
      onStartShouldSetResponder={() => true}
      onTouchEnd={(e) => {
        e.stopPropagation()
      }}
    >
      {/* Search section */}
      <View style={searchWrapStyle}>
        <Input
          placeholder={placeholder}
          helperText={helperText}
          value={searchValue}
          onChangeText={handleSearchChange}
          iconStart={Search}
          autoFocus={Platform.OS === 'web'}
        />

        {/* Tabs */}
        {tabs.length > 0 && (
          <Tabs value={activeTab} onValueChange={handleTabChange} type="line">
            {tabs.map((tab) => (
              <Tabs.Item key={tab.value} value={tab.value}>
                <Tabs.Trigger>{tab.label}</Tabs.Trigger>
              </Tabs.Item>
            ))}
          </Tabs>
        )}
      </View>

      {/* List of items */}
      <ScrollView
        ref={scrollViewRef}
        style={listContainerStyle}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <View
              key={item.id}
              ref={(el) => {
                itemRefs.current[index] = el
              }}
            >
              <CommandMenuItem
                type={item.type || 'Empty'}
                textOrientation="Horizontal"
                title={item.title}
                subtitle={item.subtitle}
                avatar={item.avatar}
                icon={item.icon}
                shortcut={item.shortcut}
                state={activeIndex === index ? 'Focused' : 'Default'}
                onPress={() => handleItemSelect(item)}
                showShortcut={false}
              />
            </View>
          ))
        ) : (
          <View style={{ padding: spacing[16], alignItems: 'center' }}>
            <CommandMenuItem
              type="Empty"
              title="No results found"
              disabled
              showShortcut={false}
            />
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <CommandMenuFooter />
    </View>
  )
}
