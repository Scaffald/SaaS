import { DiscoverJobsLeft } from '@app/core/features/discover/discover-jobs-left'
import { DiscoverJobsRight } from '@app/core/features/discover/discover-jobs-right'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function DiscoverJobsPage() {
  return <DashboardLayout leftContent={<DiscoverJobsLeft />} rightContent={<DiscoverJobsRight />} />
}
