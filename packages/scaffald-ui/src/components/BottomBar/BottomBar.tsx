/**
 * BottomBar — composable bottom bar container.
 *
 * Handles fixed positioning, glass pill styling, safe-area insets,
 * and context-based global/page bar visibility management.
 *
 * @example
 * ```tsx
 * // Global bar — auto-hides when any page bar is active
 * <BottomBar level="global">
 *   <BottomBar.Navigation sections={sections} />
 * </BottomBar>
 *
 * // Page bar — auto-registers, causing global bar to hide
 * <BottomBar level="page">
 *   <BottomBar.Actions buttons={[searchBtn, filterBtn, sortBtn]} />
 * </BottomBar>
 * ```
 */

import type React from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeContext } from '../../theme'
import type { BottomBarProps } from './BottomBar.types'
import { getBottomBarStyles } from './BottomBar.styles'
import { useBottomBarContext } from './BottomBarProvider'
import { usePageBottomBar } from './hooks/usePageBottomBar'

// Presets — attached as static properties below
import { BottomBarActions } from './presets/BottomBarActions'
import { BottomBarSearch } from './presets/BottomBarSearch'
import { BottomBarPageControl } from './presets/BottomBarPageControl'

function BottomBarInner({
  level = 'page',
  children,
  style,
  wrapperStyle,
  id,
  testID,
}: BottomBarProps): React.ReactElement | null {
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const insets = useSafeAreaInsets()
  const { globalBarHidden } = useBottomBarContext()

  // Page bars auto-register to hide the global bar.
  // Always call the hook (rules of hooks) but pass enabled flag.
  usePageBottomBar(level === 'page' ? id : undefined, level === 'page')

  // Global bar hides when any page bar is active
  if (level === 'global' && globalBarHidden) {
    return null
  }

  const styles = getBottomBarStyles(resolvedTheme, level, insets.bottom)

  return (
    <View
      style={[styles.wrapper, wrapperStyle]}
      pointerEvents="box-none"
      testID={testID}
    >
      <View style={[styles.pill, style]}>
        {children}
      </View>
    </View>
  )
}

// Attach presets as static properties for compound component pattern
export const BottomBar = Object.assign(BottomBarInner, {
  Actions: BottomBarActions,
  Search: BottomBarSearch,
  PageControl: BottomBarPageControl,
})
