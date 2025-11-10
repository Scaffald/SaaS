import { DashboardWidget, Text, YStack, spacing } from '@app/ui'

export const AssessmentsLandingRight = () => {
  return (
    <DashboardWidget gap={spacing.md} elevated>
      <YStack gap={spacing.md}>
        <YStack gap={spacing.xs}>
          <Text fontSize="$6" fontWeight="700" color="$color12">
            Why assessments matter
          </Text>
          <Text fontSize="$3" color="$color11">
            Your answers create a shared language for coaches, managers, and teammates to understand where
            you are today and how to help you grow.
          </Text>
        </YStack>

        <YStack gap={spacing.sm}>
          <YStack gap={spacing.xs}>
            <Text fontSize="$4" fontWeight="600" color="$color12">
              Build a complete profile
            </Text>
            <Text fontSize="$3" color="$color11">
              Each assessment fills in part of your strengths map—from how you process feedback to which
              environments fuel your energy.
            </Text>
          </YStack>

          <YStack gap={spacing.xs}>
            <Text fontSize="$4" fontWeight="600" color="$color12">
              Drive better matches
            </Text>
            <Text fontSize="$3" color="$color11">
              The more signal we have, the better we can tailor role recommendations, coaching plans,
              and development sprints that resonate with you.
            </Text>
          </YStack>

          <YStack gap={spacing.xs}>
            <Text fontSize="$4" fontWeight="600" color="$color12">
              Share actionable insights
            </Text>
            <Text fontSize="$3" color="$color11">
              Summaries flow into your dossier and team dashboards so collaborators know how to support you
              before the next conversation.
            </Text>
          </YStack>
        </YStack>

        <Text fontSize="$2" color="$color11">
          Tip: You can retake most assessments anytime your goals change—your latest results will be saved
          and compared with your historical trends.
        </Text>
      </YStack>
    </DashboardWidget>
  )
}


