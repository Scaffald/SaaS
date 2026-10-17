import { ROUTES } from '@scf/core/constants/routes'
import { LoadFailure } from '@scf/core/components/ui'
import { ScreenHeader, Stack, TextLink } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ATSMetricsDashboard } from './components/ATSMetricsDashboard'
import { useApplications } from './hooks/useApplications'
import { toATSApplication } from './transform'

/**
 * Hiring metrics, inside the ATS section (#1203).
 *
 * `/office/ats/metrics` rendered the whole Applications screen opened on its
 * Metrics view: its own kicker ("Employer view — applicant workflow"), the
 * Lanes / Board / Metrics switch and the filter toolbar, with no ATS sub-tab
 * strip — so the ATS Metrics tab took you out of the section. This is only the
 * metrics, under the route's OfficeLayout, with a link to the pipeline they
 * describe.
 */
export function ATSMetricsScreen() {
  const router = useRouter()
  const { applications, isLoading, isError, error, refetch } = useApplications()
  // The same transform as the pipeline, so a figure here counts what a card
  // there shows.
  const rows = useMemo(() => applications.map(toATSApplication), [applications])

  return (
    <Stack gap={16}>
      <ScreenHeader
        kicker="Screening"
        title="Hiring metrics"
        tip="Funnel, stage conversion, source of hire and time to hire, read from the applicant pipeline."
        actions={
          <TextLink onPress={() => router.push(ROUTES.OFFICE.APPLICATIONS.path)}>
            Open the pipeline
          </TextLink>
        }
      />
      {isError ? (
        <LoadFailure error={error} noun="applications" retry={() => refetch()} />
      ) : (
        <ATSMetricsDashboard applications={rows} isLoading={isLoading} />
      )}
    </Stack>
  )
}
