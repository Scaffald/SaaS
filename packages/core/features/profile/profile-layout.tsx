import { Avatar, Paragraph, Settings, XStack, YStack, getTokens } from '@app/ui'
import { Box, Cog, LogOut, Milestone, ShoppingCart, User, Users } from '@tamagui/lucide-icons'
import { useUser } from '@app/core/utils/useUser'
import { SolitoImage } from 'solito/image'
import { useLink } from 'solito/link'

export const ProfileLayout = () => {
  const { profile, avatarUrl } = useUser()
  const tokens = getTokens()
  const name = profile?.name ?? 'No Name'

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logout clicked')
  }

  return (
    <YStack f={1} maw={600} mx="auto" w="100%" gap="$5" $sm={{ px: '$3' }} px="$4">
      <Settings>
        <Settings.Items>
          <Settings.Group>
            <Settings.Item icon={User} {...useLink({ href: '/profile/edit' })} accentTheme="pink">
              Edit profile
            </Settings.Item>
            <Settings.Item icon={Box} accentTheme="green">
              My Items
            </Settings.Item>
            <Settings.Item icon={Users} accentTheme="orange">
              Refer Your Friends
            </Settings.Item>
            <Settings.Item icon={Milestone} accentTheme="gray">
              Address Info
            </Settings.Item>
            <Settings.Item icon={ShoppingCart} accentTheme="blue">
              Purchase History
            </Settings.Item>
            <Settings.Item {...useLink({ href: '/settings' })} icon={Cog}>
              Settings
            </Settings.Item>
          </Settings.Group>
          <Settings.Group>
            <Settings.Item icon={LogOut} accentTheme="red" onPress={handleLogout}>
              Logout
            </Settings.Item>
          </Settings.Group>
        </Settings.Items>
      </Settings>

      <XStack gap="$4" mt="auto" ai="center">
        <Avatar circular size="$3">
          <SolitoImage
            src={avatarUrl}
            alt="Profile avatar"
            width={tokens.size['3'].val}
            height={tokens.size['3'].val}
          />
        </Avatar>
        <Paragraph ta="center" ml="$-1.5">
          {name}
        </Paragraph>
      </XStack>
    </YStack>
  )
}
