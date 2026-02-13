import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { OrganizationDocumentsPanel } from '@scf/core/features/organizations/components/OrganizationDocumentsPanel'
import { OrganizationMembersPanel } from '@scf/core/features/organizations/components/OrganizationMembersPanel'
import { OrganizationSettingsPanel } from '@scf/core/features/organizations/components/OrganizationSettingsPanel'
import { useLocalSearchParams } from 'expo-router'
import { Paragraph, Stack } from '@unicornlove/beyond-ui'

export default function DashboardOrganizationsPage() {
  const params = useLocalSearchParams<{ organizationId?: string }>()
  const organizationId = typeof params.organizationId === 'string' ? params.organizationId : ''

  const mainContent = organizationId ? (
    <Stack gap={16}>
      <OrganizationMembersPanel organizationId={organizationId} />
      <OrganizationDocumentsPanel organizationId={organizationId} />
      <OrganizationSettingsPanel organizationId={organizationId} />
    </Stack>
  ) : (
    <Paragraph color="gray">
      ResponsiveSelect an organization to manage from the sidebar. Once selected, you can invite
      members, upload documents, and update compliance settings from this page.
    </Paragraph>
  )

  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={mainContent}
      rightContent={
        <Stack gap={12}>
          <Paragraph color="gray">
            Use the organization menu to switch between teams you manage. The members panel shows
            current collaborators and pending invitations.
          </Paragraph>
          <Paragraph color="gray">
            Document uploads respect storage limits—check the storage widget in settings for usage
            details.
          </Paragraph>
        </Stack>
      }
    />
  )
}
