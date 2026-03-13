import { Clock, Palette, BarChart3, Zap } from 'lucide-react-native'
import { useMemo } from 'react'
import {
  AssessmentHeader,
  Button,
  Card,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

export interface IntroductionStepProps {
  onBegin: () => void
}

const INFO_CARDS = [
  {
    icon: Clock,
    title: '2-3 Minutes',
    description: 'Quick assessment to track your weekly mood',
  },
  {
    icon: Palette,
    title: 'Color Selection',
    description: 'Two rounds of intuitive color preference choices',
  },
  {
    icon: BarChart3,
    title: 'Mood Metrics',
    description: 'Produces quantitative state metrics for tracking',
  },
  {
    icon: Zap,
    title: 'Earn XP',
    description: 'Gain Frequency XP for consistent engagement',
  },
]

/**
 * IntroductionStep - Introduction screen for Lüscher Color Test
 * Explains the test purpose and flow before user begins
 */
export function IntroductionStep({ onBegin }: IntroductionStepProps) {
  const { theme } = useThemeContext()

  const iconBgColor = useMemo(
    () => (theme === 'dark' ? 'rgba(29, 114, 130, 0.15)' : 'rgba(29, 114, 130, 0.08)'),
    [theme]
  )

  return (
    <Stack gap={28} maxWidth={800} width="100%" padding="md" style={{ marginHorizontal: 'auto' }}>
      <AssessmentHeader
        category="Weekly Pulse"
        title="Color Preference Assessment"
        subtitle="Track your mood through color selection"
      />

      {/* 2x2 Info Cards Grid */}
      <Row gap={12} wrap>
        {INFO_CARDS.map((card) => (
          <Stack key={card.title} style={{ flex: 1, minWidth: 200 }}>
            <Card variant="outlined" padding="md" radius="xl">
              <Stack gap={12}>
                <Stack
                  width={40}
                  height={40}
                  borderRadius={12}
                  align="center"
                  justify="center"
                  style={{ backgroundColor: iconBgColor }}
                >
                  <card.icon size={20} color={colors.primary[500]} />
                </Stack>
                <Stack gap={4}>
                  <Text
                    style={{
                      fontWeight: '600',
                      color: colors.text[theme].primary,
                    }}
                  >
                    {card.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.text[theme].secondary,
                      lineHeight: 18,
                    }}
                  >
                    {card.description}
                  </Text>
                </Stack>
              </Stack>
            </Card>
          </Stack>
        ))}
      </Row>

      <Card variant="outlined" padding="lg" radius="xl">
        <Stack gap={8} align="center">
          <Text
            style={{
              textAlign: 'center',
              color: colors.text[theme].secondary,
              lineHeight: 22,
            }}
          >
            Pick the colors that feel most right to you right now.
          </Text>
          <Text
            style={{
              textAlign: 'center',
              color: colors.text[theme].tertiary,
              fontSize: 13,
              lineHeight: 20,
            }}
          >
            There are no right or wrong answers. The test cannot be "gamed" — every version will
            reveal your deeper truths, both positive and negative.
          </Text>
        </Stack>
      </Card>

      <Row justify="center">
        <Button size="lg" variant="filled" color="primary" onPress={onBegin}>
          Begin Test
        </Button>
      </Row>
    </Stack>
  )
}
