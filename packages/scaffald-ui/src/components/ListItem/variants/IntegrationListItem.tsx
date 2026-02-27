/**
 * IntegrationListItem component
 * Integration list item with icon and chevron
 *
 * @example
 * ```tsx
 * import { IntegrationListItem } from '@scaffald/ui'
 *
 * <IntegrationListItem
 *   name="Slack"
 *   iconSrc="https://example.com/slack-icon.png"
 *   onPress={() => console.log('Integration pressed')}
 * />
 * ```
 */

import { View, Text, Image } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import type { IntegrationProps } from '../ListItem.types'
import { getListItemStyles } from '../ListItem.styles'
import { useThemeContext } from '../../../theme'
import { colors } from '../../../tokens/colors'
import { borderRadius } from '../../../tokens/borders'

export function IntegrationListItem({
  icon,
  iconSrc,
  name,
  onPress,
  style,
  accessibilityLabel,
}: Omit<IntegrationProps, 'variant'>) {
  const { theme } = useThemeContext()
  const styles = getListItemStyles('integration', theme)

  return (
    <View style={[styles.container, style]}>
      {/* Icon */}
      <View style={styles.leftSection}>
        {icon || (iconSrc && <Image source={{ uri: iconSrc }} style={{ width: 24, height: 24 }} />) || (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: borderRadius.xs,
              backgroundColor: colors.gray[200],
            }}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        <Text style={styles.title}>{name}</Text>
      </View>

      {/* Chevron */}
      <View style={styles.rightSection}>
        <ChevronRight size={24} color={colors.text[theme].tertiary} />
      </View>
    </View>
  )
}
