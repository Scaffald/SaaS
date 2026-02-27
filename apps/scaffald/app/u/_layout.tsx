import { ScaffaldLogo } from '@scf/core/assets'
import { Stack } from 'expo-router'

export default function PublicProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: () => <ScaffaldLogo width={140} height={23} />,
        headerTitleAlign: 'center',
      }}
    />
  )
}
