import { DiscoverWorkersLeft } from '@app/core/features/discover/discover-workers-left'
import { DiscoverWorkersRight } from '@app/core/features/discover/discover-workers-right'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function DiscoverWorkersPage() {
  return (
    <DashboardLayout
      leftContent={<DiscoverWorkersLeft />}
      rightContent={<DiscoverWorkersRight />}
    />
  )
}
