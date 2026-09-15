import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverJobsScreen } from '@scf/core/features/discover/discover-jobs-screen'
import { JobListJsonLd } from '@scf/core/features/discover/components/JobListJsonLd'
import type { GenerateMetadataFunction, LoaderFunction } from 'expo-server'
import { fetchPublicJobs, SITE_ORIGIN, type PublicJob } from '../../../utils/public-content-loader'
import { useRouteLoaderData } from '../../../utils/use-route-loader-data'

type JobsLoaderData = { jobs: PublicJob[] }

export const loader: LoaderFunction<JobsLoaderData> = async () => {
  const jobs = await fetchPublicJobs()
  return { jobs }
}

export const generateMetadata: GenerateMetadataFunction = async () => {
  const jobs = await fetchPublicJobs()
  const description = jobs.length
    ? `Browse ${jobs.length} open construction job${jobs.length === 1 ? '' : 's'} on Scaffald — welders, foremen, technicians and more, with pay and location on every listing.`
    : 'Browse open construction jobs on Scaffald — welders, foremen, technicians and more, with pay and location on every listing.'
  const url = `${SITE_ORIGIN}/jobs`

  return {
    title: 'Construction Jobs | Scaffald',
    description,
    alternates: { canonical: url },
    openGraph: {
      title: 'Construction Jobs',
      description,
      url,
      siteName: 'Scaffald',
      type: 'website',
    },
    twitter: { card: 'summary', title: 'Construction Jobs', description },
  }
}

/**
 * Public jobs listing — `/jobs`, no authentication required.
 *
 * This route used to live under `(protected)`, which meant the sitemap invited
 * crawlers to a page that showed them a signed-in shell and then bounced them
 * to `/auth` (#756). It is the natural entry point to the `/jobs/<slug>` detail
 * pages that #734 made public, so gating the list while publishing the details
 * was the inconsistency worth removing.
 *
 * Signed-in and signed-out visitors get the same screen. The SDK provider
 * already falls back to the anon key when there is no session, and
 * `GET /v1/jobs` answers anonymous callers, so `DiscoverJobsScreen` needs no
 * session to populate — only the layout gate above it ever stopped it.
 *
 * There is deliberately no DrawerLayout here, matching `/jobs/<slug>`.
 * DrawerContent has no signed-out variant: it renders an avatar and a "Sign
 * out" item unconditionally, which is the account chrome #756 objected to
 * being shown to anonymous visitors. Signed-out navigation is its own piece of
 * work, tracked separately.
 *
 * The rows themselves arrive through react-query after hydration, so the
 * crawlable copy of this page is its metadata plus the ItemList emitted from
 * the loader. Rendering a second, server-only list would mean two trees that
 * have to agree — the hydration failure mode already tracked in #679/#681 —
 * for content Google reads out of the structured data anyway.
 */
export default function PublicJobsPage() {
  const loaderData = useRouteLoaderData<JobsLoaderData>()
  const { header, left, right, footer } = DiscoverJobsScreen()

  const listedJobs = (loaderData?.jobs ?? []).map((job) => ({
    slug: job.slug,
    title: job.title,
  }))

  return (
    <>
      <JobListJsonLd jobs={listedJobs} origin={SITE_ORIGIN} />
      <DashboardPage
        showBreadcrumb={false}
        headerContent={header}
        leftContent={left}
        rightContent={right}
      />
      {footer}
    </>
  )
}
