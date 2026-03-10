import { DashboardLayout } from '@scf/core/components/layouts'
import { ROUTES } from '@scf/core/constants/routes'
import { DiscoverJobDetailScreen } from '@scf/core/features/discover/discover-job-detail-screen'
import { JobPostingJsonLd } from '@scf/core/features/discover/components/JobPostingJsonLd'
import { JobSeoHead } from '@scf/core/features/discover/components/JobSeoHead'
import { useJobBySlug } from '@scf/core/utils/useJobBySlug'
import type { BreadcrumbItemData } from '@scaffald/ui'
import { useLocalSearchParams } from 'expo-router'
import { Spinner, Text, Stack } from '@scaffald/ui'

/**
 * Public Job Detail Route (Vanity URL)
 * Accessible at /jobs/[slug] - no authentication required
 * Shows public job details based on job's slug.
 * Uses SDK when EXPO_PUBLIC_USE_SDK_JOBS=true, otherwise tRPC.
 */
export default function PublicJobDetailPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()

  const {
    data: jobData,
    isLoading,
    error,
  } = useJobBySlug(slug, {
    enabled: !!slug,
  })

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItemData[] = [
    { href: '/', label: 'Home' },
    { href: ROUTES.DASHBOARD.DISCOVER.JOBS.path, label: 'Jobs' },
    {
      label: jobData?.title || 'Loading...',
    },
  ]

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        leftContent={
          <Stack align="center" justify="center" style={{ minHeight: 400 }}>
            <Spinner size="lg" />
            <Text color="gray">Loading job...</Text>
          </Stack>
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
          <Stack align="center" justify="center" style={{ minHeight: 400 }} gap={16}>
            <Text color="gray">Job Not Found</Text>
            <Text color="gray" style={{ textAlign: 'center' }}>
              The job you're looking for doesn't exist, is no longer available, or has been removed.
            </Text>
          </Stack>
        }
        rightContent={null}
      />
    )
  }

  // Use existing job detail screen component
  const { left, right } = DiscoverJobDetailScreen({ jobId: jobData.id })

  // Build canonical URL for SEO
  const canonicalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/jobs/${slug}`
    : undefined

  return (
    <>
      <JobSeoHead job={jobData} canonicalUrl={canonicalUrl} />
      <JobPostingJsonLd job={jobData} canonicalUrl={canonicalUrl} />
      <DashboardLayout breadcrumbItems={breadcrumbItems} leftContent={left} rightContent={right} />
    </>
  )
}
