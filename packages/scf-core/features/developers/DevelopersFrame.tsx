import { useCallback, type ReactNode } from 'react'
import { useRouter } from 'expo-router'
import { Spinner, Stack, Tabs } from '@scaffald/ui'
import { ROUTES, RouteBuilder } from '@scf/core/constants/routes'
import { useScreenRhythm } from '@scf/core/constants/layout'
import { LoadFailure } from '@scf/core/components/ui'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { PhoneChipStrip } from '@scf/core/features/drawer/SectionTabs'
import { useOrgDevelopers } from './useOrgDevelopers'

export type DevelopersView = 'api-keys' | 'webhooks'

const VIEWS: { key: DevelopersView; label: string }[] = [
  { key: 'api-keys', label: 'API keys' },
  { key: 'webhooks', label: 'Webhooks' },
]

export type DevelopersContext = {
  org: { organizationId: string; organizationName: string; slug: string }
  canManage: boolean
}

/**
 * The frame of every screen under an organization's Developers tab (#1440):
 * resolves the organization from the slug, answers "not found" to anyone
 * outside it, and draws the API keys / Webhooks partition. The org's own tab
 * strip (Overview, Teams, Logs, Developers) stays above; these are the
 * Developers tab's two views, the way Settings partitions its sections.
 */
export function DevelopersFrame({
  slug,
  view,
  children,
}: {
  slug: string | undefined
  view: DevelopersView
  children: (context: DevelopersContext) => ReactNode
}) {
  const router = useRouter()
  const { isDesktop } = useScreenRhythm()
  const { org, isLoading, isForbidden, canManage } = useOrgDevelopers(slug)

  // Replace rather than push: switching views is not a step Back should retrace.
  const select = useCallback(
    (key: string) => {
      if (!org || key === view) return
      router.replace(
        key === 'webhooks' ? RouteBuilder.orgWebhooks(org.slug) : RouteBuilder.orgApiKeys(org.slug)
      )
    },
    [router, org, view]
  )

  if (isForbidden) {
    return (
      <DashboardPage
        showBreadcrumb={false}
        hideScreenHeader
        leftContent={
          <LoadFailure
            error={{ statusCode: 404 }}
            noun="organization"
            back={{ label: 'My organizations', href: ROUTES.EMPLOYERS.ORGANIZATIONS.path }}
          />
        }
        rightContent={null}
      />
    )
  }

  const tabs = isDesktop ? (
    <Tabs type="folder" value={view} onValueChange={select}>
      {VIEWS.map((item) => (
        <Tabs.Item key={item.key} value={item.key}>
          <Tabs.Trigger>{item.label}</Tabs.Trigger>
        </Tabs.Item>
      ))}
    </Tabs>
  ) : (
    <PhoneChipStrip
      tabs={VIEWS}
      activeKey={view}
      gutter={0}
      onSelect={select}
      testID="developers-views"
    />
  )

  return (
    <DashboardPage
      showBreadcrumb={false}
      // Each view draws its own header, with its own actions.
      hideScreenHeader
      fullWidth
      pageTitle={org ? `Developers · ${org.organizationName}` : 'Developers'}
      headerContent={tabs}
      leftContent={
        org && !isLoading ? (
          children({ org, canManage })
        ) : (
          <Stack padding="xl" align="center" justify="center">
            <Spinner size="lg" />
          </Stack>
        )
      }
      rightContent={null}
    />
  )
}
