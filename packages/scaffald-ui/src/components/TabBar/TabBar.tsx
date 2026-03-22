/**
 * TabBar — iOS 26 glassmorphic floating pill tab bar
 *
 * A bottom navigation bar rendered as a floating glass pill with
 * evenly distributed tab items. Supports icon+label and icon-only
 * variants, optional leading/trailing action buttons, and badges.
 *
 * @example
 * ```tsx
 * <TabBar
 *   items={[
 *     { key: 'home', label: 'Home', icon: <HomeIcon /> },
 *     { key: 'search', label: 'Search', icon: <SearchIcon /> },
 *     { key: 'profile', label: 'Profile', icon: <ProfileIcon /> },
 *   ]}
 *   selectedKey="home"
 *   onSelectionChange={(key) => setTab(key)}
 * />
 * ```
 */

import type React from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '../Typography'
import type { TabBarProps, TabBarItem } from './TabBar.types'
import { getTabBarStyles } from './TabBar.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'

export function TabBar({
  items,
  selectedKey,
  onSelectionChange,
  leadingAction,
  trailingAction,
  style,
}: TabBarProps): React.ReactElement {
  const { theme } = useThemeContext()
  const styles = useStyles(getTabBarStyles, [theme] as const)

  return (
    <View style={[styles.wrapper, style]} pointerEvents="box-none">
      <View style={styles.row}>
        {leadingAction != null && (
          <View style={styles.actionSlot}>{leadingAction}</View>
        )}

        <View style={styles.pill} accessibilityRole="tablist">
          {items.map((item) => {
            const isSelected = item.key === selectedKey
            return (
              <TabBarItemView
                key={item.key}
                item={item}
                isSelected={isSelected}
                styles={styles}
                onPress={() => onSelectionChange(item.key)}
              />
            )
          })}
        </View>

        {trailingAction != null && (
          <View style={styles.actionSlot}>{trailingAction}</View>
        )}
      </View>
    </View>
  )
}

// ============================================================================
// TabBarItemView (internal)
// ============================================================================

interface TabBarItemViewProps {
  item: TabBarItem
  isSelected: boolean
  styles: ReturnType<typeof getTabBarStyles>
  onPress: () => void
}

function TabBarItemView({
  item,
  isSelected,
  styles,
  onPress,
}: TabBarItemViewProps): React.ReactElement {
  const hasLabel = item.label != null && item.label.length > 0
  const iconColor = isSelected ? styles.selectedColor : styles.unselectedColor

  // Choose icon: prefer selectedIcon when active
  const icon = isSelected && item.selectedIcon != null
    ? item.selectedIcon
    : item.icon

  // Determine container style based on variant + selection
  const containerStyle = hasLabel
    ? isSelected
      ? styles.itemSelected
      : styles.item
    : isSelected
      ? styles.itemIconOnlySelected
      : styles.itemIconOnly

  return (
    <Pressable
      style={containerStyle}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={item.label ?? item.key}
    >
      <View style={styles.iconWrapper}>{icon}</View>

      {hasLabel && (
        <Text
          style={isSelected ? styles.labelSelected : styles.label}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      )}

      {item.badge != null && item.badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.badge > 99 ? '99+' : String(item.badge)}
          </Text>
        </View>
      )}
    </Pressable>
  )
}
