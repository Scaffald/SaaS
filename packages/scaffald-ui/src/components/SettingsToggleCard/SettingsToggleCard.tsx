/**
 * SettingsToggleCard component
 * Card with icon, title, description, and toggle switch
 *
 * @example
 * ```tsx
 * import { SettingsToggleCard } from '@scaffald/ui'
 * import { MessageSquare } from 'lucide-react-native'
 *
 * <SettingsToggleCard
 *   icon={MessageSquare}
 *   title="Text message SMS"
 *   description="Receive a one-time passcode via SMS each time you log in."
 *   enabled={smsEnabled}
 *   onToggleChange={setSmsEnabled}
 * />
 * ```
 */

import { View, Text, Pressable } from 'react-native'
import type { SettingsToggleCardProps } from './SettingsToggleCard.types'
import { getSettingsToggleCardStyles } from './SettingsToggleCard.styles'
import { useThemeContext } from '../../theme'
import { useInteractiveState } from '../../hooks/useInteractiveState'
import { Toggle } from '../Toggle'
import { colors } from '../../tokens/colors'

export function SettingsToggleCard({
  icon: Icon,
  title,
  description,
  enabled = false,
  onToggleChange,
  disabled = false,
  style,
  onPress,
  ...pressableProps
}: SettingsToggleCardProps) {
  const { theme } = useThemeContext()
  const { isHovered, interactiveProps } = useInteractiveState(disabled)
  const styles = getSettingsToggleCardStyles(theme, enabled, disabled)
  const isLight = theme === 'light'
  const iconColor = isLight ? colors.gray[800] : colors.gray[100]

  const handlePress = () => {
    if (disabled) return
    onPress?.(undefined as any)
    onToggleChange?.(!enabled)
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      {...interactiveProps}
      style={({ pressed }) => [
        styles.container,
        isHovered && !disabled && { opacity: 0.9 },
        pressed && !disabled && { opacity: 0.8 },
        style,
      ]}
      {...pressableProps}
    >
      <View style={styles.content}>
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon size={20} color={iconColor} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </View>
      <Toggle
        checked={enabled}
        onChange={onToggleChange}
        size="sm"
        color="primary"
        disabled={disabled}
        style={{ marginTop: 2 }}
      />
    </Pressable>
  )
}
