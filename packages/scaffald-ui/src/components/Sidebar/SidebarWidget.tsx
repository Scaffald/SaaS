/**
 * SidebarWidget component
 * Widget components for sidebar (storage progress, trial info, messages)
 * Maps to Figma sidebar widget designs
 *
 * @example
 * ```tsx
 * import { SidebarWidget } from '@scaffald/ui'
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

import { View, Text, Pressable } from 'react-native'
import type { SidebarWidgetProps } from './Sidebar.types'
import { useSidebarContext } from './Sidebar'
import { getSidebarWidgetStyles } from './SidebarWidget.styles'
import { ProgressBar } from '../ProgressBar'
import { HelperText } from '../HelperText'
import { AlertTriangle, ChevronRight } from 'lucide-react-native'
import { colors } from '../../tokens/colors'

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
  const collapsed = collapsedProp ?? contextCollapsed

  // Calculate progress percentage
  const progressValue = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  const styles = getSidebarWidgetStyles(theme, progressValue)

  // If collapsed, show minimal representation
  if (collapsed) {
    if (type === 'progress-horizontal' || type === 'progress-vertical') {
      return (
        <View style={[styles.collapsedContainer, style]}>
          <View
            style={[
              styles.collapsedProgressIndicator,
              { width: `${progressValue}%` },
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
            <Text style={styles.progressLabel}>
              {label}
            </Text>
            <ChevronRight size={16} color={styles.iconColor} />
          </Pressable>
        </View>

        {/* Value text */}
        {valueText && (
          <Text style={styles.valueText}>
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
          <Text style={styles.progressLabel}>
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
          <Text style={styles.valueText}>
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

