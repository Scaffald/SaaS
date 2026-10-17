import {
  IdVerificationAdminPage,
  IdVerificationRequestPanel,
} from '@scf/core/features/id-verification'
import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { useState } from 'react'

// OfficeLayout, like the other ATS screens (#1202): the same canvas and the ATS
// sub-tab strip. The request panel stays beside the list; it is the page's own
// action, not navigation.
export default function OfficeIdVerificationsScreen() {
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  return (
    <OfficeLayout
      leftContent={
        <IdVerificationAdminPage
          selectedOrganizationId={organizationId}
          onOrganizationChange={setOrganizationId}
        />
      }
      rightContent={
        <IdVerificationRequestPanel
          selectedOrganizationId={organizationId}
          onOrganizationChange={setOrganizationId}
        />
      }
    />
  )
}
