import { ImportReviewScreen } from '@app/core/features/profile-import/components/ImportReviewScreen'
import { ProfileLayout, QuickLinksSidebar } from '@app/ui'

export default function ProfileImportReviewPage() {
  return <ProfileLayout leftContent={<ImportReviewScreen />} rightContent={<QuickLinksSidebar />} />
}
