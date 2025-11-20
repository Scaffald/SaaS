import { ROUTES } from '@app/core/constants/routes'
import { ApplicationWizard, QuickApplyModal } from '@app/core/features/applications/components'
import { getApplicationFlow } from '@app/core/features/applications/utils/getApplicationFlow'
import { captureEvent } from '@app/core/utils/analytics/client'
import { api } from '@app/core/utils/api'
import { ExternalLink } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Button, Spinner, Text, YStack } from 'tamagui'

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

  // Try fetching as internal job first
  const { data: internalJobData, isLoading: internalLoading } = api.jobs.getJobDetails.useQuery(
    { id: jobId },
    { enabled: !!jobId }
  )

  const internalJob = internalJobData?.job

  // If not found as internal, try external
  const { data: externalJobs, isLoading: externalLoading } = api.jobs.getExternalJobs.useQuery(
    undefined,
    { enabled: !!jobId && !internalJob && !internalLoading }
  )

  const isLoading = internalLoading || externalLoading
  const externalJob = externalJobs?.jobs?.find((j: { id: string }) => j.id === jobId)
  const job = internalJob || externalJob
  const isExternal = !!externalJob

  // Determine which flow to use (must be computed before conditional returns)
  const flowType =
    job && !isExternal && 'organization' in job
      ? getApplicationFlow({
          id: job.id,
          title: job.title,
          organization: job.organization,
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

  useEffect(() => {
    if (job) {
      captureEvent('job_viewed', {
        job_id: job.id,
        is_external: isExternal,
        organization_id:
          !isExternal && 'organization' in job ? (job.organization?.id ?? null) : null,
      })
    }
  }, [job, isExternal])

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4">
        <Spinner size="large" color="$blue10" />
        <Text mt="$2" color="$color11">
          Loading...
        </Text>
      </YStack>
    )
  }

  if (!job) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4" gap="$2">
        <Text fontSize="$6" fontWeight="600" color="$color12">
          Job not found
        </Text>
      </YStack>
    )
  }

  // Internal job - show appropriate flow based on job requirements
  if (!isExternal && 'organization' in job && flowType) {
    // Quick apply flow
    if (flowType === 'quick') {
      return (
        <YStack flex={1} p="$4" gap="$4">
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="700" color="$color12">
              Apply to {job.title}
            </Text>
            <Text fontSize="$4" color="$color11" lineHeight="$5">
              This is a quick application. You'll answer a few screening questions and submit your
              application.
            </Text>
          </YStack>

          <Button
            size="$5"
            theme="info"
            onPress={() => {
              setShowQuickApply(true)
              // TODO: Add 'application_started' to analytics event types
              console.log('Application started:', { flow_type: 'quick', job_id: job.id })
            }}
          >
            Apply Now
          </Button>

          <Button
            size="$4"
            chromeless
            onPress={() => {
              router.push(ROUTES.DASHBOARD_DISCOVER_JOBS.path)
            }}
          >
            Back to Jobs
          </Button>

          {showQuickApply && (
            <QuickApplyModal
              jobId={job.id}
              jobTitle={job.title}
              organizationName={job.organization?.name || 'Unknown Organization'}
              open={showQuickApply}
              onOpenChange={setShowQuickApply}
              onSuccess={(applicationId) => {
                console.log('Quick application submitted successfully:', applicationId)
                // TODO: Add 'application_completed' to analytics event types
                console.log('Application completed:', {
                  flow_type: 'quick',
                  job_id: job.id,
                  application_id: applicationId,
                })
                setShowQuickApply(false)
                // Could navigate to applications page or show success
              }}
            />
          )}
        </YStack>
      )
    }

    // Full wizard flow
    return (
      <YStack flex={1} height="100%">
        <ApplicationWizard
          jobId={job.id}
          jobTitle={job.title}
          organizationName={job.organization?.name || 'Unknown Organization'}
          onSuccess={(applicationId) => {
            console.log('Application submitted successfully:', applicationId)
            // TODO: Add 'application_completed' to analytics event types
            console.log('Application completed:', {
              flow_type: 'full',
              job_id: job.id,
              application_id: applicationId,
            })
            // Could navigate to applications page or show success
          }}
          onCancel={() => {
            // Navigate back to jobs list
            router.push(ROUTES.DASHBOARD_DISCOVER_JOBS.path)
          }}
          onReturnToJobs={() => {
            router.push(ROUTES.DASHBOARD_DISCOVER_JOBS.path)
          }}
        />
      </YStack>
    )
  }

  // External job - show external link button
  if (isExternal && 'company_name' in job && job.url) {
    return (
      <YStack flex={1} p="$4" gap="$4">
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="700" color="$color12">
            Apply to this Position
          </Text>
          <Text fontSize="$4" color="$color11" lineHeight="$5">
            This job is hosted on an external site. Click the button below to visit their
            application page and apply directly through their system.
          </Text>
        </YStack>

        <Button
          size="$5"
          theme="info"
          icon={ExternalLink}
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
          Apply on External Site
        </Button>

        <Button
          size="$4"
          chromeless
          onPress={() => {
            router.push(ROUTES.DASHBOARD_DISCOVER_JOBS.path)
          }}
        >
          Back to Jobs
        </Button>
      </YStack>
    )
  }

  // External job without URL
  if (isExternal) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4" gap="$3">
        <Text fontSize="$5" fontWeight="600" color="$color11" text="center">
          Application link not available
        </Text>
        <Button
          size="$4"
          theme="info"
          onPress={() => {
            router.push(ROUTES.DASHBOARD_DISCOVER_JOBS.path)
          }}
        >
          Back to Jobs
        </Button>
      </YStack>
    )
  }

  return null
}
