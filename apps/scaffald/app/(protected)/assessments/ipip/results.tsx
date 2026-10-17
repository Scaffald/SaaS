import { ROUTES } from '@scf/core/constants/routes'
import { DashboardLayout } from '@scf/core/components/layouts'
import { IPIPResultsPage } from '@scf/core/features/ipip-assessment/components/IPIPResultsPage'
import { useRouter } from 'expo-router'

/**
 * Personality results.
 *
 * This was a generic "Assessment Results" heading with no kicker and no way
 * back, unlike every other assessment screen. It names the assessment now,
 * says what kind of page it is, and links back to the hub (#1195).
 */
export default function IPIPResultsRoute() {
  const router = useRouter()
  return (
    <DashboardLayout
      back={{ label: 'Assessments', onPress: () => router.push(ROUTES.ASSESSMENTS.path) }}
      screenKicker="Assessment result"
      screenTitle="Personality profile"
      screenTip="Your Big Five traits, and how they shape the way you work."
      screenKey={ROUTES.ASSESSMENTS.IPIP.RESULTS.path}
      leftContent={<IPIPResultsPage />}
    />
  )
}
