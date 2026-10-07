import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverJobsScreen } from '@scf/core/features/discover/discover-jobs-screen'

/**
 * The signed-in jobs listing — `/jobs/browse`, inside the drawer shell.
 *
 * `/jobs` itself is public and deliberately drawerless (#756, #766): it is
 * the crawlers' and signed-out visitors' entry to the public detail pages.
 * That left the drawer's Jobs row dropping a signed-in person out of the
 * shell. This is the same `DiscoverJobsScreen`, mounted where the Jobs tab
 * strip and the column are; the rows come from react-query here rather than
 * a loader, since nobody arrives at this URL from a search result.
 */
export default function BrowseJobsPage() {
  const { header, left, right, footer } = DiscoverJobsScreen()

  return (
    <>
      <DashboardPage
        showBreadcrumb={false}
        screenKicker="Find work"
        screenTip="Scaffald postings and outside listings in one place. Open one for pay and requirements, or save it for later."
        headerContent={header}
        leftContent={left}
        rightContent={right}
      />
      {footer}
    </>
  )
}
