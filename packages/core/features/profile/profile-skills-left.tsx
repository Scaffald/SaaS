import { ScrollView, YStack } from '@app/ui'

import { SkillsForm as ProfileSkillsContent } from './components/SkillsForm'

export function ProfileSkillsLeft() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$5" pb="$8">
        <ProfileSkillsContent />
      </YStack>
    </ScrollView>
  )
}
