import { ImportReviewScreen } from '@app/core/features/profile-import/components/ImportReviewScreen'
import { DashboardLayout } from '@app/ui'

export default function ProfileImportReviewPage() {
  return <DashboardLayout leftContent={<ImportReviewScreen />} rightContent={null} />
}
