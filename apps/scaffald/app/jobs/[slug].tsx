import { DashboardLayout } from '@scf/core/components/layouts'
import { ROUTES } from '@scf/core/constants/routes'
import { DiscoverJobDetailScreen } from '@scf/core/features/discover/discover-job-detail-screen'
import { api } from '@scf/core/utils/api'
import type { BreadcrumbItem } from '@unicornlove/ui'
import { useLocalSearchParams } from 'expo-router'
import { Spinner, Text, YStack } from '@unicornlove/ui'

/**
 * Public Job Detail Route (Vanity URL)
 * Accessible at /jobs/[slug] - no authentication required
 * Shows public job details based on job's slug
 */
export default function PublicJobDetailPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()

  // Fetch job by slug
  const {
    data: jobData,
    isLoading,
    error,
  } = api.jobs.bySlug.useQuery(
    { slug: slug || '' },
    {
      enabled: !!slug,
      retry: false, // Don't retry on 404
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { href: '/', label: 'Home' },
    { href: ROUTES.DASHBOARD.DISCOVER.JOBS.path, label: 'Jobs' },
    {
      isActive: true,
      label: jobData?.title || 'Loading...',
    },
  ]

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        leftContent={
          <YStack alignItems="center" justifyContent="center" style={{ minHeight: 400 }}>
            <Spinner size="large" />
            <Text marginTop="$4" color="$color10">
              Loading job...
            </Text>
          </YStack>
        }
        rightContent={null}
      />
    )
  }

  // Error state (404 or other error)
  if (error || !jobData) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        leftContent={
          <YStack alignItems="center" justifyContent="center" style={{ minHeight: 400 }} gap="$4">
            <Text fontSize="$6" fontWeight="bold" color="$color11">
              Job Not Found
            </Text>
            <Text color="$color10" style={{ textAlign: 'center' }}>
              The job you're looking for doesn't exist, is no longer available, or has been removed.
            </Text>
          </YStack>
        }
        rightContent={null}
      />
    )
  }

  // Use existing job detail screen component
  const { left, right } = DiscoverJobDetailScreen({ jobId: jobData.id })

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems} leftContent={left} rightContent={right} />
  )
}
