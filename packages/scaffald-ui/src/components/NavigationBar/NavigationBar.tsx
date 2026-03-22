/**
 * NavigationBar — iOS 26 top navigation bar
 *
 * Supports standard and large title modes, back button, leading/trailing
 * action buttons, inline segmented controls (iPad), and search accessories.
 *
 * @example
 * ```tsx
 * // iPhone — standard
 * <NavigationBar
 *   title="Messages"
 *   backButton={{ label: 'Back', onPress: goBack }}
 *   trailingItems={<ToolbarButton icon={<Compose />} onPress={handleCompose} />}
 * />
 *
 * // iPhone — large title
 * <NavigationBar
 *   title="Settings"
 *   titleSize="large"
 *   trailingItems={<ToolbarButton icon={<Edit />} onPress={handleEdit} />}
 * />
 *
 * // iPad — with segmented control
 * <NavigationBar
 *   title="Library"
 *   backButton={{ onPress: goBack }}
 *   segmentedControl={{
 *     segments: ['Songs', 'Albums', 'Artists'],
 *     selectedIndex: 0,
 *     onSelectionChange: setTab,
 *   }}
 * />
 * ```
 */

import type React from 'react'
import { View } from 'react-native'
import { Text } from '../Typography'
import { ToolbarButton } from '../ToolbarButton'
import { SegmentedControl } from '../SegmentedControl'
import { SearchAccessory } from '../SearchAccessory'
import type { NavigationBarProps } from './NavigationBar.types'
import { getNavigationBarStyles } from './NavigationBar.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'

export function NavigationBar({
  title,
  subtitle,
  showSubtitle = true,
  titleSize = 'standard',
  backButton,
  leadingItems,
  trailingItems,
  segmentedControl,
  searchAccessory,
  glass = false,
  style,
  testID,
}: NavigationBarProps): React.ReactElement {
  const { theme } = useThemeContext()
  const styles = useStyles(getNavigationBarStyles, [theme] as const)

  const isLargeTitle = titleSize === 'large'
  const hasSubtitle = showSubtitle && subtitle != null

  // -- Center content: segmented control OR title --
  const renderCenter = () => {
    if (segmentedControl) {
      return (
        <SegmentedControl
          segments={segmentedControl.segments}
          selectedIndex={segmentedControl.selectedIndex}
          onSelectionChange={segmentedControl.onSelectionChange}
          disabled={segmentedControl.disabled}
        />
      )
    }

    // In large title mode, the center can be empty (title goes below)
    if (isLargeTitle) return null

    return (
      <View style={styles.titleStack}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {hasSubtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    )
  }

  const containerStyle = glass ? styles.glassContainer : styles.container

  return (
    <View style={[containerStyle, style]} testID={testID}>
      {/* Main nav row: leading | center | trailing */}
      <View style={styles.navRow}>
        {/* Leading zone */}
        <View style={styles.leading}>
          {backButton && (
            <ToolbarButton
              variant="back"
              label={backButton.label}
              onPress={backButton.onPress}
              tintColor={backButton.tintColor}
              accessibilityLabel={backButton.label ?? 'Back'}
            />
          )}
          {leadingItems}
        </View>

        {/* Center zone */}
        <View style={styles.center}>
          {renderCenter()}
        </View>

        {/* Trailing zone */}
        <View style={styles.trailing}>
          {trailingItems}
        </View>
      </View>

      {/* Large title row (below nav row) */}
      {isLargeTitle && (
        <View style={styles.largeTitleRow}>
          <Text style={styles.largeTitle}>{title}</Text>
          {hasSubtitle && (
            <Text style={styles.largeSubtitle}>{subtitle}</Text>
          )}
        </View>
      )}

      {/* Search accessory row (iPad) */}
      {searchAccessory && (
        <SearchAccessory {...searchAccessory} />
      )}
    </View>
  )
}
