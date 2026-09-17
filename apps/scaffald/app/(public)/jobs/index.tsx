import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import type { DiscoverJobsInitialData } from '@scf/core/features/discover/discover-jobs-left'
import { DiscoverJobsScreen } from '@scf/core/features/discover/discover-jobs-screen'
import { JobListJsonLd } from '@scf/core/features/discover/components/JobListJsonLd'
import type { Job } from '@scaffald/sdk/resources/jobs'
import type { GenerateMetadataFunction, LoaderFunction } from 'expo-server'
import { useMemo } from 'react'
import {
  fetchPublicExternalJobs,
  fetchPublicJobs,
  hasSlug,
  SITE_ORIGIN,
  type PublicExternalJob,
  type PublicJob,
} from '../../../utils/public-content-loader'
import { useRouteLoaderData } from '../../../utils/use-route-loader-data'

const PAGE_SIZE = 50

type JobsLoaderData = { jobs: PublicJob[]; externalJobs: PublicExternalJob[] }

export const loader: LoaderFunction<JobsLoaderData> = async () => {
  const [jobs, externalJobs] = await Promise.all([
    fetchPublicJobs(PAGE_SIZE),
    fetchPublicExternalJobs(),
  ])
  return { jobs, externalJobs }
}

export const generateMetadata: GenerateMetadataFunction = async () => {
  const jobs = (await fetchPublicJobs(PAGE_SIZE)).filter(hasSlug)
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
 * The rows are server-rendered (#774). The loader fetches the same two
 * responses the screen's hooks would ask for — published jobs with an empty
 * search, and the external feed — and hands them to the screen as react-query
 * `initialData`. That is one tree, not two: the server renders rows from the
 * loader data, the first client render reads the same loader data through
 * `useLoaderData`, and only after hydration does react-query take over. The
 * earlier version left the rows to react-query after hydration, out of caution
 * about the #679/#681 hydration mismatch; the cost was a 94-second LCP and a
 * CLS of 0.98 on the page most likely to be someone's first impression from a
 * search result. `/jobs/<slug>` has always rendered this way.
 */
export default function PublicJobsPage() {
  const loaderData = useRouteLoaderData<JobsLoaderData>()

  // Keep the seed object stable across renders: `initialData` is read once
  // per query, and a fresh object every render is a needless dependency churn.
  const initialJobs = useMemo<DiscoverJobsInitialData | undefined>(() => {
    if (!loaderData) return undefined
    return {
      // The loader's PublicJob is the same row the SDK types as Job; only the
      // typing of `description` (raw column vs string) differs, and the cards
      // read it defensively.
      internal: {
        data: loaderData.jobs as unknown as Job[],
        total: loaderData.jobs.length,
        limit: PAGE_SIZE,
        offset: 0,
      },
      external: loaderData.externalJobs as unknown as DiscoverJobsInitialData['external'],
    }
  }, [loaderData])

  const { header, left, right, footer } = DiscoverJobsScreen({ initialJobs })

  const listedJobs = (loaderData?.jobs ?? []).filter(hasSlug).map((job) => ({
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
