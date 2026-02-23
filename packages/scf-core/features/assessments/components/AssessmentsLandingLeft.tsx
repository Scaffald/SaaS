import type { RouteConfig } from '@scf/core/constants/routes'
import { ROUTES } from '@scf/core/constants/routes'
import { Button, DashboardWidget, gap, Text, Stack } from '@scaffald/ui'
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
    <Stack gap={gap.lg}>
      {ASSESSMENT_LANDING_CARDS.map(
        ({ key, title, description, ctaLabel, route, estimatedTime }) => (
          <DashboardWidget key={key} gap={gap.md}>
            <Stack gap={gap.sm}>
              <Stack gap={gap.xs}>
                <Text color="$gray11">{title}</Text>
                <Text color="$gray11">{description}</Text>
              </Stack>

              <Button
                variant="filled"
                color="primary"
                size="lg"
                onPress={() => router.push(route.path)}
                accessibilityLabel={ctaLabel}
              >
                {ctaLabel}
              </Button>

              {estimatedTime ? <Text color="$gray11">{estimatedTime}</Text> : null}
            </Stack>
          </DashboardWidget>
        )
      )}
    </Stack>
  )
}
