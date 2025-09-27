import { StyleguideScreen } from '@app/core/features/styleguide/screen'
import { Stack } from 'expo-router'

export default function StyleguidePage() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Component Styleguide',
          headerShown: true,
        }}
      />
      <StyleguideScreen />
    </>
  )
}
