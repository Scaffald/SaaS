import { XStack, YStack } from 'tamagui'
import { ScaffaldLogo } from '@app/core/assets'

/**
 * DrawerHeader component renders the logo at the top of the drawer
 * User profile section has been moved to UserMenuAvatar in the header
 */
export const DrawerHeader = () => {
  return (
    <YStack gap="$4" shrink={0}>
      {/* Logo Section */}
      <XStack justify="flex-start" py="$2" width="100%" maxW="100%">
        <XStack maxW="100%" overflow="hidden">
          <ScaffaldLogo height={20} />
        </XStack>
      </XStack>
    </YStack>
  )
}
