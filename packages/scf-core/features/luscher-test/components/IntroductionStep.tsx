import { Button, Text, Row, Stack } from '@unicornlove/beyond-ui'

export interface IntroductionStepProps {
  onBegin: () => void
}

/**
 * IntroductionStep - Introduction screen for Lüscher Color Test
 * Explains the test purpose and flow before user begins
 */
export function IntroductionStep({ onBegin }: IntroductionStepProps) {
  return (
    <Stack gap={24} maxWidth={800} width="100%" marginHorizontal="auto" padding={16}>
      <Stack gap={16}>
        <Stack gap={8}>
          <Text color="gray" lineHeight={4}>
            This lightweight, weekly self-assessment helps you track your mood and encourages
            consistent, reflective engagement.
          </Text>
        </Stack>

        <Stack
          gap={12}
          backgroundColor="$color3"
          padding={16}
          borderRadius={16}
          borderWidth={1}
          borderColor="$color7"
        >
          <Text color="gray">What to Expect</Text>
          <Stack gap={8}>
            <Row gap={8} align="center">
              <Text color="gray">•</Text>
              <Text color="gray" flex={1}>
                Takes approximately 2–3 minutes to complete
              </Text>
            </Row>
            <Row gap={8} align="center">
              <Text color="gray">•</Text>
              <Text color="gray" flex={1}>
                Two color selection rounds separated by a 60-second cooldown
              </Text>
            </Row>
            <Row gap={8} align="center">
              <Text color="gray">•</Text>
              <Text color="gray" flex={1}>
                Produces quantitative state metrics for mood tracking
              </Text>
            </Row>
            <Row gap={8} align="center">
              <Text color="gray">•</Text>
              <Text color="gray" flex={1}>
                Earns Frequency XP for consistent engagement
              </Text>
            </Row>
          </Stack>
        </Stack>

        <Stack
          gap={12}
          padding={16}
          backgroundColor="$blue2"
          borderRadius={16}
          borderWidth={1}
          borderColor="$blue7"
        >
          <Text color="gray" style={{ textAlign: 'center' }}>
            Pick the colors that feel most right to you right now.
          </Text>
          <Text color="gray" style={{ textAlign: 'center' }}>
            There are no right or wrong answers. The test cannot be "gamed" — every version will
            reveal your deeper truths, both positive and negative.
          </Text>
        </Stack>
      </Stack>

      <Button size={20} themeInverse onPress={onBegin}>
        <Button.Text>Begin Test</Button.Text>
      </Button>
    </Stack>
  )
}
