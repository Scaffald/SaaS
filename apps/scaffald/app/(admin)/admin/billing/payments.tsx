import { AdminGroupTabs } from '@scf/core/features/admin/AdminGroupTabs'
import { OfficePaymentAnalytics } from '@scf/core/features/office/payments'

export default function AdminPaymentsScreen() {
  return (
    <>
      <AdminGroupTabs />
      <OfficePaymentAnalytics />
    </>
  )
}
