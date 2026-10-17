import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { AppSupportScreen } from '@scf/core/features/support/AppSupportScreen'

/**
 * Support for a signed-in user, inside the drawer / phone bar (#1213). The
 * public /support sends a signed-in visitor here, so moving between the app
 * and its help no longer swaps the whole visual language.
 */
export default function SupportPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      readingWidth
      pageTitle="Support"
      screenKicker="Help"
      screenTip="Answers to common questions, and how to reach us."
      leftContent={<AppSupportScreen />}
    />
  )
}
