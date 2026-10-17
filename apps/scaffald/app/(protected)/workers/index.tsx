import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverWorkersScreen } from '@scf/core/features/discover/discover-workers-screen'

// No right rail: it held invented figures (signups, trade shares, an
// off-topic tip) with no data behind them, and the prototype's Find talent
// is one full-width list (#1168).
export default function DiscoverWorkersPage() {
  const { header, left, footer } = DiscoverWorkersScreen()
  return (
    <>
      <DashboardPage
        screenKicker="Employer view — find talent"
        showBreadcrumb={false}
        screenTip="Search by trade, skill or location. Open anyone to see their proof before you reach out."
        headerContent={header}
        leftContent={left}
      />
      {footer}
    </>
  )
}
