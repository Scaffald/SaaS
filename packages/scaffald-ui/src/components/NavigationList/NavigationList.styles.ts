/**
 * NavigationList styles
 * iOS 26 sidebar navigation list — mapped from Figma node 5704:37671
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ResolvedThemeMode } from '../../tokens/colors'

export interface NavigationListStyleConfig {
  container: ViewStyle
  searchContainer: ViewStyle
  searchInput: ViewStyle & TextStyle
  searchIconContainer: ViewStyle
  toolbarRow: ViewStyle
  toolbarButton: ViewStyle
  toolbarButtonText: TextStyle
  sectionContainer: ViewStyle
  sectionHeaderRow: ViewStyle
  sectionHeaderTitle: TextStyle
  sectionHeaderDetail: TextStyle
  sectionHeaderChevron: TextStyle
  separator: ViewStyle
  itemContainer: ViewStyle
  itemContainerSelected: ViewStyle
  itemIconContainer: ViewStyle
  itemIcon: TextStyle
  itemIconSelected: TextStyle
  itemIconDisabled: TextStyle
  itemLabel: TextStyle
  itemLabelSelected: TextStyle
  itemLabelDisabled: TextStyle
  itemTrailing: ViewStyle
  itemDetailText: TextStyle
  itemDetailTextSelected: TextStyle
}

const INDENT_STEP = 20
const ITEM_HEIGHT = 44
const SEARCH_HEIGHT = 36
const ICON_AREA_WIDTH = 28

export function getNavigationListStyles(
  theme: ResolvedThemeMode
): NavigationListStyleConfig {
  return {
    container: {
      flex: 1,
      flexDirection: 'column',
    },

    // -- Search bar --
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: SEARCH_HEIGHT,
      backgroundColor: colors.fills[theme].secondary,
      borderRadius: 10,
      marginHorizontal: 8,
      marginBottom: 8,
      paddingHorizontal: 8,
    },
    searchInput: {
      flex: 1,
      height: SEARCH_HEIGHT,
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.43,
      color: colors.labelsVibrant[theme].primary,
      paddingHorizontal: 6,
      paddingVertical: 0,
      backgroundColor: 'transparent',
    },
    searchIconContainer: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // -- Toolbar --
    toolbarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 12,
    },
    toolbarButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    toolbarButtonText: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.43,
      color: colors.accents[theme].blue,
    },

    // -- Section --
    sectionContainer: {
      flexDirection: 'column',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 6,
    },
    sectionHeaderTitle: {
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: -0.08,
      fontWeight: '510' as unknown as TextStyle['fontWeight'],
      color: colors.labelsVibrant[theme].secondary,
      textTransform: 'uppercase',
    },
    sectionHeaderDetail: {
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: -0.08,
      color: colors.labelsVibrant[theme].secondary,
    },
    sectionHeaderChevron: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelsVibrant[theme].secondary,
      marginLeft: 2,
    },

    separator: {
      height: 1,
      backgroundColor: colors.separators[theme].vibrant,
      marginHorizontal: 16,
    },

    // -- Item --
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: ITEM_HEIGHT,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginHorizontal: 4,
    },
    itemContainerSelected: {
      backgroundColor: colors.accents[theme].blue + '1A', // ~10% opacity
    },

    itemIconContainer: {
      width: ICON_AREA_WIDTH,
      height: ICON_AREA_WIDTH,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    itemIcon: {
      fontSize: 20,
      color: colors.labelsVibrant[theme].primary,
    },
    itemIconSelected: {
      color: colors.accents[theme].blue,
    },
    itemIconDisabled: {
      color: colors.labelsVibrant[theme].tertiary,
    },

    itemLabel: {
      flex: 1,
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.43,
      fontWeight: '400' as unknown as TextStyle['fontWeight'],
      color: colors.labelsVibrant[theme].primary,
    },
    itemLabelSelected: {
      color: colors.accents[theme].blue,
      fontWeight: '600' as unknown as TextStyle['fontWeight'],
    },
    itemLabelDisabled: {
      color: colors.labelsVibrant[theme].tertiary,
    },

    itemTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    itemDetailText: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.43,
      color: colors.labelsVibrant[theme].secondary,
    },
    itemDetailTextSelected: {
      color: colors.accents[theme].blue,
    },
  }
}

/**
 * Compute the left padding for an indentation level (0, 1, 2).
 */
export function getIndentPadding(indent: number = 0): number {
  return indent * INDENT_STEP
}
