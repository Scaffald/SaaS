import { ScaffaldLogo } from '@scf/core/assets'
import { Stack } from 'expo-router'
import { Platform } from 'react-native'

export default function PublicProfileLayout() {
  return (
    <Stack
      screenOptions={{
        // Web gets the site header from the (public) group layout (#762); a
        // second logo bar under it was the only thing this header added there.
        headerShown: Platform.OS !== 'web',
        headerTitle: () => <ScaffaldLogo width={140} height={23} />,
        headerTitleAlign: 'center',
      }}
    />
  )
}
