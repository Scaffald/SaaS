/**
 * OAuth App List Component
 * Admin OAuth app list
 */

import { Button, Card, SizableText, Row, Stack } from '@scaffald/ui'
import { useState } from 'react'
import { api } from '@scf/core/utils/api'

type AppStatus = 'all' | 'pending' | 'active' | 'trusted' | 'suspended' | 'revoked'

export function OAuthAppList() {
  const [statusFilter, setStatusFilter] = useState<AppStatus>('all')
  const [searchQuery] = useState('')

  const listApps = api.oauth.admin.listApps.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
  })

  return (
    <Stack flex={1} gap={16}>
      <Stack gap={8}>
        <SizableText size={24}>OAuth Applications</SizableText>
        <SizableText size="sm" color="$gray11">
          Manage and approve OAuth applications
        </SizableText>
      </Stack>

      <Row gap={8}>
        {(['all', 'pending', 'active', 'trusted', 'suspended', 'revoked'] as AppStatus[]).map(
          (status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outlined'}
              onPress={() => setStatusFilter(status)}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          )
        )}
      </Row>

      <Stack gap={8}>
        {listApps.data?.apps.map((app) => (
          <Card key={app.id} padding="sm" data-testid={`oauth-app-${app.id}`}>
            <Row gap={12} align="center">
              <Stack flex={1} gap={4}>
                <SizableText size="md" data-testid="oauth-app-name">
                  {app.display_name}
                </SizableText>
                <SizableText size="sm" color="$gray11" data-testid="oauth-app-description">
                  {app.description}
                </SizableText>
                <SizableText size="sm" color="$gray11" data-testid="oauth-app-metadata">
                  Status: {app.status} | Created: {new Date(app.created_at).toLocaleDateString()}
                </SizableText>
              </Stack>
              <Button
                href={`/office/oauth-apps/${app.id}`}
                size="sm"
                data-testid="oauth-app-view-button"
              >
                View
              </Button>
            </Row>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}
