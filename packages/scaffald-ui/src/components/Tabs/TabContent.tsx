/**
 * TabContent component
 * Panel content shown when tab is active
 */

import { View, Text } from 'react-native'
import type { TabContentProps } from './Tabs.types'
import { useTabItemContext } from './TabItem'
import { useTabsContext } from './Tabs'
import { getTabContentStyles } from './Tabs.styles'
import { useThemeContext } from '../../theme'

export function TabContent({
  children,
  containerStyle,
  contentStyle,
}: TabContentProps) {
  const itemContext = useTabItemContext()
  const tabsContext = useTabsContext()
  const { theme } = useThemeContext()

  // Don't render if tab is not selected
  if (!itemContext.isSelected) {
    return null
  }

  const styles = getTabContentStyles(tabsContext.contentVariant, theme)

  return (
    <View style={[styles.container, containerStyle]}>
      {typeof children === 'string' ? (
        <Text style={[styles.content, contentStyle]}>
          {children}
        </Text>
      ) : (
        <View style={styles.customContent}>{children}</View>
      )}
    </View>
  )
}

