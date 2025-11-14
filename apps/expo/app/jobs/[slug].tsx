import { useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { YStack, Spinner, Text } from 'tamagui'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import { DiscoverJobDetailScreen } from '@app/core/features/discover/discover-job-detail-screen'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import type { BreadcrumbItem } from '@app/ui'

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
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: false, // Don't retry on 404
    }
  )

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Jobs', href: ROUTES.DASHBOARD_DISCOVER_JOBS.path },
    {
      label: jobData?.title || 'Loading...',
      isActive: true,
    },
  ]

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        leftContent={
          <YStack items="center" justify="center" style={{ minHeight: 400 }}>
            <Spinner size="large" />
            <Text mt="$4" color="$color10">
              Loading job...
            </Text>
          </YStack>
        }
        rightContent={<QuickLinksSidebar />}
      />
    )
  }

  // Error state (404 or other error)
  if (error || !jobData) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        leftContent={
          <YStack items="center" justify="center" style={{ minHeight: 400 }} gap="$4">
            <Text fontSize="$6" fontWeight="bold" color="$color11">
              Job Not Found
            </Text>
            <Text color="$color10" style={{ textAlign: 'center' }}>
              The job you're looking for doesn't exist, is no longer available, or has been removed.
            </Text>
          </YStack>
        }
        rightContent={<QuickLinksSidebar />}
      />
    )
  }

  // Use existing job detail screen component
  const { left, right } = DiscoverJobDetailScreen({ jobId: jobData.id })

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      leftContent={left}
      rightContent={<QuickLinksSidebar>{right}</QuickLinksSidebar>}
    />
  )
}
