/**
 * ActivityView (Share Sheet) styles
 * iOS 26 design from Figma
 */

import type { ViewStyle, TextStyle, ImageStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ResolvedThemeMode } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { shadows } from '../../tokens/shadows'

export function getActivityViewStyles(theme: ResolvedThemeMode) {
  const overlay: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg[theme].overlay,
    justifyContent: 'flex-end',
    alignItems: 'center',
  }

  const glassBackground = Platform.OS === 'web'
    ? theme === 'light'
      ? 'rgba(245, 245, 245, 0.6)'
      : 'rgba(44, 44, 46, 0.7)'
    : theme === 'light'
      ? 'rgba(245, 245, 245, 0.92)'
      : 'rgba(44, 44, 46, 0.95)'

  const container: ViewStyle = {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderTopLeftRadius: borderRadius.sheet,
    borderTopRightRadius: borderRadius.sheet,
    backgroundColor: glassBackground,
    ...shadows.iosSheet,
    overflow: 'hidden',
  }

  if (Platform.OS === 'web') {
    (container as Record<string, unknown>).backdropFilter = 'blur(50px)';
    (container as Record<string, unknown>).WebkitBackdropFilter = 'blur(50px)';
  }

  // Header
  const header: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  }

  const headerThumbnail: ImageStyle = {
    width: 48,
    height: 48,
    borderRadius: 10,
  }

  const headerTextArea: ViewStyle = {
    flex: 1,
    gap: 2,
  }

  const headerTitle: TextStyle = {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.labels[theme].primary,
  }

  const headerSubtitle: TextStyle = {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.labelsVibrant[theme].secondary,
  }

  const closeButton: ViewStyle = {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.fills[theme].secondary,
    alignItems: 'center',
    justifyContent: 'center',
  }

  const closeButtonText: TextStyle = {
    fontSize: 15,
    fontWeight: '600',
    color: colors.labelsVibrant[theme].secondary,
  }

  // Collaborate button
  const collaborateButton: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.fills[theme].secondary,
    marginHorizontal: 20,
    marginBottom: 8,
    gap: 6,
  }

  const collaborateText: TextStyle = {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.accents[theme].blue,
  }

  const collaborateSubtitle: TextStyle = {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.accents[theme].blue,
    paddingHorizontal: 20,
    marginBottom: 12,
  }

  // Contacts row
  const contactsRow: ViewStyle = {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  }

  const contactItem: ViewStyle = {
    alignItems: 'center',
    gap: 6,
    width: 64,
  }

  const contactAvatar: ImageStyle = {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.fills[theme].tertiary,
  }

  const contactName: TextStyle = {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 13,
    color: colors.labels[theme].primary,
    textAlign: 'center',
    numberOfLines: 2,
  } as TextStyle

  // App icons row
  const appsRow: ViewStyle = {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  }

  const appItem: ViewStyle = {
    alignItems: 'center',
    gap: 6,
    width: 64,
  }

  const appIcon: ViewStyle = {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  const appName: TextStyle = {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 13,
    color: colors.labels[theme].primary,
    textAlign: 'center',
  }

  // Quick actions grid
  const actionsGrid: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
  }

  const actionItem: ViewStyle = {
    width: 72,
    height: 72,
    borderRadius: borderRadius.menuAction,
    backgroundColor: colors.fillsVibrant[theme].tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
  }

  const actionLabel: TextStyle = {
    fontSize: 11,
    fontWeight: '510' as TextStyle['fontWeight'],
    lineHeight: 13,
    color: colors.labelsVibrant[theme].primary,
    textAlign: 'center',
  }

  const actionLabelDestructive: TextStyle = {
    ...actionLabel,
    color: colors.accents[theme].red,
  }

  // Grouped list sections
  const sectionContainer: ViewStyle = {
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: colors.fills[theme].quaternary,
    overflow: 'hidden',
  }

  const sectionTitle: TextStyle = {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.labelsVibrant[theme].secondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  }

  const listItem: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  }

  const listItemPressed: ViewStyle = {
    backgroundColor: colors.fills[theme].tertiary,
  }

  const listItemIcon: ViewStyle = {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  }

  const listItemLabel: TextStyle = {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.43,
    color: colors.labels[theme].primary,
    flex: 1,
  }

  const listSeparator: ViewStyle = {
    height: 1,
    backgroundColor: colors.separators[theme].vibrant,
    marginLeft: 56, // icon width + gap
  }

  // Edit Actions footer
  const editActionsButton: ViewStyle = {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginVertical: 12,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.fills[theme].secondary,
  }

  const editActionsText: TextStyle = {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.labels[theme].primary,
  }

  // Scroll content
  const scrollContent: ViewStyle = {
    paddingBottom: 34, // Safe area
  }

  return {
    overlay,
    container,
    header,
    headerThumbnail,
    headerTextArea,
    headerTitle,
    headerSubtitle,
    closeButton,
    closeButtonText,
    collaborateButton,
    collaborateText,
    collaborateSubtitle,
    contactsRow,
    contactItem,
    contactAvatar,
    contactName,
    appsRow,
    appItem,
    appIcon,
    appName,
    actionsGrid,
    actionItem,
    actionLabel,
    actionLabelDestructive,
    sectionContainer,
    sectionTitle,
    listItem,
    listItemPressed,
    listItemIcon,
    listItemLabel,
    listSeparator,
    editActionsButton,
    editActionsText,
    scrollContent,
  }
}
