/**
 * ProgressBar component
 * Full-featured progress bar with label, indicator, bar, and hint message
 */

import { View, Text, StyleSheet } from 'react-native'
import { spacing } from '../../tokens/spacing'
import { typography } from '../../tokens/typography'
import { colors } from '../../tokens/colors'
import type { ProgressBarProps } from './ProgressBar.types'
import { ProgressBarBase } from './ProgressBarBase'
import { ProgressIndicator } from './ProgressIndicator'
import { HintMessage } from './HintMessage'
import { useThemeContext } from '../../theme'

export function ProgressBar({
  value,
  label,
  hintMessage,
  hintMessageType = 'default',
  showLabel = true,
  showIndicator = true,
  showHintMessage = true,
  showHintIcon = false,
  orientation = 'vertical',
  color = 'primary',
  indicatorIconType = 'spinner',
  indicatorCustomText,
  style,
  labelStyle,
  hintMessageStyle,
}: ProgressBarProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Get text color for label
  const getLabelColor = () => {
    return isLight ? colors.text.light.primary : colors.text.dark.primary
  }

  if (orientation === 'horizontal') {
    return (
      <View style={[styles.horizontalContainer, style]}>
        {showLabel && label && (
          <Text style={[styles.label, { color: getLabelColor() }, labelStyle]} numberOfLines={1}>
            {label}
          </Text>
        )}
        <View style={styles.horizontalBarContainer}>
          <ProgressBarBase value={value} color={color} style={styles.bar} />
        </View>
        {showIndicator && (
          <ProgressIndicator
            value={value}
            iconType={indicatorIconType}
            customText={indicatorCustomText}
          />
        )}
      </View>
    )
  }

  // Vertical orientation
  return (
    <View style={[styles.verticalContainer, style]}>
      {/* Top row: Label and Indicator */}
      <View style={styles.topRow}>
        {showLabel && label && (
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: getLabelColor() }, labelStyle]} numberOfLines={1}>
              {label}
            </Text>
            {/* Info icon next to label (from Figma design) */}
            <View
              style={{
                width: 12,
                height: 12,
                marginLeft: spacing[8],
              }}
            >
              {/* Simple arrow icon */}
              <View
                style={{
                  width: 6,
                  height: 12,
                  borderLeftWidth: 1.5,
                  borderBottomWidth: 1.5,
                  borderColor: isLight ? colors.text.light.tertiary : colors.text.dark.tertiary,
                  transform: [{ rotate: '135deg' }],
                }}
              />
            </View>
          </View>
        )}
        {showIndicator && (
          <ProgressIndicator
            value={value}
            iconType={indicatorIconType}
            customText={indicatorCustomText}
          />
        )}
      </View>

      {/* Progress bar */}
      <ProgressBarBase value={value} color={color} />

      {/* Hint message */}
      {showHintMessage && hintMessage && (
        <HintMessage
          message={hintMessage}
          type={hintMessageType}
          showIcon={showHintIcon}
          textStyle={hintMessageStyle}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  verticalContainer: {
    flexDirection: 'column',
    gap: spacing[4],
    width: '100%',
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
  },
  horizontalBarContainer: {
    flex: 1,
    minWidth: 0,
  },
  bar: {
    flex: 1,
  },
})

