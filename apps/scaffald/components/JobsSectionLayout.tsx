import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { useUser } from '@scf/core/utils/useUser'

/**
 * The chrome for the signed-in job sections — saved, applications, my-listings
 * and the job detail view.
 *
 * This used to be one `_layout.tsx` at `app/(protected)/jobs/`, and that is
 * precisely what broke `/jobs` when the listing became public (#756, #766).
 * A layout file makes its directory a navigator that claims the bare path, so
 * `(protected)/jobs/_layout.tsx` claimed `"jobs"` — and once the listing moved
 * to `(public)`, two screens claimed it:
 *
 *   "jobs"        /(protected)/jobs          <- navigator, no index child
 *   "jobs"        /(public)/jobs/index
 *
 * React Navigation takes the first match, found a navigator with nothing to
 * render, and expo-router rewrote the URL to `/`. Anonymous visitors to /jobs
 * landed on the marketing page.
 *
 * Mounting the same chrome one level deeper — at each subsection — leaves the
 * `jobs` segment itself without a navigator, so the only claim on `"jobs"` is
 * the public listing. Every child URL is unchanged: `jobs/saved`,
 * `jobs/applications`, `jobs/applications/:applicationId`, `jobs/view/:id`.
 */
export function JobsSectionLayout() {
  const { user } = useUser()

  return (
    <ErrorBoundary context={{ section: 'jobs', userId: user?.id }}>
      <DrawerLayout protectionComponent={null}>{null}</DrawerLayout>
    </ErrorBoundary>
  )
}
