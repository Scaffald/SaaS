import { YStack, Text, Button, Spinner } from 'tamagui'
import { ExternalLink } from '@tamagui/lucide-icons'
import { ApplicationWizard } from '@app/core/features/applications/components'
import { api } from '@app/core/utils/api'
import { useRouter } from 'expo-router'
import { ROUTES } from '@app/core/constants/routes'

interface DiscoverJobDetailLeftProps {
  jobId: string
}

/**
 * Discover Job Detail Left Component
 * Displays ApplicationWizard for internal jobs or external link for external jobs
 */
export function DiscoverJobDetailLeft({ jobId }: DiscoverJobDetailLeftProps) {
  const router = useRouter()

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

  // Internal job - show ApplicationWizard
  if (!isExternal && 'organization' in job) {
    return (
      <YStack flex={1} height="100%">
        <ApplicationWizard
          jobId={job.id}
          jobTitle={job.title}
          organizationName={job.organization?.name || 'Unknown Organization'}
          onSuccess={(applicationId) => {
            console.log('Application submitted successfully:', applicationId)
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
          theme="blue"
          icon={ExternalLink}
          onPress={() => {
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
          theme="blue"
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
