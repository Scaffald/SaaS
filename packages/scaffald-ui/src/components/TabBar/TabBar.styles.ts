/**
 * TabBar styles
 * iOS 26 glassmorphic floating pill bar
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { shadows, boxShadows } from '../../tokens/shadows'
import type { ResolvedThemeMode } from '../../tokens/colors'

// ============================================================================
// Constants
// ============================================================================

/** Glass background per theme */
const GLASS_BG = {
  light: 'rgba(245, 245, 245, 0.6)',
  dark: 'rgba(44, 44, 46, 0.7)',
} as const

const ITEM_WIDTH = 72
const ICON_SIZE = 18
const LABEL_FONT_SIZE = 10
const ITEM_PADDING_TOP = 6
const ITEM_PADDING_BOTTOM = 7
const ITEM_PADDING_HORIZONTAL = 8
const ICON_LABEL_GAP = 0.5

// ============================================================================
// Types
// ============================================================================

export interface TabBarStyleConfig {
  /** Outer safe-area wrapper */
  wrapper: ViewStyle
  /** Row containing leading action + pill + trailing action */
  row: ViewStyle
  /** The glassmorphic pill container */
  pill: ViewStyle
  /** Individual tab item pressable */
  item: ViewStyle
  /** Selected item background pill */
  itemSelected: ViewStyle
  /** Icon-only item (no label) */
  itemIconOnly: ViewStyle
  /** Selected icon-only item */
  itemIconOnlySelected: ViewStyle
  /** Icon wrapper */
  iconWrapper: ViewStyle
  /** Label text */
  label: TextStyle
  /** Selected label text */
  labelSelected: TextStyle
  /** Unselected icon/label color */
  unselectedColor: string
  /** Selected icon/label color */
  selectedColor: string
  /** Leading/trailing action wrapper */
  actionSlot: ViewStyle
  /** Badge container */
  badge: ViewStyle
  /** Badge text */
  badgeText: TextStyle
}

// ============================================================================
// Style Factory
// ============================================================================

export function getTabBarStyles(theme: ResolvedThemeMode): TabBarStyleConfig {
  const selectedColor = colors.accents[theme].blue
  const unselectedColor = colors.labelsVibrant[theme].primary
  const selectedBg = colors.fillsVibrant[theme].tertiary

  // -- Outer wrapper --
  const wrapper: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 8, // safe area handled by consumer or added here as base
    paddingHorizontal: 16,
  }

  // -- Row with optional leading/trailing actions --
  const row: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  }

  // -- Glassmorphic pill --
  const pill: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GLASS_BG[theme],
    borderRadius: borderRadius.sheet, // 34
    paddingHorizontal: 4,
    paddingVertical: 2,
    ...shadows.iosSheet,
  }

  if (Platform.OS === 'web') {
    const webPill = pill as Record<string, unknown>
    webPill.backdropFilter = 'blur(50px)'
    webPill.WebkitBackdropFilter = 'blur(50px)'
    webPill.boxShadow = boxShadows.iosSheet
    // Remove RN shadow props on web — boxShadow handles it
    delete webPill.shadowColor
    delete webPill.shadowOffset
    delete webPill.shadowOpacity
    delete webPill.shadowRadius
    delete webPill.elevation
  }

  // -- Tab item (icon + label) --
  const item: ViewStyle = {
    width: ITEM_WIDTH,
    paddingTop: ITEM_PADDING_TOP,
    paddingBottom: ITEM_PADDING_BOTTOM,
    paddingHorizontal: ITEM_PADDING_HORIZONTAL,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ICON_LABEL_GAP,
    borderRadius: borderRadius.pill, // 100
  }

  const itemSelected: ViewStyle = {
    ...item,
    backgroundColor: selectedBg,
  }

  // -- Icon-only item --
  const itemIconOnly: ViewStyle = {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  }

  const itemIconOnlySelected: ViewStyle = {
    ...itemIconOnly,
    backgroundColor: selectedBg,
  }

  // -- Icon wrapper --
  const iconWrapper: ViewStyle = {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  }

  // -- Label --
  const label: TextStyle = {
    fontSize: LABEL_FONT_SIZE,
    fontWeight: '600', // semibold (590)
    letterSpacing: -0.1,
    textAlign: 'center',
    color: unselectedColor,
  }

  const labelSelected: TextStyle = {
    ...label,
    color: selectedColor,
  }

  // -- Leading/trailing action slot --
  const actionSlot: ViewStyle = {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  }

  // -- Badge --
  const badge: ViewStyle = {
    position: 'absolute',
    top: 2,
    right: 10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accents[theme].red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  }

  const badgeText: TextStyle = {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  }

  return {
    wrapper,
    row,
    pill,
    item,
    itemSelected,
    itemIconOnly,
    itemIconOnlySelected,
    iconWrapper,
    label,
    labelSelected,
    unselectedColor,
    selectedColor,
    actionSlot,
    badge,
    badgeText,
  }
}
