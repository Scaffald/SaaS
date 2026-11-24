/**
 * /dashboard/invite — "Invite your crew" (#1398).
 *
 * `?from=onboarding` makes it the last onboarding step: onboarding lands here
 * after the profile is complete, and "Skip for now" goes on to the dashboard.
 */
import { Button } from '@scaffald/ui'
import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { InviteCrewScreen } from '@scf/core/features/invites/InviteCrewScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'

export default function InvitePage() {
  const { from } = useLocalSearchParams<{ from?: string }>()
  const router = useRouter()
  const onboarding = from === 'onboarding'
  return (
    <DashboardPage
      showBreadcrumb={false}
      readingWidth
      pageTitle={onboarding ? 'One last thing' : 'Invite your crew'}
      screenActions={
        onboarding ? (
          <Button
            size="sm"
            onPress={() => router.replace(ROUTES.DASHBOARD.path)}
            testID="invite-skip"
          >
            Skip for now
          </Button>
        ) : undefined
      }
      leftContent={<InviteCrewScreen source={onboarding ? 'onboarding' : 'app'} />}
    />
  )
}
