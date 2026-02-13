/**
 * BreadcrumbSeparator component
 * Chevron separator between breadcrumb items
 *
 * @example
 * ```tsx
 * import { BreadcrumbSeparator } from '@scaffald/ui'
 *
 * <BreadcrumbSeparator />
 * <BreadcrumbSeparator separator={<Text>/</Text>} />
 * ```
 */

import { View, StyleSheet } from 'react-native'
import type { BreadcrumbSeparatorProps } from './Breadcrumb.types'
import { ChevronIcon } from './BreadcrumbIcons'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'

/**
 * BreadcrumbSeparator component
 */
export function BreadcrumbSeparator({ separator, style }: BreadcrumbSeparatorProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Get separator color based on theme
  const separatorColor = isLight ? colors.gray[300] : colors.border.dark['200']

  // If custom separator provided, render it
  if (separator) {
    return <View style={[styles.container, style]}>{separator}</View>
  }

  // Default: chevron icon
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="none"
      aria-hidden={true}
    >
      <ChevronIcon size={18} color={separatorColor} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
