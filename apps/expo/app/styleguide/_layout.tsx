import { Stack } from 'expo-router'
import { StyleguideProvider } from './_components'

export default function StyleguideLayout() {
  return (
    <StyleguideProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </StyleguideProvider>
  )
}
