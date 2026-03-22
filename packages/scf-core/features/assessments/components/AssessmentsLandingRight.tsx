import { DashboardWidget, gap, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

export const AssessmentsLandingRight = () => {
  const { theme } = useThemeContext()

  return (
    <DashboardWidget gap={gap.md}>
      <Stack gap={gap.md}>
        <Stack gap={gap.xs}>
          <Text style={{ color: colors.text[theme].secondary }}>Why assessments matter</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Your answers create a shared language for coaches, managers, and teammates to understand
            where you are today and how to help you grow.
          </Text>
        </Stack>

        <Stack gap={gap.sm}>
          <Stack gap={gap.xs}>
            <Text style={{ color: colors.text[theme].secondary }}>Build a complete profile</Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              Each assessment fills in part of your strengths map—from how you process feedback to
              which environments fuel your energy.
            </Text>
          </Stack>

          <Stack gap={gap.xs}>
            <Text style={{ color: colors.text[theme].secondary }}>Drive better matches</Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              The more signal we have, the better we can tailor role recommendations, coaching
              plans, and development sprints that resonate with you.
            </Text>
          </Stack>

          <Stack gap={gap.xs}>
            <Text style={{ color: colors.text[theme].secondary }}>Share actionable insights</Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              Summaries flow into your dossier and team dashboards so collaborators know how to
              support you before the next conversation.
            </Text>
          </Stack>
        </Stack>

        <Text style={{ color: colors.text[theme].secondary }}>
          Tip: You can retake most assessments anytime your goals change—your latest results will be
          saved and compared with your historical trends.
        </Text>
      </Stack>
    </DashboardWidget>
  )
}
