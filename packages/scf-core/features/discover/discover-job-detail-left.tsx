import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { captureEvent } from '@scf/core/utils/analytics/client'
import {
  useExternalJobs,
  useJobDetails,
  useMyApplicationForJob,
} from '@scf/core/utils/jobs-sdk-hooks'
import { useTrackEngagementMutation } from '@scf/core/utils/engagement-sdk-hooks'
import { ExternalLink } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import {
  Button,
  H3,
  Skeleton,
  SkeletonBox,
  SkeletonText,
  Text,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { openExternalLink } from '@scf/core/utils/platform'
import { useUser } from '@scf/core/utils/useUser'

interface DiscoverJobDetailLeftProps {
  jobId: string
}

/**
 * The apply panel beside a job posting.
 *
 * It used to *be* the application: a four-step wizard, or a modal for
 * postings with no custom questions, rendered inside a 38% column. Applying
 * is a screen now (#829), so this is the call to action for it — the panel
 * states what applying involves and opens the form at its own address.
 *
 * The component keeps its historical name: `discover-job-detail-screen`
 * deliberately renders it as the *right* column (#392), and renaming both
 * halves is a wider change than this needs.
 */
export function DiscoverJobDetailLeft({ jobId }: DiscoverJobDetailLeftProps) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const { data: internalJob, isLoading: internalLoading } = useJobDetails(jobId, {
    enabled: !!jobId,
  })

  const { data: externalJobsList, isLoading: externalLoading } = useExternalJobs({
    enabled: !!jobId && !internalJob && !internalLoading,
  })

  // Signed out this endpoint 401s, and the public job page renders this
  // panel too — two failed requests per anonymous view before the gate.
  const { user } = useUser()
  const signedIn = !!user
  const { data: myApplication } = useMyApplicationForJob(jobId, {
    enabled: !!jobId && signedIn,
  })

  const isLoading = internalLoading || externalLoading
  const externalJob = externalJobsList?.find((j: { id: string }) => j.id === jobId)
  const job = internalJob || externalJob
  const isExternal = !!externalJob

  // Track job view for engagement analytics
  const trackEventMutation = useTrackEngagementMutation()
  const trackEventRef = useRef(trackEventMutation)
  trackEventRef.current = trackEventMutation

  useEffect(() => {
    if (job) {
      captureEvent('job_viewed', {
        job_id: job.id,
        is_external: isExternal,
        organization_id:
          !isExternal && 'organization' in job ? (job.organization?.id ?? null) : null,
      })

      try {
        trackEventRef.current.mutate({
          eventType: 'job_view',
          targetType: 'job',
          targetId: job.id,
          metadata: {
            job_title: job.title,
            is_external: isExternal,
            organization_id:
              !isExternal && 'organization' in job ? (job.organization?.id ?? null) : null,
          },
        })
      } catch (error) {
        // Silent error handling - don't impact user flow
        console.warn('Failed to track job view:', error)
      }
    }
  }, [job, isExternal])

  if (isLoading) {
    return (
      <Stack gap={16}>
        <Skeleton width={200} height={22} shape="text" />
        <SkeletonText lines={2} lastLineWidth="60%" />
        <SkeletonBox width="100%" height={44} borderRadius={8} />
      </Stack>
    )
  }

  if (!job) {
    return (
      <Stack style={{ flex: 1 }} align="center" justify="center" gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Job not found</Text>
      </Stack>
    )
  }

  const panel = (children: React.ReactNode) => (
    <Stack
      gap={12}
      padding="md"
      borderRadius={12}
      borderWidth={1}
      borderColor={colors.border[t].default}
      style={{ backgroundColor: colors.bg[t].subtle }}
      align="flex-start"
    >
      {children}
    </Stack>
  )

  // Internal posting — the application form is a screen under this one.
  if (!isExternal && 'organization' in job) {
    if (myApplication?.submitted_at) {
      return panel(
        <>
          <H3>You've applied</H3>
          <Text style={{ color: colors.text[t].secondary }}>
            Your application for this role has been sent to the employer.
          </Text>
          <Button
            size="md"
            variant="filled"
            color="primary"
            onPress={() =>
              router.push(
                buildPath(ROUTES.JOBS.APPLICATIONS.DETAIL, {
                  applicationId: myApplication.id,
                })
              )
            }
          >
            View status
          </Button>
        </>
      )
    }

    if (myApplication) {
      return panel(
        <>
          <H3>Finish your application</H3>
          <Text style={{ color: colors.text[t].secondary }}>
            Your answers are saved, but the employer won't see your application until you submit
            it.
          </Text>
          <Button
            size="md"
            variant="filled"
            color="primary"
            onPress={() => router.push(buildPath(ROUTES.JOBS.DETAIL.APPLY, { id: job.id }))}
          >
            Continue application
          </Button>
        </>
      )
    }

    return panel(
      <>
        <H3>Apply to {job.title}</H3>
        <Text style={{ color: colors.text[t].secondary }}>
          A few screening questions, anything the employer asks for, and your documents. Your
          answers save as you go, so you can finish later.
        </Text>
        <Button
          size="md"
          variant="filled"
          color="primary"
          onPress={() => {
            // The apply route is protected; sending a signed-out visitor
            // there would bounce them through a redirect to land on the
            // same sign-in screen. Go straight there instead.
            if (!signedIn) {
              router.push(ROUTES.AUTH.LOGIN.path)
              return
            }
            try {
              trackEventMutation.mutate({
                eventType: 'application_start',
                targetType: 'job',
                targetId: job.id,
                metadata: {
                  job_title: job.title,
                  organization_name: job.organization?.name || 'Unknown Organization',
                },
              })
            } catch (error) {
              // Silent error handling - don't impact user flow
              console.warn('Failed to track application started:', error)
            }
            router.push(buildPath(ROUTES.JOBS.DETAIL.APPLY, { id: job.id }))
          }}
        >
          Apply
        </Button>
      </>
    )
  }

  // External posting with a link out
  if (isExternal && 'company_name' in job && job.url) {
    return panel(
      <>
        <H3>Apply to this position</H3>
        <Text style={{ color: colors.text[t].secondary }}>
          This job is hosted on an external site. Applying opens their own application page.
        </Text>
        <Button
          size="md"
          variant="filled"
          color="primary"
          iconStart={ExternalLink}
          onPress={() => {
            captureEvent('job_external_link_clicked', {
              job_id: job.id,
              url: job.url || null,
            })
            if (job.url) openExternalLink(job.url)
          }}
        >
          Apply on external site
        </Button>
      </>
    )
  }

  // External posting with no link at all — a dead end, so it keeps the one
  // way out. The duplicate back buttons alongside the apply CTAs were
  // removed (#392) because the breadcrumb and the OS back gesture cover
  // those; here there is nothing else.
  if (isExternal) {
    return panel(
      <>
        <H3>No application link</H3>
        <Text style={{ color: colors.text[t].secondary }}>
          This listing did not include a way to apply.
        </Text>
        <Button size="md" variant="outline" onPress={() => router.push(ROUTES.JOBS.path)}>
          Browse jobs
        </Button>
      </>
    )
  }

  return null
}
