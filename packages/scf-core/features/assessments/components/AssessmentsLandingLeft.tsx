import type { RouteConfig } from '@scf/core/constants/routes'
import { ROUTES } from '@scf/core/constants/routes'
import { Button, DashboardWidget, spacing, Text, Stack } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'

type AssessmentLandingCard = {
  readonly key: string
  readonly title: string
  readonly description: string
  readonly ctaLabel: string
  readonly route: RouteConfig
  readonly estimatedTime?: string
}

const ASSESSMENT_LANDING_CARDS: AssessmentLandingCard[] = [
  {
    key: 'pulse',
    title: 'Weekly Pulse Check',
    description:
      'Capture how you are feeling this week so coaches can tailor guidance and keep a pulse on engagement.',
    ctaLabel: 'Open Weekly Pulse',
    route: ROUTES.DASHBOARD.ASSESSMENTS.LUSCHER,
    estimatedTime: 'Takes ~2 minutes',
  },
  {
    key: 'ipip',
    title: 'Personality Assessment',
    description:
      'Answer a research-backed personality inventory to help match you with environments where you thrive.',
    ctaLabel: 'Start Personality Assessment',
    route: ROUTES.DASHBOARD.ASSESSMENTS.IPIP,
    estimatedTime: 'Takes ~12 minutes',
  },
  {
    key: 'riasec',
    title: 'Career Interests',
    description:
      'Rate your interest across six Holland themes to uncover roles and work families that fit your style.',
    ctaLabel: 'Discover Career Interests',
    route: ROUTES.DASHBOARD.ASSESSMENTS.RIASEC,
    estimatedTime: 'Takes ~3 minutes',
  },
  {
    key: 'occupation',
    title: 'Occupation Preferences',
    description:
      'Stack-rank job factors to focus the recommendations you receive on roles that align with your goals.',
    ctaLabel: 'Refine Occupation Matches',
    route: ROUTES.DASHBOARD.ASSESSMENTS.OCCUPATION,
    estimatedTime: 'Takes ~4 minutes',
  },
]

export const AssessmentsLandingLeft = () => {
  const router = useRouter()

  return (
    <Stack gap={spacing.lg}>
      {ASSESSMENT_LANDING_CARDS.map(
        ({ key, title, description, ctaLabel, route, estimatedTime }) => (
          <DashboardWidget key={key} gap={spacing.md}>
            <Stack gap={spacing.sm}>
              <Stack gap={spacing.xs}>
                <Text fontSize="$6" fontWeight="700" color="$color12">
                  {title}
                </Text>
                <Text fontSize="$3" color="$color11">
                  {description}
                </Text>
              </Stack>

              <Button
                variant="primary"
                size="$5"
                onPress={() => {
                  router.push(route.path)
                }}
                accessibilityLabel={ctaLabel}
              >
                <Button.Text>{ctaLabel}</Button.Text>
              </Button>

              {estimatedTime ? (
                <Text fontSize="$2" color="$color11">
                  {estimatedTime}
                </Text>
              ) : null}
            </Stack>
          </DashboardWidget>
        )
      )}
    </Stack>
  )
}
