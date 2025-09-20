import { H1, ScrollView, YStack, isWeb } from '@my/ui'

import { AboutContent } from './components/about-content'

export const AboutScreen = () => {
  return (
    <ScrollView flex={1} showsVerticalScrollIndicator>
      <YStack gap="$4" px="$4" py="$6" maw={800} mx="auto">
        {isWeb && <H1>About SCF Neue</H1>}
        <AboutContent />
      </YStack>
    </ScrollView>
  )
}
