/**
 * BottomToolbar — iOS 26 glassmorphic bottom toolbar
 *
 * A floating glass pill at the bottom of the screen, supporting
 * button groups, search bars, and page controls.
 *
 * @example
 * ```tsx
 * // Button variant
 * <BottomToolbar
 *   variant="buttons"
 *   buttons={[
 *     { key: 'share', icon: <Share />, onPress: handleShare },
 *     { key: 'favorite', icon: <Heart />, onPress: handleFavorite },
 *     { key: 'delete', icon: <Trash />, onPress: handleDelete },
 *   ]}
 * />
 *
 * // Search variant
 * <BottomToolbar
 *   variant="search"
 *   searchBar={{ value: query, onChangeText: setQuery }}
 * />
 *
 * // Page control variant
 * <BottomToolbar
 *   variant="pageControl"
 *   leadingButtons={[{ key: 'back', icon: <ChevronLeft />, onPress: prevPage }]}
 *   pageControl={{ count: 5, current: 2, onChange: setPage }}
 *   trailingButtons={[{ key: 'fwd', icon: <ChevronRight />, onPress: nextPage }]}
 * />
 * ```
 */

import type React from 'react'
import { View } from 'react-native'
import { ToolbarButton } from '../ToolbarButton'
import { ToolbarSearchBar } from '../ToolbarSearchBar'
import { PageControl } from '../PageControl'
import type { BottomToolbarProps } from './BottomToolbar.types'
import { getBottomToolbarStyles } from './BottomToolbar.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'

export function BottomToolbar({
  variant = 'buttons',
  buttons,
  searchBar,
  pageControl,
  leadingButtons,
  trailingButtons,
  children,
  style,
  testID,
}: BottomToolbarProps): React.ReactElement {
  const { theme } = useThemeContext()
  const styles = useStyles(getBottomToolbarStyles, [theme] as const)

  const renderContent = () => {
    // Custom children override variant content
    if (children) return children

    switch (variant) {
      case 'buttons':
        return (
          <View style={styles.contentRow}>
            {buttons?.map((btn) => (
              <ToolbarButton
                key={btn.key}
                icon={btn.icon}
                label={btn.label}
                variant={btn.variant}
                onPress={btn.onPress}
                disabled={btn.disabled}
                tintColor={btn.tintColor}
                accessibilityLabel={btn.accessibilityLabel}
              />
            ))}
          </View>
        )

      case 'search':
        return (
          <View style={styles.searchRow}>
            {searchBar && <ToolbarSearchBar {...searchBar} />}
          </View>
        )

      case 'pageControl':
        return (
          <View style={styles.pageControlRow}>
            <View style={styles.pageControlButtons}>
              {leadingButtons?.map((btn) => (
                <ToolbarButton
                  key={btn.key}
                  icon={btn.icon}
                  label={btn.label}
                  variant={btn.variant}
                  onPress={btn.onPress}
                  disabled={btn.disabled}
                  accessibilityLabel={btn.accessibilityLabel}
                />
              ))}
            </View>

            {pageControl && (
              <PageControl
                totalPages={pageControl.count}
                currentPage={pageControl.current}
                onPageChange={pageControl.onChange}
                variant="pill"
              />
            )}

            <View style={styles.pageControlButtons}>
              {trailingButtons?.map((btn) => (
                <ToolbarButton
                  key={btn.key}
                  icon={btn.icon}
                  label={btn.label}
                  variant={btn.variant}
                  onPress={btn.onPress}
                  disabled={btn.disabled}
                  accessibilityLabel={btn.accessibilityLabel}
                />
              ))}
            </View>
          </View>
        )
    }
  }

  return (
    <View style={[styles.wrapper, style]} pointerEvents="box-none" testID={testID}>
      <View style={styles.pill}>
        {renderContent()}
      </View>
    </View>
  )
}
