/**
 * StatusIndicator component
 * Compact status badge with icon and label
 *
 * @example
 * ```tsx
 * import { StatusIndicator } from '@scaffald/ui'
 *
 * // Basic status indicator
 * <StatusIndicator type="success" label="Success" />
 *
 * // With filled style
 * <StatusIndicator type="error" variant="filled" label="Error" />
 *
 * // With linear icon
 * <StatusIndicator type="caution" iconType="linear" label="Caution Minor" />
 *
 * // With dot icon
 * <StatusIndicator type="in-progress" iconType="dot" label="In Progress" />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  CircleDot,
} from 'lucide-react-native'
import type { StatusIndicatorProps } from './StatusIndicator.types'
import { useThemeContext } from '../../theme'
import { getStatusColors } from './StatusIndicator.utils'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { borderWidth } from '../../tokens/borders'

export function StatusIndicator({
  type = 'success',
  variant = 'blank',
  iconType = 'filled',
  label,
  style,
  labelStyle,
}: StatusIndicatorProps) {
  const { theme } = useThemeContext()
  const colors = getStatusColors(type, variant, theme)

  // Icon size
  const iconSize = 16

  // Render icon based on type and iconType
  const renderIcon = () => {
    // Dot icon - just a colored circle
    if (iconType === 'dot') {
      return <CircleDot size={iconSize} color={colors.icon} fill={colors.icon} />
    }

    // Filled or Linear icons - stroke based
    const strokeWidth = iconType === 'linear' ? 2 : 0
    const fill = iconType === 'filled' ? colors.icon : 'none'

    switch (type) {
      case 'caution':
        return <AlertTriangle size={iconSize} color={colors.icon} fill={fill} strokeWidth={strokeWidth} />
      case 'success':
        return <CheckCircle size={iconSize} color={colors.icon} fill={fill} strokeWidth={strokeWidth} />
      case 'error':
        return <XCircle size={iconSize} color={colors.icon} fill={fill} strokeWidth={strokeWidth} />
      case 'in-progress':
        return <AlertCircle size={iconSize} color={colors.icon} fill={fill} strokeWidth={strokeWidth} />
      case 'help':
        return <HelpCircle size={iconSize} color={colors.icon} fill={fill} strokeWidth={strokeWidth} />
      case 'undefined':
        return <AlertCircle size={iconSize} color={colors.icon} fill={fill} strokeWidth={strokeWidth} />
      default:
        return <CheckCircle size={iconSize} color={colors.icon} fill={fill} strokeWidth={strokeWidth} />
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: variant === 'outline' ? borderWidth.thin : 0,
        },
        style,
      ]}
    >
      <View style={styles.iconContainer}>{renderIcon()}</View>
      <Text style={[styles.label, { color: colors.text }, labelStyle]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.s,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
})
