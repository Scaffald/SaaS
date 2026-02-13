/**
 * PhoneNumberListItem component
 * Phone number list item with country flag and code
 *
 * @example
 * ```tsx
 * import { PhoneNumberListItem } from '@scaffald/ui'
 *
 * <PhoneNumberListItem
 *   countryCode="+1"
 *   countryName="United States"
 *   flagSrc="https://example.com/us-flag.png"
 * />
 * ```
 */

import { View, Text, Image } from 'react-native'
import type { PhoneNumberProps } from '../ListItem.types'
import { getListItemStyles } from '../ListItem.styles'
import { useThemeContext } from '../../../theme'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { borderRadius } from '../../../tokens/borders'

export function PhoneNumberListItem({
  flagIcon,
  flagSrc,
  countryCode,
  countryName,
  onPress,
  style,
  accessibilityLabel,
}: Omit<PhoneNumberProps, 'variant'>) {
  const { theme } = useThemeContext()
  const styles = getListItemStyles('phone-number', theme)

  return (
    <View style={[styles.container, style]}>
      {/* Flag */}
      <View style={styles.leftSection}>
        {flagIcon || (flagSrc && <Image source={{ uri: flagSrc }} style={{ width: 28, height: 28 }} />) || (
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: borderRadius.xs,
              backgroundColor: colors.gray[200],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16 }}>🇺🇸</Text>
          </View>
        )}
      </View>

      {/* Content - horizontal layout */}
      <View style={[styles.contentSection, { flexDirection: 'row', alignItems: 'center', gap: spacing[10] }]}>
        <Text style={styles.title}>{countryCode}</Text>
        <Text style={styles.subtitle}>{countryName}</Text>
      </View>
    </View>
  )
}
