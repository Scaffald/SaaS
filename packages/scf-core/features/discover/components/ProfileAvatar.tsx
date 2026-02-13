import { Building } from 'lucide-react-native'
import { type GetThemeValueForKey, Image, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { getInitials } from '../utils/getInitials'

type ProfileAvatarProps = {
  name: string
  avatarUrl?: string | null
  size?: number
  isOrganization?: boolean
}

/**
 * Profile avatar component with fallback to initials
 * Shows avatar image if available, otherwise displays initials
 */
export const ProfileAvatar = ({
  name,
  avatarUrl,
  size = 48,
  isOrganization = false,
}: ProfileAvatarProps) => {
  const initials = getInitials(name)

  // Generate a consistent color based on the name
  const getColorIndex = (str: string): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % 8
  }

  const colorIndex = getColorIndex(name)

  // Map index to color
  const bgColors = [
    '$blue10',
    '$green10',
    '$blue10',
    '$red10',
    '$pink10',
    '$red10',
    '$yellow10',
    '$color10',
  ]
  const bgColor = bgColors[colorIndex] as GetThemeValueForKey<'backgroundColor'>

  // If avatar URL exists and is not empty, show image
  if (avatarUrl && avatarUrl.trim() !== '') {
    return (
      <Row
        width={size}
        height={size}
        borderRadius="$12"
        overflow="hidden"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Image source={{ uri: avatarUrl }} width={size} height={size} resizeMode="cover" />
      </Row>
    )
  }

  // Fallback: show initials or organization icon
  return (
    <Stack
      width={size}
      height={size}
      borderRadius="$12"
      backgroundColor={bgColor}
      align="center"
      justify="center"
      borderWidth={1}
      borderColor="$borderColor"
    >
      {isOrganization ? (
        <Building size={Math.round(size * 0.5)} color="white" />
      ) : (
        <Text color="white">{initials}</Text>
      )}
    </Stack>
  )
}
