/**
 * ContextMenu styles
 * iOS 26 glassmorphic context menu design from Figma
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ResolvedThemeMode } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { shadows } from '../../tokens/shadows'

export function getContextMenuStyles(theme: ResolvedThemeMode) {
  const overlay: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg[theme].overlay,
    justifyContent: 'center',
    alignItems: 'center',
  }

  const container: ViewStyle = {
    width: '100%' as unknown as number,
    maxWidth: 280,
    borderRadius: borderRadius.menuContainer,
    paddingVertical: 10,
    ...shadows.iosSheet,
    // Glass background
    ...(Platform.OS === 'web'
      ? {
          backgroundColor: theme === 'light'
            ? 'rgba(245, 245, 245, 0.6)'
            : 'rgba(44, 44, 46, 0.7)',
        }
      : {
          backgroundColor: theme === 'light'
            ? 'rgba(245, 245, 245, 0.88)'
            : 'rgba(44, 44, 46, 0.92)',
        }),
  }

  // Apply backdrop-filter on web
  if (Platform.OS === 'web') {
    (container as Record<string, unknown>).backdropFilter = 'blur(50px)';
    (container as Record<string, unknown>).WebkitBackdropFilter = 'blur(50px)';
  }

  // ── Quick Actions Bar ──────────────────────────────────────────────

  const quickActionsBar: ViewStyle = {
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 6,
  }

  const quickActionButton: ViewStyle = {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.menuAction,
    backgroundColor: colors.fillsVibrant[theme].tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  }

  const quickActionButtonPressed: ViewStyle = {
    backgroundColor: colors.fills[theme].primary,
  }

  const quickActionIconArea: ViewStyle = {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  }

  const quickActionLabel: TextStyle = {
    fontSize: 12,
    fontWeight: '510' as TextStyle['fontWeight'],
    lineHeight: 16,
    color: colors.labelsVibrant[theme].primary,
    textAlign: 'center',
  }

  const quickActionLabelDestructive: TextStyle = {
    ...quickActionLabel,
    color: colors.accents[theme].red,
  }

  // ── Separator ──────────────────────────────────────────────────────

  const separatorContainer: ViewStyle = {
    height: 21,
    paddingHorizontal: 8,
    justifyContent: 'center',
  }

  const separatorLine: ViewStyle = {
    height: 1,
    backgroundColor: colors.separators[theme].vibrant,
  }

  // ── Section Title ──────────────────────────────────────────────────

  const sectionTitle: TextStyle = {
    fontSize: 13,
    fontWeight: '510' as TextStyle['fontWeight'],
    lineHeight: 18,
    color: colors.labelsVibrant[theme].tertiary,
    paddingTop: 4,
    paddingBottom: 10,
    paddingHorizontal: 8,
  }

  // ── Menu Items ─────────────────────────────────────────────────────

  const menuItemsSection: ViewStyle = {
    paddingHorizontal: 16,
  }

  const menuItem: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
    paddingRight: 8,
  }

  const menuItemPressed: ViewStyle = {
    backgroundColor: colors.fills[theme].primary,
    borderRadius: borderRadius.l,
  }

  const menuItemLeadingIcon: ViewStyle = {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  }

  const menuItemContent: ViewStyle = {
    flex: 1,
    flexDirection: 'column',
    gap: 0,
  }

  const menuItemLabel: TextStyle = {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.43,
    paddingVertical: 10,
    color: colors.labelsVibrant[theme].primary,
  }

  const menuItemLabelDestructive: TextStyle = {
    ...menuItemLabel,
    color: colors.accents[theme].red,
  }

  const menuItemLabelDisabled: TextStyle = {
    ...menuItemLabel,
    color: colors.labelsVibrant[theme].tertiary,
  }

  const menuItemSubtitle: TextStyle = {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.labelsVibrant[theme].secondary,
    paddingBottom: 8,
  }

  const menuItemSubtitleDisabled: TextStyle = {
    ...menuItemSubtitle,
    color: colors.labelsVibrant[theme].tertiary,
  }

  const menuItemTrailing: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
  }

  const menuItemShortcutText: TextStyle = {
    fontSize: 15,
    fontWeight: '510' as TextStyle['fontWeight'],
    lineHeight: 20,
    color: colors.labelsVibrant[theme].secondary,
    width: 14,
    textAlign: 'center',
  }

  const menuItemSubmenuArrow: TextStyle = {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    color: colors.labelsVibrant[theme].secondary,
    width: 14,
    textAlign: 'center',
  }

  const iconColorDefault = colors.labelsVibrant[theme].primary
  const iconColorDestructive = colors.accents[theme].red
  const iconColorDisabled = colors.labelsVibrant[theme].tertiary

  return {
    overlay,
    container,
    quickActionsBar,
    quickActionButton,
    quickActionButtonPressed,
    quickActionIconArea,
    quickActionLabel,
    quickActionLabelDestructive,
    separatorContainer,
    separatorLine,
    sectionTitle,
    menuItemsSection,
    menuItem,
    menuItemPressed,
    menuItemLeadingIcon,
    menuItemContent,
    menuItemLabel,
    menuItemLabelDestructive,
    menuItemLabelDisabled,
    menuItemSubtitle,
    menuItemSubtitleDisabled,
    menuItemTrailing,
    menuItemShortcutText,
    menuItemSubmenuArrow,
    iconColorDefault,
    iconColorDestructive,
    iconColorDisabled,
  }
}
