import { memo } from 'react'
import type { SizeTokens } from 'tamagui'
import { Avatar, Text, XStack } from 'tamagui'

export interface AvatarGroupAvatar {
  /** Optional image source URL */
  src?: string
  /** Name for fallback initial display */
  name: string
}

export interface AvatarGroupProps {
  /** Array of avatar data */
  avatars: AvatarGroupAvatar[]
  /** Maximum number of avatars to display before showing overflow */
  maxVisible?: number
  /** Size of each avatar */
  size?: number | SizeTokens
}

/**
 * AvatarGroup - Component for displaying multiple user avatars
 *
 * Displays overlapping avatars with an overflow count indicator.
 * Used in Kanban cards and other contexts where multiple users are shown.
 *
 * @example
 * ```tsx
 * <AvatarGroup
 *   avatars={[
 *     { src: '/user1.jpg', name: 'John Doe' },
 *     { src: '/user2.jpg', name: 'Jane Smith' },
 *     { name: 'Bob Johnson' }
 *   ]}
 *   maxVisible={3}
 *   size="$4"
 * />
 * ```
 */
export const AvatarGroup = memo(({ avatars, maxVisible = 5, size = '$4' }: AvatarGroupProps) => {
  if (avatars.length === 0) {
    return null
  }

  const displayAvatars = avatars.slice(0, maxVisible)
  const overflowCount = avatars.length - maxVisible

  return (
    <XStack items="center" gap="$1">
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={`${avatar.name}-${index}`}
          circular
          size={size}
          style={{
            marginLeft: index > 0 ? -8 : 0,
            borderWidth: 2,
            borderColor: '$background',
            zIndex: displayAvatars.length - index,
          }}
        >
          {avatar.src ? <Avatar.Image src={avatar.src} /> : null}
          <Avatar.Fallback bg="$blue9">
            <Text color="white" fontWeight="600" fontSize="$2">
              {avatar.name.charAt(0).toUpperCase()}
            </Text>
          </Avatar.Fallback>
        </Avatar>
      ))}
      {overflowCount > 0 && (
        <Avatar
          circular
          size={size}
          bg="$color5"
          style={{
            marginLeft: -8,
            borderWidth: 2,
            borderColor: '$background',
            zIndex: 0,
          }}
        >
          <Text color="$color11" fontWeight="600" fontSize="$2">
            +{overflowCount}
          </Text>
        </Avatar>
      )}
    </XStack>
  )
})

AvatarGroup.displayName = 'AvatarGroup'
