import { H1, ScrollView, YStack, isWeb } from '@my/ui'

import { PrivacyPolicyContent } from './components/privacy-policy-content'

export const PrivacyPolicyScreen = () => {
  return (
    <ScrollView flex={1} showsVerticalScrollIndicator>
      <YStack gap="$4" px="$4" py="$6" maw={800} mx="auto">
        {isWeb && <H1>Privacy Policy</H1>}
        <PrivacyPolicyContent />
      </YStack>
    </ScrollView>
  )
}
