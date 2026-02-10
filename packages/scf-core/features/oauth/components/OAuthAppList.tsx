/**
 * OAuth App List Component
 * Admin OAuth app list
 */

import { Button, Card, SizableText, Row, Stack } from '@unicornlove/beyond-ui'
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
    <Stack flex={1} gap="$4">
      <Stack gap="$2">
        <SizableText size="$6" fontWeight="600">
          OAuth Applications
        </SizableText>
        <SizableText size="$2" color="$color11">
          Manage and approve OAuth applications
        </SizableText>
      </Stack>

      <Row gap="$2">
        {(['all', 'pending', 'active', 'trusted', 'suspended', 'revoked'] as AppStatus[]).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outlined'}
            onPress={() => setStatusFilter(status)}
            size="$2"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </Row>

      <Stack gap="$2">
        {listApps.data?.apps.map((app) => (
          <Card key={app.id} padding="$3" data-testid={`oauth-app-${app.id}`}>
            <Row gap="$3" alignItems="center">
              <Stack flex={1} gap="$1">
                <SizableText size="$4" fontWeight="600" data-testid="oauth-app-name">
                  {app.display_name}
                </SizableText>
                <SizableText size="$2" color="$color11" data-testid="oauth-app-description">
                  {app.description}
                </SizableText>
                <SizableText size="$1" color="$color11" data-testid="oauth-app-metadata">
                  Status: {app.status} | Created: {new Date(app.created_at).toLocaleDateString()}
                </SizableText>
              </Stack>
              <Button href={`/office/oauth-apps/${app.id}`} size="$2" data-testid="oauth-app-view-button">
                View
              </Button>
            </Row>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}

