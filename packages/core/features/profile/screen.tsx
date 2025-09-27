import { Text, YStack } from 'tamagui'

/**
 * Profile screen - simplified since navigation is now handled by drawer menu
 * Users can navigate to all profile sections directly from the drawer
 */
export const ProfileScreen = () => {
  return (
    <YStack flex={1} padding="$4" justifyContent="center" alignItems="center">
      <Text fontSize="$6" fontWeight="600" textAlign="center" marginBottom="$4">
        Profile
      </Text>
      <Text fontSize="$4" color="$color10" textAlign="center">
        Use the drawer menu to navigate to different profile sections
      </Text>
    </YStack>
  )
}
