/**
 * SegmentedControl styles
 * iOS 26 style — pill background, sliding white selection indicator
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ResolvedThemeMode } from '../../tokens/colors'

export interface SegmentedControlStyleConfig {
  container: ViewStyle
  segment: ViewStyle
  selectedSegment: ViewStyle
  label: TextStyle
  selectedLabel: TextStyle
}

export function getSegmentedControlStyles(
  theme: ResolvedThemeMode,
): SegmentedControlStyleConfig {
  const trackBg = colors.fills[theme].tertiary
  const selectedBg = theme === 'dark' ? 'rgba(110, 110, 115, 0.36)' : '#ffffff'

  const container: ViewStyle = {
    backgroundColor: trackBg,
    borderRadius: 100,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    overflow: 'hidden',
  }

  const segment: ViewStyle = {
    flex: 1,
    height: '100%' as unknown as number,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
  }

  const selectedSegment: ViewStyle = {
    ...segment,
    backgroundColor: selectedBg,
  }

  // Add web shadow for selected segment
  if (Platform.OS === 'web') {
    (selectedSegment as Record<string, unknown>).boxShadow =
      '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)'
    ;(selectedSegment as Record<string, unknown>).transition =
      'background-color 0.2s ease'
  }

  const label: TextStyle = {
    fontSize: 13,
    fontWeight: '500', // medium (510)
    textAlign: 'center',
    color: colors.labels[theme].primary,
    letterSpacing: -0.08,
  }

  const selectedLabel: TextStyle = {
    ...label,
    fontWeight: '600', // semibold (590)
  }

  return { container, segment, selectedSegment, label, selectedLabel }
}
