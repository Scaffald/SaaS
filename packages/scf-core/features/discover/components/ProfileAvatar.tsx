import { Image } from 'react-native'
import { Building } from 'lucide-react-native'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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
    t === 'dark' ? colors.blue[300] : colors.blue[600],
    t === 'dark' ? colors.green[300] : colors.green[600],
    t === 'dark' ? colors.blue[300] : colors.blue[600],
    t === 'dark' ? colors.error[300] : colors.error[600],
    t === 'dark' ? colors.pink[300] : colors.pink[600],
    t === 'dark' ? colors.error[300] : colors.error[600],
    t === 'dark' ? colors.yellow[300] : colors.yellow[600],
    colors.text[t].primary,
  ]
  const bgColor = bgColors[colorIndex]

  // If avatar URL exists and is not empty, show image
  if (avatarUrl && avatarUrl.trim() !== '') {
    return (
      <Row
        width={size}
        height={size}
        borderRadius={12}
        style={{ overflow: 'hidden', borderWidth: 1, borderColor: colors.border[t].default }}
      >
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} resizeMode="cover" />
      </Row>
    )
  }

  // Fallback: show initials or organization icon
  return (
    <Stack
      width={size}
      height={size}
      borderRadius={12}
      style={{ backgroundColor: bgColor, borderWidth: 1, borderColor: colors.border[t].default }}
      align="center"
      justify="center"
    >
      {isOrganization ? (
        <Building size={Math.round(size * 0.5) as 16 | 20 | 24} color="white" />
      ) : (
        <Text style={{ color: 'white' }}>{initials}</Text>
      )}
    </Stack>
  )
}
