import { ScrollView, YStack } from '@app/ui'

import { BackgroundForm as ProfileBackgroundContent } from './components/BackgroundForm'

export function ProfileBackgroundLeft() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$5" pb="$8">
        <ProfileBackgroundContent />
      </YStack>
    </ScrollView>
  )
}
