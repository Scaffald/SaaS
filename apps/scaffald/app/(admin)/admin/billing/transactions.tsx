import { AdminGroupTabs } from '@scf/core/features/admin/AdminGroupTabs'
import { OfficeTransactionHistory } from '@scf/core/features/office/payments'

export default function AdminTransactionsScreen() {
  return (
    <>
      <AdminGroupTabs />
      <OfficeTransactionHistory />
    </>
  )
}
