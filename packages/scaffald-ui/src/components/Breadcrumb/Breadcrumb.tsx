/**
 * Breadcrumb component
 * Navigation breadcrumb trail showing hierarchical page location
 *
 * @example
 * ```tsx
 * import { Breadcrumb } from '@scaffald/ui'
 *
 * // Basic breadcrumb
 * <Breadcrumb
 *   items={[
 *     { label: 'Home' },
 *     { label: 'Products' },
 *     { label: 'Current Page' }
 *   ]}
 *   currentIndex={2}
 * />
 *
 * // With navigation
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Current' }
 *   ]}
 *   currentIndex={2}
 *   onItemPress={(index, item) => navigate(item.href)}
 * />
 * ```
 */

import { View, StyleSheet } from 'react-native'
import type { BreadcrumbProps } from './Breadcrumb.types'
import { BreadcrumbItem } from './BreadcrumbItem'
import { BreadcrumbSeparator } from './BreadcrumbSeparator'
import { HomeIcon } from './BreadcrumbIcons'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'

/**
 * Breadcrumb component
 */
export function Breadcrumb({
  items,
  currentIndex,
  separator,
  showSeparator = true,
  showHomeIcon = true,
  homeIcon,
  interactive = true,
  onItemPress,
  style,
  itemStyle,
  separatorStyle,
  ariaLabel = 'Breadcrumb',
  maxItems,
}: BreadcrumbProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Handle item press
  const handleItemPress = (index: number) => {
    const item = items[index]

    // Don't trigger for current page
    if (index === currentIndex) return

    // Call item-specific handler if exists
    if (item.onPress) {
      item.onPress()
      return
    }

    // Call global handler if exists
    if (onItemPress) {
      onItemPress(index, item)
    }
  }

  // Get home icon color based on theme and active state
  const getHomeIconColor = () => {
    if (currentIndex === 0) {
      // First item is active
      return isLight ? colors.gray[600] : colors.gray[400]
    }
    return isLight ? colors.icon.light.default : colors.icon.dark.default
  }

  // Determine which items to show (for maxItems truncation - future feature)
  const visibleItems = maxItems && items.length > maxItems
    ? [
        items[0], // First item
        { id: 'ellipsis', label: '...', disabled: true }, // Ellipsis
        ...items.slice(-(maxItems - 2)), // Last items
      ]
    : items

  return (
    <View
      style={[styles.container, style]}
      role="navigation"
      aria-label={ariaLabel}
      accessibilityRole="none"
      accessibilityLabel={ariaLabel}
    >
      {visibleItems.map((item, index) => {
        // Handle ellipsis item (for maxItems feature)
        if (item.id === 'ellipsis') {
          return (
            <View key="ellipsis" style={styles.itemWrapper}>
              <View style={itemStyle}>
                <BreadcrumbItem
                  label="..."
                  state="default"
                  interactive={false}
                  disabled
                  style={itemStyle}
                />
              </View>
              {showSeparator && index < visibleItems.length - 1 && (
                <BreadcrumbSeparator separator={separator} style={separatorStyle} />
              )}
            </View>
          )
        }

        // Determine if this item is active
        const isActive = index === currentIndex
        const itemState = isActive ? 'active' : 'default'

        // Get icon for first item
        const itemIcon = index === 0 && showHomeIcon
          ? homeIcon || <HomeIcon size={24} color={getHomeIconColor()} />
          : item.icon

        return (
          <View key={item.id || index} style={styles.itemWrapper}>
            <BreadcrumbItem
              label={item.label}
              icon={itemIcon}
              state={itemState}
              interactive={interactive && !item.disabled}
              disabled={item.disabled}
              onPress={() => handleItemPress(index)}
              style={itemStyle}
            />

            {/* Separator (except after last item) */}
            {showSeparator && index < visibleItems.length - 1 && (
              <BreadcrumbSeparator separator={separator} style={separatorStyle} />
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[12], // 12px between breadcrumb groups (item + separator)
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12], // 12px between item and separator
  },
})
