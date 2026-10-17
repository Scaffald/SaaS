import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { captureEvent } from '@scf/core/utils/analytics/client'
import {
  useExternalJobs,
  useJobDetails,
  useMyApplicationForJob,
} from '@scf/core/utils/jobs-sdk-hooks'
import { useTrackEngagementMutation } from '@scf/core/utils/engagement-sdk-hooks'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import {
  Button,
  H3,
  Separator,
  Skeleton,
  SkeletonText,
  Text,
  TextLink,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useUser } from '@scf/core/utils/useUser'

interface DiscoverJobDetailLeftProps {
  jobId: string
}

/**
 * The rail beside a job posting: who is hiring, and what applying involves.
 *
 * It used to *be* the application — a four-step wizard in a 38% column —
 * then, once applying became a screen (#829), a boxed card with its own
 * filled Apply. That put two primaries about 250px apart, since the header
 * carries `JobDetailApplyAction` (#1182). The header keeps the one Apply;
 * this rail is unboxed notes, as the redesign draws them, and the employer's
 * name finally leads somewhere (#1181).
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
  // rail too — two failed requests per anonymous view before the gate.
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

  const note = (title: string, body: string, extra?: React.ReactNode) => (
    <Stack gap={8} align="flex-start">
      <H3>{title}</H3>
      <Text style={{ color: colors.text[t].secondary }}>{body}</Text>
      {extra}
    </Stack>
  )

  // Internal posting — the application form is a screen under this one,
  // opened from the header's Apply.
  if (!isExternal && 'organization' in job) {
    const organization = job.organization
    const employerId = organization?.id
    const employer = organization?.name ? (
      <Stack gap={8} align="flex-start">
        <H3>Hiring</H3>
        <Text style={{ color: colors.text[t].primary, fontWeight: '600' }}>
          {organization.name}
        </Text>
        {/* /employers/<id> is a signed-in screen; a signed-out visitor would
            only be bounced to sign-in, so the name stays plain for them. */}
        {signedIn && employerId ? (
          <TextLink
            onPress={() => router.push(buildPath(ROUTES.EMPLOYERS.DETAIL, { id: employerId }))}
            accessibilityLabel={`See ${organization.name}'s employer page`}
          >
            See the employer's page
          </TextLink>
        ) : null}
      </Stack>
    ) : null

    const applying = myApplication?.submitted_at
      ? note(
          "You've applied",
          'Your application for this role has been sent to the employer. Its status is under Applications.'
        )
      : myApplication
        ? note(
            'Finish your application',
            "Your answers are saved, but the employer won't see your application until you submit it."
          )
        : note(
            'What applying involves',
            'A few screening questions, anything the employer asks for, and your documents. Your answers save as you go, so you can finish later.'
          )

    return (
      <Stack gap={20}>
        {employer}
        {employer ? <Separator /> : null}
        {applying}
      </Stack>
    )
  }

  // External posting with a link out — the header's Apply opens it.
  if (isExternal && 'company_name' in job && job.url) {
    return note(
      'Applying',
      `This job is hosted on ${job.company_name ? `${job.company_name}'s` : 'an external'} site. Apply opens their own application page.`
    )
  }

  // External posting with no link at all — a dead end, so it keeps the one
  // way out, back to the listing the viewer came from: the signed-in one
  // inside the shell, or the public one for a visitor (#1179).
  if (isExternal) {
    return note(
      'No application link',
      'This listing did not include a way to apply.',
      <Button
        size="md"
        variant="outline"
        onPress={() => router.push(signedIn ? ROUTES.JOBS.BROWSE.path : ROUTES.JOBS.path)}
      >
        Browse jobs
      </Button>
    )
  }

  return null
}
