/**
 * UserProfile01ListItem component
 * User profile list item with follow button
 *
 * @example
 * ```tsx
 * import { UserProfile01ListItem } from '@scaffald/ui'
 *
 * <UserProfile01ListItem
 *   name="Tina Hernandez"
 *   username="@tinahernan90"
 *   description="Passionate Senior Product Designer"
 *   avatarSrc="https://example.com/avatar.jpg"
 *   onFollowPress={() => console.log('Follow')}
 *   showVerified
 * />
 * ```
 */

import { View, Text } from 'react-native'
import type { UserProfile01Props } from '../ListItem.types'
import { getListItemStyles } from '../ListItem.styles'
import { useThemeContext } from '../../../theme'
import { Avatar } from '../../Avatar'
import { Button } from '../../Button'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'

export function UserProfile01ListItem({
  avatarSrc,
  avatarInitials,
  name,
  username,
  description,
  onFollowPress,
  showVerified,
  onPress,
  style,
  accessibilityLabel,
}: Omit<UserProfile01Props, 'variant'>) {
  const { theme } = useThemeContext()
  const styles = getListItemStyles('user-profile-01', theme)

  return (
    <View style={[styles.container, style]}>
      {/* Avatar */}
      <View style={styles.leftSection}>
        <Avatar
          size={48}
          src={avatarSrc}
          initials={avatarInitials}
          status={showVerified ? 'online' : undefined}
          verified={showVerified}
        />
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        {/* Name and username */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
          <Text style={styles.title}>{name}</Text>
          {showVerified && (
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: colors.primary[500],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.gray[0], fontSize: 10 }}>✓</Text>
            </View>
          )}
          <Text style={styles.subtitle}>{username}</Text>
        </View>

        {/* Description */}
        {description && <Text style={styles.description}>{description}</Text>}
      </View>

      {/* Follow button */}
      {onFollowPress && (
        <View style={styles.rightSection}>
          <Button
            color="primary"
            variant="filled"
            size="sm"
            onPress={onFollowPress}
            style={{ minWidth: 80 }}
          >
            Follow
          </Button>
        </View>
      )}
    </View>
  )
}
