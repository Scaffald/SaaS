/**
 * Applying, as a screen.
 *
 * The four-step form used to run inside the job detail's 38% sidebar, or in
 * a modal for postings with no custom questions — a screening form, an
 * upload picker and a review pass, all inside a column narrower than a
 * phone. Clay: "we should switch to screens vs modals in some areas so we
 * have more real estate."
 *
 * So it gets a route under the posting it belongs to. The URL is the other
 * half of the point: the form already auto-saves, and an interrupted
 * application can now be returned to by going back to the same address
 * instead of re-opening a job and finding the sidebar again.
 *
 * External postings are not applied to here — they are applied to on the
 * host's own site — so this screen sends those back to the posting.
 */

import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { Button, Spinner, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useExternalJobs, useJobDetails } from '@scf/core/utils/jobs-sdk-hooks'
import { ApplicationWizard } from './components'

/**
 * The screen's own header line, resolved from the posting. `title` is null
 * while the job is still loading, which is what `DashboardPage` wants: it
 * falls back to the route's own name rather than flashing a wrong one.
 */
export function useJobApplyHeader(jobId: string): {
  title: string | null
  kicker: string | undefined
} {
  const { data: job } = useJobDetails(jobId, { enabled: !!jobId })
  return {
    title: job?.title ? `Apply · ${job.title}` : null,
    kicker: job?.organization?.name ?? undefined,
  }
}

export function JobApplyScreen({ jobId }: { jobId: string }) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const { data: job, isLoading, isError } = useJobDetails(jobId, { enabled: !!jobId })
  const { data: externalJobs } = useExternalJobs({ enabled: !!jobId && !job && !isLoading })
  const isExternal = !!externalJobs?.find((candidate: { id: string }) => candidate.id === jobId)

  // An external posting has no form of ours to fill in. Send it back to the
  // posting, where the Apply button opens the host's site.
  useEffect(() => {
    if (isExternal) {
      router.replace(buildPath(ROUTES.JOBS.DETAIL, { id: jobId }))
    }
  }, [isExternal, jobId, router])

  if (isLoading) {
    return (
      <Stack gap={12} align="center" paddingVertical={48}>
        <Spinner variant="ios" size="lg" />
        <Text style={{ color: colors.text[t].secondary }}>Loading the application…</Text>
      </Stack>
    )
  }

  if (isError || !job) {
    return (
      <Stack gap={12} align="flex-start" paddingVertical={48}>
        <Text style={{ color: colors.text[t].secondary }}>
          This job is no longer accepting applications.
        </Text>
        <Button variant="outline" size="sm" onPress={() => router.push(ROUTES.JOBS.path)}>
          Browse jobs
        </Button>
      </Stack>
    )
  }

  return (
    <ApplicationWizard
      jobId={job.id}
      jobTitle={job.title ?? 'Job'}
      organizationName={job.organization?.name ?? 'Unknown Organization'}
      onViewApplication={(applicationId) =>
        router.push(buildPath(ROUTES.JOBS.APPLICATIONS.DETAIL, { applicationId }))
      }
      onReturnToJobs={() => router.push(ROUTES.JOBS.path)}
    />
  )
}
