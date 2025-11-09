import { Button, Text, YStack, XStack } from 'tamagui'

export interface IntroductionStepProps {
  onBegin: () => void
}

/**
 * IntroductionStep - Introduction screen for Lüscher Color Test
 * Explains the test purpose and flow before user begins
 */
export function IntroductionStep({ onBegin }: IntroductionStepProps) {
  return (
    <YStack gap="$6" maxW={800} width="100%" mx="auto" p="$4">
      <YStack gap="$4">
        <YStack gap="$2">
          <Text fontSize="$4" color="$color11" lineHeight="$1">
            This lightweight, weekly self-assessment helps you track your mood and encourages
            consistent, reflective engagement.
          </Text>
        </YStack>

        <YStack gap="$3" bg="$color3" p="$4" rounded="$4" borderWidth={1} borderColor="$color7">
          <Text fontSize="$5" fontWeight="600" color="$color12">
            What to Expect
          </Text>
          <YStack gap="$2">
            <XStack gap="$2" items="center">
              <Text fontSize="$3" color="$color11">
                •
              </Text>
              <Text fontSize="$3" color="$color11" flex={1}>
                Takes approximately 2–3 minutes to complete
              </Text>
            </XStack>
            <XStack gap="$2" items="center">
              <Text fontSize="$3" color="$color11">
                •
              </Text>
              <Text fontSize="$3" color="$color11" flex={1}>
                Two color selection rounds separated by a 60-second cooldown
              </Text>
            </XStack>
            <XStack gap="$2" items="center">
              <Text fontSize="$3" color="$color11">
                •
              </Text>
              <Text fontSize="$3" color="$color11" flex={1}>
                Produces quantitative state metrics for mood tracking
              </Text>
            </XStack>
            <XStack gap="$2" items="center">
              <Text fontSize="$3" color="$color11">
                •
              </Text>
              <Text fontSize="$3" color="$color11" flex={1}>
                Earns Frequency XP for consistent engagement
              </Text>
            </XStack>
          </YStack>
        </YStack>

        <YStack gap="$3" p="$4" bg="$blue2" rounded="$4" borderWidth={1} borderColor="$blue7">
          <Text
            fontSize="$5"
            fontWeight="600"
            color="$color12"
            style={{ textAlign: 'center' }}
          >
            Pick the colors that feel most right to you right now.
          </Text>
          <Text fontSize="$4" color="$color11" style={{ textAlign: 'center' }}>
            There are no right or wrong answers. The test cannot be "gamed" — every version will
            reveal your deeper truths, both positive and negative.
          </Text>
        </YStack>
      </YStack>

      <Button size="$5" themeInverse onPress={onBegin}>
        <Button.Text>Begin Test</Button.Text>
      </Button>
    </YStack>
  )
}
