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
    <Stack gap="$6" maxWidth={800} width="100%" marginHorizontal="auto" padding="$4">
      <Stack gap="$4">
        <Stack gap="$2">
          <Text fontSize="$4" color="$color11" lineHeight="$1">
            This lightweight, weekly self-assessment helps you track your mood and encourages
            consistent, reflective engagement.
          </Text>
        </Stack>

        <Stack
          gap="$3"
          backgroundColor="$color3"
          padding="$4"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$color7"
        >
          <Text fontSize="$5" fontWeight="600" color="$color12">
            What to Expect
          </Text>
          <Stack gap="$2">
            <Row gap="$2" alignItems="center">
              <Text fontSize="$3" color="$color11">
                •
              </Text>
              <Text fontSize="$3" color="$color11" flex={1}>
                Takes approximately 2–3 minutes to complete
              </Text>
            </Row>
            <Row gap="$2" alignItems="center">
              <Text fontSize="$3" color="$color11">
                •
              </Text>
              <Text fontSize="$3" color="$color11" flex={1}>
                Two color selection rounds separated by a 60-second cooldown
              </Text>
            </Row>
            <Row gap="$2" alignItems="center">
              <Text fontSize="$3" color="$color11">
                •
              </Text>
              <Text fontSize="$3" color="$color11" flex={1}>
                Produces quantitative state metrics for mood tracking
              </Text>
            </Row>
            <Row gap="$2" alignItems="center">
              <Text fontSize="$3" color="$color11">
                •
              </Text>
              <Text fontSize="$3" color="$color11" flex={1}>
                Earns Frequency XP for consistent engagement
              </Text>
            </Row>
          </Stack>
        </Stack>

        <Stack
          gap="$3"
          padding="$4"
          backgroundColor="$blue2"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$blue7"
        >
          <Text fontSize="$5" fontWeight="600" color="$color12" style={{ textAlign: 'center' }}>
            Pick the colors that feel most right to you right now.
          </Text>
          <Text fontSize="$4" color="$color11" style={{ textAlign: 'center' }}>
            There are no right or wrong answers. The test cannot be "gamed" — every version will
            reveal your deeper truths, both positive and negative.
          </Text>
        </Stack>
      </Stack>

      <Button size="$5" themeInverse onPress={onBegin}>
        <Button.Text>Begin Test</Button.Text>
      </Button>
    </Stack>
  )
}
