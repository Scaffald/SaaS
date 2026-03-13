import { OfficeCommunityVerificationScreen } from '@scf/core/features/office/office-community-verification'
import { OfficeLayout } from '@scf/core/components/layouts'

export default function OfficeVerificationScreen() {
  return (
    <OfficeLayout
      leftContent={<OfficeCommunityVerificationScreen />}
      rightContent={null}
    />
  )
}
