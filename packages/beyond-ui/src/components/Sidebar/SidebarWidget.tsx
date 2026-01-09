/**
 * SidebarWidget component
 * Widget components for sidebar (storage progress, trial info, messages)
 * Maps to Figma sidebar widget designs
 *
 * @example
 * ```tsx
 * import { SidebarWidget } from '@unicornlove/beyond-ui'
 *
 * // Progress widget
 * <SidebarWidget
 *   type="progress-horizontal"
 *   label="Storage used"
 *   value={40}
 *   valueText="178MB of 445MB"
 * />
 *
 * // Message widget
 * <SidebarWidget
 *   type="message-horizontal"
 *   message="7 days left in trial"
 *   buttonText="Upgrade"
 *   onButtonPress={() => {}}
 * />
 * ```
 */

import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { SidebarWidgetProps } from './Sidebar.types'
import { useSidebarContext } from './Sidebar'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { ProgressBar } from '../ProgressBar'
import { HelperText } from '../HelperText'
import { AlertTriangle, ChevronRight } from 'lucide-react-native'

/**
 * SidebarWidget component
 */
export function SidebarWidget({
  type = 'progress-horizontal',
  label,
  value = 0,
  max = 100,
  valueText,
  message,
  buttonText,
  onButtonPress,
  collapsed: collapsedProp,
  style,
}: SidebarWidgetProps) {
  const { collapsed: contextCollapsed, theme } = useSidebarContext()
  const isLight = theme === 'light'
  const collapsed = collapsedProp ?? contextCollapsed

  // Calculate progress percentage
  const progressValue = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  // If collapsed, show minimal representation
  if (collapsed) {
    if (type === 'progress-horizontal' || type === 'progress-vertical') {
      return (
        <View style={[styles.collapsedContainer, style]}>
          <View
            style={[
              styles.collapsedProgressIndicator,
              {
                backgroundColor: progressValue > 75 ? colors.error[500] : colors.primary[500],
                width: `${progressValue}%`,
              },
            ]}
          />
        </View>
      )
    }
    return null
  }

  // Progress horizontal widget
  if (type === 'progress-horizontal') {
    return (
      <View style={[styles.progressHorizontalContainer, style]}>
        {/* Top row: Label and arrow */}
        <View style={styles.progressHeader}>
          <Pressable
            onPress={onButtonPress}
            style={styles.labelButton}
          >
            <Text
              style={[
                styles.progressLabel,
                {
                  color: isLight ? colors.text.light.primary : colors.text.dark.primary,
                },
              ]}
            >
              {label}
            </Text>
            <ChevronRight size={16} color={isLight ? colors.icon.light.default : colors.icon.dark.default} />
          </Pressable>
        </View>

        {/* Value text */}
        {valueText && (
          <Text
            style={[
              styles.valueText,
              {
                color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
              },
            ]}
          >
            {valueText}
          </Text>
        )}

        {/* Progress bar */}
        <ProgressBar
          value={progressValue}
          orientation="horizontal"
          color={progressValue > 75 ? 'error' : 'primary'}
          showLabel={false}
          showIndicator={false}
          style={styles.progressBar}
        />
      </View>
    )
  }

  // Progress vertical widget
  if (type === 'progress-vertical') {
    return (
      <View style={[styles.progressVerticalContainer, style]}>
        {/* Top row: Label and indicator */}
        <View style={styles.progressHeader}>
          <Text
            style={[
              styles.progressLabel,
              {
                color: isLight ? colors.text.light.primary : colors.text.dark.primary,
              },
            ]}
          >
            {label}
          </Text>
          <ProgressBar
            value={progressValue}
            orientation="vertical"
            color={progressValue > 75 ? 'error' : 'primary'}
            showLabel={false}
            showIndicator={true}
            indicatorCustomText={`${Math.round(progressValue)}%`}
          />
        </View>

        {/* Value text */}
        {valueText && (
          <Text
            style={[
              styles.valueText,
              {
                color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
              },
            ]}
          >
            {valueText}
          </Text>
        )}
      </View>
    )
  }

  // Message horizontal widget
  if (type === 'message-horizontal') {
    return (
      <View style={[styles.messageHorizontalContainer, style]}>
        <HelperText
          type="warning"
          showIcon={true}
          icon={<AlertTriangle size={16} color={colors.warning[500]} />}
        >
          {message || ''}
        </HelperText>
        {buttonText && (
          <Pressable
            onPress={onButtonPress}
            style={styles.upgradeButton}
          >
            <Text style={styles.upgradeButtonText}>{buttonText}</Text>
          </Pressable>
        )}
      </View>
    )
  }

  // Message vertical widget
  if (type === 'message-vertical') {
    return (
      <View style={[styles.messageVerticalContainer, style]}>
        <HelperText
          type="warning"
          showIcon={true}
          icon={<AlertTriangle size={16} color={colors.warning[500]} />}
        >
          {message || ''}
        </HelperText>
        {buttonText && (
          <Pressable
            onPress={onButtonPress}
            style={styles.upgradeButton}
          >
            <Text style={styles.upgradeButtonText}>{buttonText}</Text>
          </Pressable>
        )}
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  collapsedContainer: {
    height: 4,
    marginHorizontal: spacing[12],
    marginVertical: spacing[4],
    backgroundColor: colors.bg.light['200'],
    borderRadius: borderRadius.max,
    overflow: 'hidden',
  },
  collapsedProgressIndicator: {
    height: '100%',
    borderRadius: borderRadius.max,
  },
  progressHorizontalContainer: {
    gap: spacing[6],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  progressVerticalContainer: {
    gap: spacing[6],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
  labelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  progressLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
  },
  valueText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.small.lineHeight,
  },
  progressBar: {
    marginTop: spacing[4],
  },
  messageHorizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  messageVerticalContainer: {
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  upgradeButton: {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
    borderRadius: borderRadius.s,
    backgroundColor: colors.primary[500],
  },
  upgradeButtonText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.white,
    lineHeight: typography.small.lineHeight,
  },
})

