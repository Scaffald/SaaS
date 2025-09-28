import { Avatar, Card, ListItem, XStack, YStack, getTokens } from 'tamagui'
import { ChevronRight } from '@tamagui/lucide-icons'
import { GestureResponderEvent } from 'react-native'
import { Link } from 'expo-router'
import { DASHBOARD_ROUTES } from '@app/core/constants/routes'
import { useUser } from '@app/core/utils/useUser'
import { Image } from 'expo-image'

type DrawerHeaderProps = {
  onNavigate?: (href: string, event: GestureResponderEvent) => void
}

/**
 * DrawerHeader component renders the user profile section at the top of the drawer
 * Displays user avatar, name, and partner ID with navigation to profile page
 */
export const DrawerHeader = ({ onNavigate }: DrawerHeaderProps) => {
  const { profile, avatarUrl } = useUser()
  const tokens = getTokens()
  const profileHref = DASHBOARD_ROUTES.PROFILE?.fullPath || '/dashboard/profile'
  const avatarSize = tokens.size['3'].val

  const handleManagePress = (event: GestureResponderEvent) => {
    onNavigate?.(profileHref, event)
  }

  return (
    <YStack gap="$4" width="100%" flexShrink={0}>
      <Card
        px="$4"
        py="$3"
        gap="$3"
        borderRadius="$5"
        borderColor="$color4"
        backgroundColor="$color3"
      >
        <Link href={profileHref} asChild>
          <ListItem
            hoverTheme
            pressTheme
            size="$4"
            px="$0"
            py="$0"
            bg="transparent"
            onPress={handleManagePress}
            title={(profile as unknown as { name?: string })?.name || 'Rajeev Ranjan'}
            subTitle={'Partner ID: 304404'}
            icon={() => (
              <Avatar circular size="$3">
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: avatarSize, height: avatarSize }}
                  contentFit="cover"
                />
              </Avatar>
            )}
          />
        </Link>
      </Card>
    </YStack>
  )
}
