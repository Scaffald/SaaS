/**
 * UserProfile02ListItem component
 * User profile list item with view profile button
 *
 * @example
 * ```tsx
 * import { UserProfile02ListItem } from '@scaffald/ui'
 *
 * <UserProfile02ListItem
 *   name="Tina Hernandez"
 *   username="@tinahernan90"
 *   subscriptionDate="01 Jan 2024"
 *   avatarSrc="https://example.com/avatar.jpg"
 *   onViewProfilePress={() => console.log('View Profile')}
 * />
 * ```
 */

import { View, Text, Pressable } from 'react-native'
import type { UserProfile02Props } from '../ListItem.types'
import { getListItemStyles } from '../ListItem.styles'
import { useThemeContext } from '../../../theme'
import { Avatar } from '../../Avatar'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { borderRadius } from '../../../tokens/borders'
import { typographyVariants } from '../../../tokens/typography'

export function UserProfile02ListItem({
  avatarSrc,
  avatarInitials,
  name,
  username,
  subscriptionDate,
  onViewProfilePress,
  onPress,
  style,
  accessibilityLabel,
}: Omit<UserProfile02Props, 'variant'>) {
  const { theme } = useThemeContext()
  const styles = getListItemStyles('user-profile-02', theme)

  return (
    <View style={[styles.container, style]}>
      {/* Avatar */}
      <View style={styles.leftSection}>
        <Avatar size={48} src={avatarSrc} initials={avatarInitials} />
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        {/* Name and username */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
          <Text style={styles.title}>{name}</Text>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.gray[700],
            }}
          />
          <Text style={styles.subtitle}>{username}</Text>
        </View>

        {/* Subscription date */}
        {subscriptionDate && (
          <Text style={styles.subtitle}>Subscribed on {subscriptionDate}</Text>
        )}
      </View>

      {/* View Profile button */}
      {onViewProfilePress && (
        <View style={styles.rightSection}>
          <Pressable
            onPress={onViewProfilePress}
            style={{
              paddingHorizontal: spacing[16],
              paddingVertical: spacing[8],
              borderRadius: borderRadius.s,
              backgroundColor: colors.bg[theme].subtle || colors.gray[50],
            }}
          >
            <Text
              style={{
                fontFamily: typographyVariants.paragraphSMedium.fontFamily,
                fontSize: typographyVariants.paragraphSMedium.fontSize,
                fontWeight: typographyVariants.paragraphSMedium.fontWeight,
                lineHeight: typographyVariants.paragraphSMedium.lineHeight,
                color: colors.text[theme].secondary,
              }}
            >
              View Profile
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
