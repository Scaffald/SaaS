import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverEmployersScreen } from '@scf/core/features/discover/discover-employers-screen'
import { OrganizationDocumentsPanel } from '@scf/core/features/organizations/components/OrganizationDocumentsPanel'
import { OrganizationMembersPanel } from '@scf/core/features/organizations/components/OrganizationMembersPanel'
import { OrganizationSettingsPanel } from '@scf/core/features/organizations/components/OrganizationSettingsPanel'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { Pressable } from 'react-native'
import {
  Button,
  Paragraph,
  ScrollView,
  Stack,
  Text,
  Tabs,
} from '@scaffald/ui'

const TAB_DISCOVER = 'discover'
const TAB_MANAGE = 'manage'

function buildEmployersPath(params: { tab?: string; organizationId?: string }) {
  const base = ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path
  const search = new URLSearchParams()
  if (params.tab && params.tab !== TAB_DISCOVER) {
    search.set('tab', params.tab)
  }
  if (params.organizationId) {
    search.set('organizationId', params.organizationId)
  }
  const q = search.toString()
  return q ? `${base}?${q}` : base
}

export default function DiscoverEmployersPage() {
  const router = useRouter()
  const params = useLocalSearchParams<{ tab?: string; organizationId?: string }>()
  const { t } = useTranslation()
  const activeTab = params.tab === TAB_MANAGE ? TAB_MANAGE : TAB_DISCOVER
  const organizationId =
    typeof params.organizationId === 'string' ? params.organizationId : ''

  const { data: memberships = [], isLoading: isLoadingOrgs } = useOrganizations()

  const handleTabChange = useCallback(
    (value: string) => {
      const path =
        value === TAB_MANAGE
          ? buildEmployersPath({ tab: TAB_MANAGE })
          : ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path
      router.replace(path)
    },
    [router]
  )

  const handleSelectOrganization = useCallback(
    (id: string) => {
      router.replace(buildEmployersPath({ tab: TAB_MANAGE, organizationId: id }))
    },
    [router]
  )

  const discoverContent = useMemo(() => {
    const { left, right } = DiscoverEmployersScreen()
    return { left, right }
  }, [])

  const manageLeftContent = useMemo(() => {
    if (isLoadingOrgs) {
      return (
        <Stack gap={12} padding={16}>
          <Paragraph color="gray">Loading your organizations…</Paragraph>
        </Stack>
      )
    }
    if (memberships.length === 0) {
      return (
        <Stack gap={12} padding={16}>
          <Paragraph color="gray">
            You are not a member of any organizations yet. Use Discover to find
            employers or request to add one.
          </Paragraph>
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.replace(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.CREATE.path)}
          >
            {t('routes.dashboard.discover.employers.create')}
          </Button>
        </Stack>
      )
    }
    return (
      <ScrollView style={{ flex: 1 }}>
        <Stack gap={8} padding={12}>
          {memberships.map((m) => (
            <Pressable
              key={m.organization_id}
              onPress={() => handleSelectOrganization(m.organization_id)}
              style={({ pressed }: { pressed: boolean }) => ({
                opacity: pressed ? 0.8 : 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor:
                  organizationId === m.organization_id ? '#e0e7ff' : 'transparent',
              })}
            >
              <Text weight={organizationId === m.organization_id ? 'semibold' : 'regular'}>
                {m.organization_name}
              </Text>
            </Pressable>
          ))}
        </Stack>
      </ScrollView>
    )
  }, [
    isLoadingOrgs,
    memberships,
    organizationId,
    handleSelectOrganization,
    router,
    t,
  ])

  const manageRightContent = useMemo(() => {
    if (!organizationId) {
      return (
        <Stack gap={12}>
          <Paragraph color="gray">
            Select an organization to manage from the list. Once selected, you
            can invite members, upload documents, and update compliance settings
            from this page.
          </Paragraph>
          <Paragraph color="gray">
            Use the organization menu to switch between teams you manage. The
            members panel shows current collaborators and pending invitations.
          </Paragraph>
          <Paragraph color="gray">
            Document uploads respect storage limits—check the storage widget in
            settings for usage details.
          </Paragraph>
        </Stack>
      )
    }
    return (
      <Stack gap={16}>
        <OrganizationMembersPanel organizationId={organizationId} />
        <OrganizationDocumentsPanel organizationId={organizationId} />
        <OrganizationSettingsPanel organizationId={organizationId} />
      </Stack>
    )
  }, [organizationId])

  const leftContent = (
    <Stack gap={16}>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        type="line"
        color="primary"
        size="md"
      >
        <Tabs.Item value={TAB_DISCOVER}>
          <Tabs.Trigger>{t('routes.dashboard.discover.employers.title')}</Tabs.Trigger>
          <Tabs.Content>{null}</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value={TAB_MANAGE}>
          <Tabs.Trigger>{t('routes.dashboard.discover.employers.myEmployers')}</Tabs.Trigger>
          <Tabs.Content>{null}</Tabs.Content>
        </Tabs.Item>
      </Tabs>
      {activeTab === TAB_MANAGE ? manageLeftContent : discoverContent.left}
    </Stack>
  )
  const rightContent =
    activeTab === TAB_MANAGE ? manageRightContent : discoverContent.right

  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={leftContent}
      rightContent={rightContent}
    />
  )
}
