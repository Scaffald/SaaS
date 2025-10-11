import { Avatar, Card, ListItem, XStack, YStack, getTokens } from 'tamagui'
import { ChevronRight, User } from '@tamagui/lucide-icons'
import type { GestureResponderEvent } from 'react-native'
import { Link } from 'expo-router'
import { DASHBOARD_ROUTES } from '@app/core/constants/routes'
import { useUser } from '@app/core/utils/useUser'
import { Image } from 'expo-image'
import { getAvatarUrl } from '@app/core/utils/supabase/storage'
import { ScaffaldLogo } from '@app/core/assets'

type DrawerHeaderProps = {
  onNavigate?: (href: string, event: GestureResponderEvent) => void
}

// Extended profile type that includes the tRPC profile fields
type ExtendedProfile = {
  id: string
  name: string | null
  avatar_path: string | null
  created_at: string
  updated_at: string
  first_name?: string
  last_name?: string
}

/**
 * DrawerHeader component renders the user profile section at the top of the drawer
 * Displays user avatar, name, and "Edit Profile" subtitle with navigation to profile page
 */
export const DrawerHeader = ({ onNavigate }: DrawerHeaderProps) => {
  const { profile } = useUser()
  const profileHref = DASHBOARD_ROUTES.PROFILE.path
  const tokens = getTokens()
  const avatarSize = tokens.size.$3.val as number

  // Construct display name from first_name and last_name, fallback to "Update Profile"
  const displayName = (() => {
    const extendedProfile = profile as ExtendedProfile | null
    const firstName = extendedProfile?.first_name || ''
    const lastName = extendedProfile?.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim()
    return fullName || 'Update Profile'
  })()

  // Get avatar URL using the same logic as profile-general-left
  const avatarUrl = getAvatarUrl((profile as ExtendedProfile | null)?.avatar_path || '')

  const handleManagePress = (event: GestureResponderEvent) => {
    onNavigate?.(profileHref, event)
  }

  return (
    <YStack gap="$4" shrink={0}>
      {/* Logo Section */}
      <XStack justify="center" py="$2">
        <ScaffaldLogo height={20} />
      </XStack>

      {/* Profile Section */}
      <Card px="$4" py="$3" gap="$3" rounded="$5" borderColor="$color4" bg="$color4">
        <Link href={profileHref} asChild>
          <ListItem
            hoverTheme
            pressTheme
            size="$4"
            px="$0"
            py="$0"
            bg="transparent"
            onPress={handleManagePress}
            title={displayName}
            subTitle={'Edit Profile'}
            icon={() => (
              <Avatar circular size="$3">
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
                    contentFit="cover"
                  />
                ) : (
                  <User size={avatarSize * 0.6} color="$color10" />
                )}
              </Avatar>
            )}
          />
        </Link>
      </Card>
    </YStack>
  )
}
