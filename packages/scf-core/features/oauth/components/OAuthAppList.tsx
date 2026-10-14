/**
 * OAuth App List Component
 * Admin OAuth app list
 *
 * Reskinned for #1098. It was a bare page: a sans title, six filled/outline
 * buttons as a status filter (the selected one black), and one card per app
 * whose metadata read "Status: active | Created: …" as a pipe string. Now it
 * has the office page grammar: ScreenHeader, the status partition as
 * ListToolbar folder tabs (the checks dashboard's pattern, #984), and ruled
 * rows with a status badge and one meta line.
 */

import {
  Button,
  ListToolbar,
  Row,
  ScreenHeader,
  Spinner,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useAdminOAuthApps } from '@scf/core/utils/oauth-sdk-hooks'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { StatusBadge } from '@scf/core/components/ui/StatusBadge'

type AppStatus = 'all' | 'pending' | 'active' | 'trusted' | 'suspended' | 'revoked'

const STATUSES: AppStatus[] = ['all', 'pending', 'active', 'trusted', 'suspended', 'revoked']

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  active: 'success',
  trusted: 'success',
  suspended: 'error',
  revoked: 'error',
}

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

export function OAuthAppList() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<AppStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const listApps = useAdminOAuthApps({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
  })
  const apps = listApps.data?.apps ?? []

  return (
    <Stack gap={16}>
      <ScreenHeader
        kicker="Developers"
        title="OAuth applications"
        tip="Review and approve the third-party apps that ask to act for your users."
      />

      <ListToolbar
        tabs={STATUSES.map((status) => ({ key: status, label: capitalise(status) }))}
        activeTab={statusFilter}
        onTabChange={(key) => setStatusFilter(key as AppStatus)}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search apps by name…"
        resultCount={listApps.isLoading ? undefined : apps.length}
        resultNoun="app"
      />

      {listApps.isLoading ? (
        <Row gap={8} align="center" paddingVertical={24}>
          <Spinner size="sm" />
          <Text style={{ color: colors.text[t].secondary }}>Loading applications…</Text>
        </Row>
      ) : listApps.isError ? (
        <Stack gap={12} align="flex-start" paddingVertical={24}>
          <Text style={{ color: colors.text[t].secondary }}>
            We couldn't load OAuth applications.
          </Text>
          <Button size="sm" variant="outline" onPress={() => listApps.refetch()}>
            Retry
          </Button>
        </Stack>
      ) : apps.length === 0 ? (
        <Text style={{ color: colors.text[t].secondary, paddingVertical: 24 }}>
          {statusFilter === 'all'
            ? 'No OAuth applications have been registered yet.'
            : `No ${statusFilter} applications.`}
        </Text>
      ) : (
        <Stack style={{ borderTopWidth: 1, borderTopColor: colors.border[t].default }}>
          {apps.map((app) => (
            <Row
              key={app.id}
              gap={16}
              align="center"
              paddingVertical={16}
              data-testid={`oauth-app-${app.id}`}
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
            >
              <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                <Row gap={8} align="center" wrap>
                  <Text
                    data-testid="oauth-app-name"
                    style={{ color: colors.text[t].primary, fontWeight: '600' }}
                  >
                    {app.display_name}
                  </Text>
                  <StatusBadge variant={STATUS_VARIANT[app.status] ?? 'default'}>
                    {capitalise(app.status)}
                  </StatusBadge>
                </Row>
                {app.description ? (
                  <Text
                    numberOfLines={2}
                    data-testid="oauth-app-description"
                    style={{ color: colors.text[t].secondary }}
                  >
                    {app.description}
                  </Text>
                ) : null}
                <Text data-testid="oauth-app-metadata" style={{ color: colors.text[t].tertiary }}>
                  Registered {new Date(app.created_at).toLocaleDateString()}
                </Text>
              </Stack>
              <Button
                size="sm"
                variant="outline"
                onPress={() =>
                  router.push(buildPath(ROUTES.OFFICE.OAUTH_APPS.DETAIL, { id: app.id }) as never)
                }
                data-testid="oauth-app-view-button"
              >
                View
              </Button>
            </Row>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
