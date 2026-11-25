import { AdminGroupTabs } from '@scf/core/features/admin/AdminGroupTabs'
import { OfficeStorageDashboard } from '@scf/core/features/office/office-storage-dashboard'

export default function AdminStorageScreen() {
  return (
    <>
      <AdminGroupTabs />
      <OfficeStorageDashboard />
    </>
  )
}
