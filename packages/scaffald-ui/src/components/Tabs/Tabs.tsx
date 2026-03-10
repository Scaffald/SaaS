/**
 * Tabs component
 * Compound component for creating tab navigation
 *
 * @example
 * ```tsx
 * import { Tabs } from '@scaffald/ui'
 *
 * // Basic tabs
 * <Tabs defaultValue="tab1">
 *   <Tabs.Item value="tab1">
 *     <Tabs.Trigger>Tab 1</Tabs.Trigger>
 *     <Tabs.Content>Content 1</Tabs.Content>
 *   </Tabs.Item>
 *   <Tabs.Item value="tab2">
 *     <Tabs.Trigger>Tab 2</Tabs.Trigger>
 *     <Tabs.Content>Content 2</Tabs.Content>
 *   </Tabs.Item>
 * </Tabs>
 *
 * // With variants
 * <Tabs
 *   type="line"
 *   color="primary"
 *   size="lg"
 *   orientation="horizontal"
 *   defaultValue="tab1"
 * >
 *   <Tabs.Item value="tab1">
 *     <Tabs.Trigger iconStart={MyIcon}>Tab 1</Tabs.Trigger>
 *     <Tabs.Content>Content 1</Tabs.Content>
 *   </Tabs.Item>
 * </Tabs>
 * ```
 */

import { Children, isValidElement, cloneElement } from 'react'
import { View, ScrollView } from 'react-native'
import type { TabsProps } from './Tabs.types'
import { getTabsStyles, getTabListStyles } from './Tabs.styles'
import { useThemeContext } from '../../theme'
import { TabsContext } from './TabsContext'
import { TabTrigger } from './TabTrigger'
import { TabContent } from './TabContent'
import { useTabs } from './useTabs'

export { useTabsContext } from './TabsContext'

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  type = 'default',
  color = 'gray',
  size = 'md',
  orientation = 'horizontal',
  disabled = false,
  fullWidth = false,
  contentVariant = 'default',
  triggerSizing = 'auto',
  scrollable = false,
  children,
  containerStyle,
}: TabsProps) {
  const { theme } = useThemeContext()
  
  const tabs = useTabs({
    value,
    defaultValue,
    onValueChange,
    type,
    color,
    size,
    orientation,
    disabled,
    fullWidth,
    contentVariant,
    triggerSizing,
  })

  const styles = getTabsStyles(orientation, fullWidth, theme)

  // For horizontal layout, separate triggers from content
  // This ensures tab trigger width is independent of content width
  if (orientation === 'horizontal') {
    // Collect TabItems and separate their triggers and content
    const tabItems: Array<{
      value: string
      trigger: React.ReactElement
      content: React.ReactElement | null
      fullItem: React.ReactElement
    }> = []

    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        const itemValue = (child.props as any).value
        const itemChildren = (child.props as any).children
        const childrenArray = Children.toArray(itemChildren)

        let trigger: React.ReactElement | null = null
        let content: React.ReactElement | null = null

        childrenArray.forEach((itemChild) => {
          if (isValidElement(itemChild)) {
            const componentType = (itemChild as any).type
            if (
              componentType === TabTrigger ||
              componentType?.displayName === 'TabTrigger' ||
              componentType?.name === 'TabTrigger'
            ) {
              trigger = itemChild as React.ReactElement
            } else if (
              componentType === TabContent ||
              componentType?.displayName === 'TabContent' ||
              componentType?.name === 'TabContent'
            ) {
              content = itemChild as React.ReactElement
            }
          }
        })

        if (trigger) {
          tabItems.push({
            value: itemValue,
            trigger,
            content,
            fullItem: child as React.ReactElement,
          })
        }
      }
    })

    return (
      <TabsContext.Provider value={tabs}>
        <View style={[{ width: '100%', flexDirection: 'column' }, containerStyle]}>
          {/* Trigger row - scrollable when scrollable prop is true */}
          {scrollable ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
              }}
              style={{ width: '100%' }}
            >
              {tabItems.map((item, index) => {
                return cloneElement(item.fullItem, {
                  key: item.value || `trigger-${index}`,
                  children: item.trigger,
                } as any)
              })}
            </ScrollView>
          ) : (
            <View style={getTabListStyles(orientation, theme)}>
              {tabItems.map((item, index) => {
                return cloneElement(item.fullItem, {
                  key: item.value || `trigger-${index}`,
                  children: item.trigger,
                } as any)
              })}
            </View>
          )}
          {/* Content area - render content separately while preserving TabItem context */}
          <View style={{ width: '100%' }}>
            {tabItems.map((item, index) => {
              if (!item.content) return null
              return cloneElement(item.fullItem, {
                key: `content-${item.value || index}`,
                children: item.content,
              } as any)
            })}
          </View>
        </View>
      </TabsContext.Provider>
    )
  }

  // Vertical layout - keep original structure
  return (
    <TabsContext.Provider value={tabs}>
      <View style={[styles, containerStyle]}>{children}</View>
    </TabsContext.Provider>
  )
}

