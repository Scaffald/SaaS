import { useState } from 'react'

import {
  IdVerificationAdminPage,
  IdVerificationRequestPanel,
} from '@app/core/features/id-verification'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function OfficeIdVerificationsScreen() {
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  return (
    <DashboardLayout
      leftContent={
        <IdVerificationAdminPage
          selectedOrganizationId={organizationId}
          onOrganizationChange={setOrganizationId}
        />
      }
      rightContent={
        <QuickLinksSidebar>
          <IdVerificationRequestPanel
            selectedOrganizationId={organizationId}
            onOrganizationChange={setOrganizationId}
          />
        </QuickLinksSidebar>
      }
    />
  )
}
