import { Info } from '@tamagui/lucide-icons'
import { Paragraph, SizableText, XStack, YStack } from '@app/ui'

import { DashboardCard } from '../primitives'
import { resolveHireScoreLevel } from '../../../hooks/useHireScore'

export type DashboardHeroProps = {
  name?: string
  score: number
}

const SCORE_SEGMENTS = [
  { label: '0', color: '$gray5' },
  { label: '10', color: '$gray5' },
  { label: '20', color: '$gray5' },
  { label: '30', color: '$yellow5' },
  { label: '40', color: '$yellow6' },
  { label: '50', color: '$yellow7' },
  { label: '60', color: '$orange8' },
  { label: '70', color: '$orange9' },
  { label: '80', color: '$green8' },
  { label: '90', color: '$green9' },
  { label: '100', color: '$green10' },
]

export const DashboardHero = ({ name = 'there', score }: DashboardHeroProps) => {
  const scoreLevel = resolveHireScoreLevel(score)

  return (
    <DashboardCard>
      <YStack gap="$5">
        <YStack gap="$1">
          <SizableText size="$8" fontWeight="700">
            Hi there, {name}
          </SizableText>
          <XStack ai="center" gap="$2">
            <SizableText size="$4" color="$gray12" fontWeight="600">
              Your Elevate score
            </SizableText>
            <Info size={16} color="$gray11" />
          </XStack>
        </YStack>

        <ScoreGauge score={score} />

        <XStack jc="space-between" ai="center" gap="$4" $sm={{ fd: 'column', ai: 'flex-start' }}>
          <YStack gap="$2" f={1}>
            <Paragraph size="$2" color="$gray11">
              A higher score means employers are more likely to engage with you. Keep completing
              profile tasks and responding to hiring requests to grow your Elevate score over time.
            </Paragraph>
            <XStack gap="$4">
              <SummaryMetric label="Response rate" value="92%" trend="up" />
              <SummaryMetric label="Profile completeness" value="80%" trend="up" />
              <SummaryMetric label="Last updated" value="2 days ago" />
            </XStack>
          </YStack>

          <YStack ai="center" gap="$2" miw={120}>
            <SizableText size="$9" fontWeight="800" color="$gray12">
              {score}
            </SizableText>
            <Paragraph size="$2" color={scoreLevel.tone} fontWeight="600">
              {scoreLevel.label}
            </Paragraph>
          </YStack>
        </XStack>
      </YStack>
    </DashboardCard>
  )
}

const SummaryMetric = ({
  label,
  value,
  trend,
}: {
  label: string
  value: string
  trend?: 'up' | 'down'
}) => {
  return (
    <YStack gap="$1">
      <Paragraph size="$1" color="$gray11">
        {label}
      </Paragraph>
      <SizableText size="$5" fontWeight="700">
        {value}
      </SizableText>
      {trend ? (
        <Paragraph size="$1" color={trend === 'up' ? '$green10' : '$red10'}>
          {trend === 'up' ? 'Improving' : 'Declining'} this week
        </Paragraph>
      ) : null}
    </YStack>
  )
}

const ScoreGauge = ({ score }: { score: number }) => {
  return (
    <YStack gap="$2">
      <YStack position="relative" h={36} br="$8" overflow="hidden" bg="$gray4">
        <XStack f={1} h="100%">
          {SCORE_SEGMENTS.map((segment, index) => (
            <YStack
              key={segment.label + index}
              f={1}
              bg={segment.color}
              opacity={0.6 + index * 0.03}
            />
          ))}
        </XStack>
        <YStack
          position="absolute"
          top="50%"
          left={`${Math.min(100, Math.max(0, score))}%`}
          mt={-12}
          ml={-12}
          w={24}
          h={24}
          br={9999}
          bg="$color12"
          ai="center"
          jc="center"
        >
          <YStack w={10} h={10} br={9999} bg="$color1" />
        </YStack>
      </YStack>
      <XStack jc="space-between">
        {SCORE_SEGMENTS.map((segment) => (
          <SizableText key={segment.label} size="$1" color="$gray9">
            {segment.label}
          </SizableText>
        ))}
      </XStack>
    </YStack>
  )
}
