import { ScrollView, YStack } from '@app/ui'

import { GeneralForm as ProfileGeneralContent } from './components/GeneralForm'

export function ProfileGeneralLeft() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$5" pb="$8">
        <ProfileGeneralContent />
      </YStack>
    </ScrollView>
  )
}
