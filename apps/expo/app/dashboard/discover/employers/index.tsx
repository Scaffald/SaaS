import { DiscoverEmployersLeft } from '@app/core/features/discover/discover-employers-left'
import { DiscoverEmployersRight } from '@app/core/features/discover/discover-employers-right'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function DiscoverEmployersPage() {
  return (
    <DashboardLayout
      leftContent={<DiscoverEmployersLeft />}
      rightContent={<DiscoverEmployersRight />}
    />
  )
}
