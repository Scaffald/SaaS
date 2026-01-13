/**
 * OAuth App List Component
 * REQ-10 Task 11: Admin OAuth app list
 */

import { Button, Card, SizableText, XStack, YStack } from '@unicornlove/ui'
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
    <YStack flex={1} gap="$4">
      <YStack gap="$2">
        <SizableText size="$6" fontWeight="600">
          OAuth Applications
        </SizableText>
        <SizableText size="$2" color="$color11">
          Manage and approve OAuth applications
        </SizableText>
      </YStack>

      <XStack gap="$2">
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
      </XStack>

      <YStack gap="$2">
        {listApps.data?.apps.map((app) => (
          <Card key={app.id} padding="$3" data-testid={`oauth-app-${app.id}`}>
            <XStack gap="$3" alignItems="center">
              <YStack flex={1} gap="$1">
                <SizableText size="$4" fontWeight="600" data-testid="oauth-app-name">
                  {app.display_name}
                </SizableText>
                <SizableText size="$2" color="$color11" data-testid="oauth-app-description">
                  {app.description}
                </SizableText>
                <SizableText size="$1" color="$color11" data-testid="oauth-app-metadata">
                  Status: {app.status} | Created: {new Date(app.created_at).toLocaleDateString()}
                </SizableText>
              </YStack>
              <Button href={`/office/oauth-apps/${app.id}`} size="$2" data-testid="oauth-app-view-button">
                View
              </Button>
            </XStack>
          </Card>
        ))}
      </YStack>
    </YStack>
  )
}

