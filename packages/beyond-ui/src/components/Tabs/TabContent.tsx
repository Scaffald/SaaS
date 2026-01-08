/**
 * TabContent component
 * Panel content shown when tab is active
 */

import { View, Text, StyleSheet } from 'react-native'
import type { TabContentProps } from './Tabs.types'
import { useTabItemContext } from './TabItem'
import { useTabsContext } from './Tabs'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typography } from '../../tokens/typography'
import { borderRadius } from '../../tokens/borders'
import { useThemeContext } from '../../playground/ThemeProvider'

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

  const isBordered = tabsContext.contentVariant === 'bordered'
  const isHorizontal = tabsContext.orientation === 'horizontal'

  return (
    <View
      style={[
        styles.container,
        // In horizontal layout, content is rendered in a separate container below triggers
        // So padding/spacing is applied here
        isBordered && {
          backgroundColor: colors.bg[theme].default,
          borderWidth: 1,
          borderColor: colors.border[theme].default,
          borderRadius: borderRadius.m,
          padding: spacing[16],
        },
        containerStyle,
      ]}
    >
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.content,
            {
              color: colors.text[theme].secondary,
            },
            contentStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        <View style={styles.customContent}>{children}</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing[12],
    gap: spacing[12],
  },
  content: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  customContent: {
    // Allow custom content to define its own styles
  },
})

