import { ROUTES } from '@scf/core/constants/routes'
import { ApplicationWizard, QuickApplyModal } from '@scf/core/features/applications/components'
import { getApplicationFlow } from '@scf/core/features/applications/utils/getApplicationFlow'
import { captureEvent } from '@scf/core/utils/analytics/client'
import { useExternalJobs, useJobDetails } from '@scf/core/utils/jobs-sdk-hooks'
import { useTrackEngagementMutation } from '@scf/core/utils/engagement-sdk-hooks'
import { ExternalLink } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Button, Skeleton, SkeletonBox, SkeletonText, Text, Stack, Row } from '@scaffald/ui'

interface DiscoverJobDetailLeftProps {
  jobId: string
}

/**
 * Discover Job Detail Left Component
 * Displays ApplicationWizard for internal jobs or external link for external jobs
 */
export function DiscoverJobDetailLeft({ jobId }: DiscoverJobDetailLeftProps) {
  const router = useRouter()

  // Hooks must be called unconditionally at the top level
  const [showQuickApply, setShowQuickApply] = useState(false)

  // Try fetching as internal job first (SDK)
  const { data: internalJob, isLoading: internalLoading } = useJobDetails(jobId, {
    enabled: !!jobId,
  })

  // If not found as internal, try external (SDK)
  const { data: externalJobsList, isLoading: externalLoading } = useExternalJobs({
    enabled: !!jobId && !internalJob && !internalLoading,
  })

  const isLoading = internalLoading || externalLoading
  const externalJob = externalJobsList?.find((j: { id: string }) => j.id === jobId)
  const job = internalJob || externalJob
  const isExternal = !!externalJob

  // Determine which flow to use (must be computed before conditional returns)
  const flowType =
    job && !isExternal && 'organization' in job
      ? getApplicationFlow({
          id: job.id,
          title: job.title ?? 'Job',
          organization: job.organization
            ? { name: job.organization.name ?? 'Unknown Organization' }
            : null,
          custom_application_questions:
            'custom_application_questions' in job
              ? (job.custom_application_questions as
                  | Array<{
                      id: string
                      question: string
                      type:
                        | 'short_text'
                        | 'long_text'
                        | 'single_choice'
                        | 'multiple_choice'
                        | 'yes_no'
                      required: boolean
                      options?: string[]
                    }>
                  | undefined)
              : undefined,
          required_attachments:
            'required_attachments' in job
              ? (job.required_attachments as
                  | Record<
                      string,
                      {
                        required: boolean
                        max_size_mb?: number
                      }
                    >
                  | undefined)
              : undefined,
        })
      : null

  // Track flow selection
  useEffect(() => {
    if (job && flowType) {
      // TODO: Add 'application_flow_selected' to analytics event types
      console.log('Application flow selected:', { flow_type: flowType, job_id: job.id })
    }
  }, [job, flowType])

  // Track job view for engagement analytics
  const trackEventMutation = useTrackEngagementMutation()

  useEffect(() => {
    if (job) {
      // Track in analytics (existing)
      captureEvent('job_viewed', {
        job_id: job.id,
        is_external: isExternal,
        organization_id:
          !isExternal && 'organization' in job ? (job.organization?.id ?? null) : null,
      })

      // Track in engagement analytics
      try {
        trackEventMutation.mutate({
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
  }, [job, isExternal, trackEventMutation])

  if (isLoading) {
    return (
      <Stack gap={16} padding="md">
        <Skeleton width={200} height={22} shape="text" />
        <Skeleton width={140} height={14} shape="text" />
        <Row gap={8} wrap>
          {[0, 1, 2].map((i) => (
            <SkeletonBox key={i} width={80} height={28} borderRadius={99} />
          ))}
        </Row>
        <SkeletonText lines={4} lastLineWidth="60%" />
        <SkeletonBox width="100%" height={44} borderRadius={8} />
      </Stack>
    )
  }

  if (!job) {
    return (
      <Stack style={{ flex: 1 }} align="center" justify="center" padding="md" gap={8}>
        <Text color="secondary">Job not found</Text>
      </Stack>
    )
  }

  // Internal job - show appropriate flow based on job requirements
  if (!isExternal && 'organization' in job && flowType) {
    // Quick apply flow
    if (flowType === 'quick') {
      return (
        <Stack style={{ flex: 1 }} padding="md" gap={16}>
          <Stack gap={12}>
            <Text color="secondary">Apply to {job.title}</Text>
            <Text color="secondary" style={{ lineHeight: 20 }}>
              This is a quick application. You'll answer a few screening questions and submit your
              application.
            </Text>
          </Stack>

          <Button
            size="lg"
            color="primary"
            onPress={() => {
              setShowQuickApply(true)
              // Track application started for quick apply flow
              try {
                trackEventMutation.mutate({
                  eventType: 'application_start',
                  targetType: 'job',
                  targetId: job.id,
                  metadata: {
                    job_title: job.title,
                    flow_type: 'quick',
                    organization_name: job.organization?.name || 'Unknown Organization',
                  },
                })
              } catch (error) {
                // Silent error handling - don't impact user flow
                console.warn('Failed to track application started (quick):', error)
              }
            }}
          >
            Apply Now
          </Button>

          <Button
            size="md"
            variant="outline"
            onPress={() => {
              router.push(ROUTES.DASHBOARD.DISCOVER.JOBS.path)
            }}
          >
            Back to Jobs
          </Button>

          {showQuickApply && (
            <QuickApplyModal
              jobId={job.id}
              jobTitle={job.title ?? 'Job'}
              organizationName={job.organization?.name ?? 'Unknown Organization'}
              open={showQuickApply}
              onOpenChange={setShowQuickApply}
              onSuccess={(applicationId) => {
                // Track application submitted for quick apply flow
                try {
                  trackEventMutation.mutate({
                    eventType: 'application_complete',
                    targetType: 'job',
                    targetId: job.id,
                    metadata: {
                      job_title: job.title,
                      flow_type: 'quick',
                      application_id: applicationId,
                      organization_name: job.organization?.name || 'Unknown Organization',
                    },
                  })
                } catch (error) {
                  // Silent error handling - don't impact user flow
                  console.warn('Failed to track application submitted (quick):', error)
                }

                setShowQuickApply(false)
                // Could navigate to applications page or show success
              }}
            />
          )}
        </Stack>
      )
    }

    // Full wizard flow
    return (
      <Stack style={{ flex: 1, height: '100%' }}>
        <ApplicationWizard
          jobId={job.id}
          jobTitle={job.title ?? 'Job'}
          organizationName={job.organization?.name ?? 'Unknown Organization'}
          onSuccess={(applicationId) => {
            // Track application submitted for full wizard flow
            try {
              trackEventMutation.mutate({
                eventType: 'application_complete',
                targetType: 'job',
                targetId: job.id,
                metadata: {
                  job_title: job.title,
                  flow_type: 'full',
                  application_id: applicationId,
                  organization_name: job.organization?.name || 'Unknown Organization',
                },
              })
            } catch (error) {
              // Silent error handling - don't impact user flow
              console.warn('Failed to track application submitted (full):', error)
            }
            // Could navigate to applications page or show success
          }}
          onCancel={() => {
            // Navigate back to jobs list
            router.push(ROUTES.DASHBOARD.DISCOVER.JOBS.path)
          }}
          onReturnToJobs={() => {
            router.push(ROUTES.DASHBOARD.DISCOVER.JOBS.path)
          }}
        />
      </Stack>
    )
  }

  // External job - show external link button
  if (isExternal && 'company_name' in job && job.url) {
    return (
      <Stack style={{ flex: 1 }} padding="md" gap={16}>
        <Stack gap={12}>
          <Text color="secondary">Apply to this Position</Text>
          <Text color="secondary" style={{ lineHeight: 20 }}>
            This job is hosted on an external site. Click the button below to visit their
            application page and apply directly through their system.
          </Text>
        </Stack>

        <Button
          size="lg"
          color="primary"
          onPress={() => {
            captureEvent('job_external_link_clicked', {
              job_id: job.id,
              url: job.url || null,
            })
            if (job.url) {
              // Open external URL
              if (typeof window !== 'undefined') {
                window.open(job.url, '_blank')
              }
            }
          }}
        >
          <Row gap={8} align="center">
            <ExternalLink size={20} />
            <Text>Apply on External Site</Text>
          </Row>
        </Button>

        <Button
          size="md"
          variant="outline"
          onPress={() => {
            router.push(ROUTES.DASHBOARD.DISCOVER.JOBS.path)
          }}
        >
          Back to Jobs
        </Button>
      </Stack>
    )
  }

  // External job without URL
  if (isExternal) {
    return (
      <Stack style={{ flex: 1 }} align="center" justify="center" padding="md" gap={12}>
        <Text color="secondary" style={{ textAlign: 'center' }}>
          Application link not available
        </Text>
        <Button
          size="md"
          color="primary"
          onPress={() => {
            router.push(ROUTES.DASHBOARD.DISCOVER.JOBS.path)
          }}
        >
          Back to Jobs
        </Button>
      </Stack>
    )
  }

  return null
}
