import { AlertTriangle, CheckCircle2, CircleDashed } from '@tamagui/lucide-icons'
import { Paragraph, SizableText, Separator, XStack, YStack } from '@app/ui'

import { DashboardCard } from '../primitives'
import type { HireScoreActivity, HireScoreLevel } from '../../../hooks/useHireScore'
import { HireScoreGauge } from './hire-score-gauge'

const MAX_ACTIVITY_ITEMS = 4

type HireScoreCardProps = {
  score: number
  level: HireScoreLevel
  activities: HireScoreActivity[]
  completedCount: number
  pendingCount: number
  isLoading?: boolean
}

export const HireScoreCard = ({
  score,
  level,
  activities,
  completedCount,
  pendingCount,
  isLoading,
}: HireScoreCardProps) => {
  const totalEssentials = completedCount + pendingCount
  const sortedActivities = [...activities]
  const positiveActivities = sortedActivities.filter((activity) => activity.status === 'positive')
  const negativeActivities = sortedActivities.filter((activity) => activity.status === 'negative')
  const neutralActivities = sortedActivities.filter((activity) => activity.status === 'neutral')

  const prioritizedActivities = [
    ...positiveActivities.slice(0, 2),
    ...negativeActivities.slice(0, 2),
  ]

  if (prioritizedActivities.length < MAX_ACTIVITY_ITEMS) {
    const remaining = MAX_ACTIVITY_ITEMS - prioritizedActivities.length
    const overflow = [
      ...positiveActivities.slice(2),
      ...negativeActivities.slice(2),
      ...neutralActivities,
    ]
    prioritizedActivities.push(...overflow.slice(0, remaining))
  }

  const displayedActivities = prioritizedActivities
  const caption = isLoading
    ? 'We are reviewing your latest profile updates to calculate your Hire Score.'
    : level.caption

  const summary = (() => {
    if (isLoading) return 'Checking your profile details…'
    if (pendingCount === 0) return 'All essentials are complete. Keep engaging to maintain momentum.'
    return `You have completed ${completedCount} of ${totalEssentials} essentials.`
  })()

  return (
    <DashboardCard>
      <YStack gap="$4">
        <YStack gap="$2">
          <SizableText size="$5" fontWeight="700">
            Hire Score
          </SizableText>
          <Paragraph size="$2" color="$gray11">
            {caption}
          </Paragraph>
        </YStack>

        <XStack gap="$5" $sm={{ fd: 'column', ai: 'center' }}>
          <HireScoreGauge score={score} level={level} isLoading={isLoading} />
          <YStack f={1} gap="$2" jc="center">
            <Paragraph size="$2" color="$gray11">
              {summary}
            </Paragraph>
            <Paragraph size="$2" color="$gray11">
              Completing the actions below will raise your Hire Score and help you surface for more
              employers.
            </Paragraph>
          </YStack>
        </XStack>

        <Separator borderColor="$color4" />

        <YStack gap="$3">
          <XStack ai="center" jc="space-between">
            <SizableText size="$3" fontWeight="600">
              Recent activity
            </SizableText>
            <Paragraph size="$2" color="$gray10">
              Latest profile impact
            </Paragraph>
          </XStack>

          <YStack gap="$3">
            {displayedActivities.length > 0 ? (
              displayedActivities.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} />
              ))
            ) : (
              <Paragraph size="$2" color="$gray11">
                We will start tracking activity as you complete your profile essentials.
              </Paragraph>
            )}
          </YStack>
        </YStack>
      </YStack>
    </DashboardCard>
  )
}

type ActivityRowProps = {
  activity: HireScoreActivity
}

const ActivityRow = ({ activity }: ActivityRowProps) => {
  const icon = (() => {
    if (activity.status === 'positive') {
      return <CheckCircle2 size={18} color="$green10" />
    }
    if (activity.status === 'negative') {
      return <AlertTriangle size={18} color="$red10" />
    }
    return <CircleDashed size={18} color="$gray10" />
  })()

  const impactColor =
    activity.status === 'positive'
      ? '$green10'
      : activity.status === 'negative'
        ? '$red10'
        : '$gray11'
  const impactLabel = formatImpact(activity.impact)

  return (
    <XStack ai="center" gap="$3" $sm={{ fd: 'column', ai: 'flex-start', gap: '$2' }}>
      <YStack ai="center" jc="center" bw={1} boc="$color4" br="$4" w={36} h={36}>
        {icon}
      </YStack>
      <YStack gap={2} f={1}>
        <SizableText size="$3" fontWeight="600">
          {activity.title}
        </SizableText>
        <Paragraph size="$2" color="$gray11">
          {activity.message}
        </Paragraph>
      </YStack>
      <SizableText size="$2" fontWeight="600" color={impactColor}>
        {impactLabel}
      </SizableText>
    </XStack>
  )
}

const formatImpact = (impact: number) => {
  if (impact > 0) return `+${impact} pts`
  if (impact < 0) return `${impact} pts`
  return '0 pts'
}
