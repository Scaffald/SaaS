import { Avatar, Card, ListItem, XStack, YStack, getTokens, Text } from 'tamagui'
import { User } from '@tamagui/lucide-icons'
import { Link } from 'expo-router'
import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { useUser } from '@app/core/utils/useUser'
import { Image } from 'expo-image'
import { getAvatarUrl } from '@app/core/utils/supabase/storage'
import { ScaffaldLogo } from '@app/core/assets'
import { api } from '@app/core/utils/api'

/**
 * DrawerHeader component renders the user profile section at the top of the drawer
 * Displays user avatar, name, and separate View/Edit links
 */
export const DrawerHeader = () => {
  const { profile, user } = useUser()
  const tokens = getTokens()
  const avatarSize = tokens.size.$3.val as number

  // Fetch general profile data to get first_name and last_name
  const { data: generalProfile } = api.profile.getGeneral.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Construct display name from first_name and last_name, fallback to email or "Update Profile"
  const displayName = (() => {
    if (generalProfile?.first_name && generalProfile?.last_name) {
      return `${generalProfile.first_name} ${generalProfile.last_name}`.trim()
    }
    return user?.email || 'Update Profile'
  })()

  // Get avatar URL using the same logic as profile-general-left
  const avatarUrl = getAvatarUrl(profile?.avatar_path || '')

  // Get user ID for profile viewing
  const userId = user?.id || ''

  // Routes for View and Edit actions
  const viewProfileHref = RouteBuilder.dashboardUser(userId)
  const editProfileHref = ROUTES.DASHBOARD_PROFILE_GENERAL.path

  return (
    <YStack gap="$4" shrink={0}>
      {/* Logo Section */}
      <XStack justify="center" py="$2">
        <ScaffaldLogo height={20} />
      </XStack>

      {/* Profile Section */}
      <Card px="$4" py="$3" gap="$3" rounded="$5" borderColor="$color4" bg="$color4">
        <ListItem
          size="$4"
          px="$0"
          py="$0"
          bg="transparent"
          title={displayName}
          subTitle={
            <XStack gap="$2" ai="center">
              <Link href={viewProfileHref} asChild>
                <Text color="$blue10" fontSize="$3" cursor="pointer" hoverStyle={{ opacity: 0.7 }}>
                  View
                </Text>
              </Link>
              <Text color="$color8" fontSize="$3">
                •
              </Text>
              <Link href={editProfileHref} asChild>
                <Text color="$blue10" fontSize="$3" cursor="pointer" hoverStyle={{ opacity: 0.7 }}>
                  Edit
                </Text>
              </Link>
            </XStack>
          }
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
      </Card>
    </YStack>
  )
}
