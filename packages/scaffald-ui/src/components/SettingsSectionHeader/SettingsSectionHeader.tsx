/**
 * SettingsSectionHeader component
 * Reusable section header with icon, title, and description
 *
 * @example
 * ```tsx
 * import { SettingsSectionHeader } from '@scaffald/ui'
 * import { User } from 'lucide-react-native'
 *
 * <SettingsSectionHeader
 *   icon={User}
 *   title="Basic Info"
 *   description="Basic workspace info details"
 * />
 * ```
 */

import { View, Text } from 'react-native'
import type { SettingsSectionHeaderProps } from './SettingsSectionHeader.types'
import { getSettingsSectionHeaderStyles } from './SettingsSectionHeader.styles'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'

export function SettingsSectionHeader({
  icon: Icon,
  title,
  description,
  style,
  titleStyle,
  descriptionStyle,
}: SettingsSectionHeaderProps) {
  const { theme } = useThemeContext()
  const styles = getSettingsSectionHeaderStyles(theme)
  const isLight = theme === 'light'
  const iconColor = isLight ? colors.gray[800] : colors.gray[100]

  return (
    <View style={[styles.container, style]}>
      {Icon && (
        <View style={styles.iconContainer}>
          <Icon size={20} color={iconColor} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {description && <Text style={[styles.description, descriptionStyle]}>{description}</Text>}
      </View>
    </View>
  )
}
