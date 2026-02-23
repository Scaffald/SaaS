/**
 * OAuth App List Component
 * Admin OAuth app list
 */

import { Button, Card, Text, Row, Stack } from '@scaffald/ui'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useAdminOAuthApps } from '@scf/core/utils/oauth-sdk-hooks'

type AppStatus = 'all' | 'pending' | 'active' | 'trusted' | 'suspended' | 'revoked'

export function OAuthAppList() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<AppStatus>('all')
  const [searchQuery] = useState('')

  const listApps = useAdminOAuthApps({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
  })

  return (
    <Stack flex={1} gap={16}>
      <Stack gap={8}>
        <Text size="2xl">OAuth Applications</Text>
        <Text size="sm" color="$gray11">
          Manage and approve OAuth applications
        </Text>
      </Stack>

      <Row gap={8}>
        {(['all', 'pending', 'active', 'trusted', 'suspended', 'revoked'] as AppStatus[]).map(
          (status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'filled' : 'outline'}
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
                <Text size="md" data-testid="oauth-app-name">
                  {app.display_name}
                </Text>
                <Text size="sm" color="$gray11" data-testid="oauth-app-description">
                  {app.description}
                </Text>
                <Text size="sm" color="$gray11" data-testid="oauth-app-metadata">
                  Status: {app.status} | Created: {new Date(app.created_at).toLocaleDateString()}
                </Text>
              </Stack>
              <Button
                size="sm"
                onPress={() => router.push(`/office/oauth-apps/${app.id}`)}
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
