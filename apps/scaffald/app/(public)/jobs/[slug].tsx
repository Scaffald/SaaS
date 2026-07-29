import { DashboardLayout } from '@scf/core/components/layouts'
import { ROUTES } from '@scf/core/constants/routes'
import { DiscoverJobDetailScreen } from '@scf/core/features/discover/discover-job-detail-screen'
import { JobPostingJsonLd } from '@scf/core/features/discover/components/JobPostingJsonLd'
import { JobSeoHead } from '@scf/core/features/discover/components/JobSeoHead'
import { useJobBySlug } from '@scf/core/utils/useJobBySlug'
import type { BreadcrumbItemData } from '@scaffald/ui'
import { useLocalSearchParams } from 'expo-router'
import type { GenerateMetadataFunction, LoaderFunction } from 'expo-server'
import { getCanonicalUrl } from '@scf/core/utils/platform'
import { Spinner, Text, Stack } from '@scaffald/ui'
import {
  extractPlainText,
  fetchPublicJobBySlug,
  firstParam,
  SITE_ORIGIN,
  truncate,
  type PublicJob,
} from '../../../utils/public-content-loader'
import { useRouteLoaderData } from '../../../utils/use-route-loader-data'

const jobDescription = (job: PublicJob) => {
  const body = truncate(extractPlainText(job.description), 200)
  if (body) return body
  const where = job.location ? ` in ${job.location}` : ''
  const org = job.organization?.name ? ` at ${job.organization.name}` : ''
  return `${job.title}${org}${where}. Apply on Scaffald.`
}

export const loader: LoaderFunction<{ job: PublicJob | null }> = async (_request, params) => {
  const job = await fetchPublicJobBySlug(params.slug)
  return { job }
}

export const generateMetadata: GenerateMetadataFunction = async (_request, params) => {
  const job = await fetchPublicJobBySlug(params.slug)
  if (!job) {
    // No route-level status override in the renderer yet (always 200), so keep
    // missing jobs out of the index explicitly.
    return { title: 'Job Not Found | Scaffald', robots: { index: false } }
  }
  const org = job.organization?.name
  const title = org ? `${job.title} at ${org}` : job.title
  const description = jobDescription(job)
  const url = `${SITE_ORIGIN}/jobs/${firstParam(params.slug)}`

  return {
    title: `${title} | Scaffald`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Scaffald',
      type: 'article',
      ...(job.organization?.logo_url ? { images: job.organization.logo_url } : {}),
    },
    twitter: { card: 'summary', title, description },
  }
}

/**
 * Public Job Detail Route (Vanity URL)
 * Accessible at /jobs/[slug] - no authentication required
 * Shows public job details based on job's slug.
 * Uses SDK when EXPO_PUBLIC_USE_SDK_JOBS=true, otherwise tRPC.
 */
export default function PublicJobDetailPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const loaderData = useRouteLoaderData<{ job: PublicJob | null }>()

  const {
    data: queriedJob,
    isLoading: isQueryLoading,
    error,
  } = useJobBySlug(slug, {
    enabled: !!slug,
  })

  // Server render (and first client paint) uses the route loader's data; the
  // client query takes over once it resolves.
  const jobData = queriedJob ?? loaderData?.job ?? undefined
  const isLoading = isQueryLoading && !jobData

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItemData[] = [
    { href: '/', label: 'Home' },
    { href: ROUTES.JOBS.path, label: 'Jobs' },
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

  // Build canonical URL for SEO (web only; native has no concept of a canonical URL)
  const canonicalUrl = getCanonicalUrl(`/jobs/${slug}`)

  // The loader's PublicJob and the SDK's Job describe the same row but type
  // `description` differently (raw column vs. string). Both SEO helpers read
  // their fields defensively, so either shape is safe here.
  const seoJob = jobData as Parameters<typeof JobPostingJsonLd>[0]['job']

  return (
    <>
      <JobSeoHead job={seoJob} canonicalUrl={canonicalUrl} />
      <JobPostingJsonLd job={seoJob} canonicalUrl={canonicalUrl} />
      <DashboardLayout breadcrumbItems={breadcrumbItems} leftContent={left} rightContent={right} />
    </>
  )
}
