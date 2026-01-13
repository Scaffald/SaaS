/**
 * TabItem component
 * Individual tab item wrapper
 * Provides context for trigger and content components
 */

import { createContext, useContext } from 'react'
import { View } from 'react-native'
import type { TabItemProps, TabItemContextValue } from './Tabs.types'
import { useTabsContext } from './Tabs'

// TabItem context
const TabItemContext = createContext<TabItemContextValue | null>(null)

export function useTabItemContext() {
  const context = useContext(TabItemContext)
  if (!context) {
    throw new Error('TabItem components must be used within a TabItem')
  }
  return context
}

export function TabItem({
  value,
  disabled: disabledProp = false,
  children,
  containerStyle,
}: TabItemProps) {
  const tabsContext = useTabsContext()

  // Check if this item is selected
  const isSelected = tabsContext.value === value

  // Item is disabled if parent is disabled or if explicitly disabled
  const disabled = tabsContext.disabled || disabledProp

  const contextValue: TabItemContextValue = {
    isSelected,
    disabled,
    value,
  }

  // In horizontal layout, we need to prevent content from affecting trigger width
  // TabContent returns null when not selected, but when selected it can affect layout
  // We'll let Tabs root handle content rendering separately
  // In horizontal layout, TabItem should be layout-transparent for triggers
  // Content is rendered separately by Tabs root, so this only wraps the trigger
  const itemContainerStyle = tabsContext.orientation === 'horizontal'
    ? {
        // Make wrapper transparent to layout - doesn't affect trigger sizing
        alignSelf: 'flex-start' as const,
        flexShrink: 0,
        flexGrow: 0,
      }
    : {}

  return (
    <TabItemContext.Provider value={contextValue}>
      <View style={[itemContainerStyle, containerStyle]}>{children}</View>
    </TabItemContext.Provider>
  )
}

