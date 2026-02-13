import { DashboardWidget, spacing, Text, Stack } from '@unicornlove/beyond-ui'

export const AssessmentsLandingRight = () => {
  return (
    <DashboardWidget gap={spacing.md} elevated>
      <Stack gap={spacing.md}>
        <Stack gap={spacing.xs}>
          <Text color="$gray11">Why assessments matter</Text>
          <Text color="$gray11">
            Your answers create a shared language for coaches, managers, and teammates to understand
            where you are today and how to help you grow.
          </Text>
        </Stack>

        <Stack gap={spacing.sm}>
          <Stack gap={spacing.xs}>
            <Text color="$gray11">Build a complete profile</Text>
            <Text color="$gray11">
              Each assessment fills in part of your strengths map—from how you process feedback to
              which environments fuel your energy.
            </Text>
          </Stack>

          <Stack gap={spacing.xs}>
            <Text color="$gray11">Drive better matches</Text>
            <Text color="$gray11">
              The more signal we have, the better we can tailor role recommendations, coaching
              plans, and development sprints that resonate with you.
            </Text>
          </Stack>

          <Stack gap={spacing.xs}>
            <Text color="$gray11">Share actionable insights</Text>
            <Text color="$gray11">
              Summaries flow into your dossier and team dashboards so collaborators know how to
              support you before the next conversation.
            </Text>
          </Stack>
        </Stack>

        <Text color="$gray11">
          Tip: You can retake most assessments anytime your goals change—your latest results will be
          saved and compared with your historical trends.
        </Text>
      </Stack>
    </DashboardWidget>
  )
}
