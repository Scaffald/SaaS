import { Text, YStack } from 'tamagui'

/**
 * Settings screen - simplified since navigation is now handled by drawer menu
 * Users can navigate to all settings sections directly from the drawer
 */
export const SettingsScreen = () => {
  return (
    <YStack flex={1} padding="$4" justifyContent="center" alignItems="center">
      <Text fontSize="$6" fontWeight="600" textAlign="center" marginBottom="$4">
        Settings
      </Text>
      <Text fontSize="$4" color="$color10" textAlign="center">
        Use the drawer menu to navigate to different settings sections
      </Text>
    </YStack>
  )
}
