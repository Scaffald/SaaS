import {
  IdVerificationAdminPage,
  IdVerificationRequestPanel,
} from '@scf/core/features/id-verification'
import { DashboardLayout } from '@scf/core/components/layouts'
import { useState } from 'react'

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
        <IdVerificationRequestPanel
          selectedOrganizationId={organizationId}
          onOrganizationChange={setOrganizationId}
        />
      }
    />
  )
}
