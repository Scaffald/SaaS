/**
 * Connected Apps Panel Component
 * CCPA Compliance Implementation
 *
 * Displays third-party applications that have access to user data
 * with options to view permissions and revoke access
 */

import { Text, Row, Stack, Button } from '@unicornlove/beyond-ui'

/**
 * Connected app structure
 */
export interface ConnectedApp {
  id: string
  app_id: string
  app_name: string
  app_icon_url?: string
  description?: string
  connected_at: string
  last_accessed_at?: string
  permissions: string[]
  data_categories: string[]
  can_revoke: boolean
}

/**
 * Props for ConnectedAppsPanel
 */
interface ConnectedAppsPanelProps {
  apps: ConnectedApp[]
  onRevoke?: (appId: string) => void
  onViewDetails?: (appId: string) => void
}

/**
 * Permission badge colors based on sensitivity
 */
const PERMISSION_COLORS: Record<string, { bg: string; text: string }> = {
  read: { bg: '$blue3', text: '$blue11' },
  write: { bg: '$orange3', text: '$orange11' },
  delete: { bg: '$red3', text: '$red11' },
  default: { bg: '$color4', text: '$color11' },
}

/**
 * Get color for permission type
 */
function getPermissionColor(permission: string): { bg: string; text: string } {
  const lowerPerm = permission.toLowerCase()
  if (lowerPerm.includes('delete') || lowerPerm.includes('remove')) {
    return PERMISSION_COLORS.delete
  }
  if (lowerPerm.includes('write') || lowerPerm.includes('create') || lowerPerm.includes('update')) {
    return PERMISSION_COLORS.write
  }
  if (lowerPerm.includes('read') || lowerPerm.includes('view')) {
    return PERMISSION_COLORS.read
  }
  return PERMISSION_COLORS.default
}

/**
 * Format date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

/**
 * Permission badge
 */
function PermissionBadge({ permission }: { permission: string }) {
  const colors = getPermissionColor(permission)
  return (
    <Row backgroundColor={colors.bg} paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
      <Text color={colors.text}>{permission}</Text>
    </Row>
  )
}

/**
 * App icon placeholder
 */
function AppIconPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Stack
      width={48}
      height={48}
      borderRadius={12}
      backgroundColor="$color4"
      align="center"
      justify="center"
    >
      <Text color="$gray11">{initials}</Text>
    </Stack>
  )
}

/**
 * Single connected app card
 */
function AppCard({
  app,
  onRevoke,
  onViewDetails,
}: {
  app: ConnectedApp
  onRevoke?: (appId: string) => void
  onViewDetails?: (appId: string) => void
}) {
  return (
    <Stack
      padding="md"
      backgroundColor="$color2"
      borderRadius={12}
      borderWidth={1}
      borderColor="$borderColor"
      gap={12}
    >
      {/* App header */}
      <Row gap={12} align="flex-start">
        <AppIconPlaceholder name={app.app_name} />
        <Stack flex={1} gap={4}>
          <Text>{app.app_name}</Text>
          {app.description && (
            <Text color="$gray11" >
              {app.description}
            </Text>
          )}
        </Stack>
      </Row>

      {/* Connection info */}
      <Row gap={16} flexWrap="wrap">
        <Stack gap={4}>
          <Text color="$gray11">Connected</Text>
          <Text>{formatDate(app.connected_at)}</Text>
        </Stack>
        {app.last_accessed_at && (
          <Stack gap={4}>
            <Text color="$gray11">Last Access</Text>
            <Text>{formatRelativeTime(app.last_accessed_at)}</Text>
          </Stack>
        )}
      </Row>

      {/* Permissions */}
      <Stack gap={8}>
        <Text color="$gray11">Permissions</Text>
        <Row gap={4} flexWrap="wrap">
          {app.permissions.slice(0, 5).map((permission) => (
            <PermissionBadge key={permission} permission={permission} />
          ))}
          {app.permissions.length > 5 && (
            <Row
              backgroundColor="$color4"
              paddingHorizontal={8}
              paddingVertical={4}
              borderRadius={8}
            >
              <Text color="$gray11">+{app.permissions.length - 5} more</Text>
            </Row>
          )}
        </Row>
      </Stack>

      {/* Data categories */}
      <Stack gap={8}>
        <Text color="$gray11">Data Categories Accessed</Text>
        <Text color="$gray11">{app.data_categories.join(' • ')}</Text>
      </Stack>

      {/* Actions */}
      <Row gap={8} justify="flex-end" marginTop={4}>
        <Button size="sm" variant="outline" onPress={() => onViewDetails?.(app.id)}>
          View Details
        </Button>
        {app.can_revoke && (
          <Button size="sm" color="error" onPress={() => onRevoke?.(app.id)}>
            Revoke Access
          </Button>
        )}
      </Row>
    </Stack>
  )
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <Stack
      padding="xl"
      backgroundColor="$color2"
      borderRadius={12}
      borderWidth={1}
      borderColor="$borderColor"
      align="center"
      gap={8}
    >
      <Text color="$gray11">No Connected Applications</Text>
      <Text color="$gray11" textAlign="center">
        When you connect third-party applications to your account, they will appear here so you can
        manage their access to your data.
      </Text>
    </Stack>
  )
}

/**
 * Connected Apps Panel Component
 *
 * Displays all third-party applications with access to user data
 */
export function ConnectedAppsPanel({ apps, onRevoke, onViewDetails }: ConnectedAppsPanelProps) {
  if (!apps || apps.length === 0) {
    return <EmptyState />
  }

  return (
    <Stack gap={12}>
      {/* Summary */}
      <Row padding="sm" backgroundColor="$orange2" borderRadius={12} gap={8} align="center">
        <Text color="$orange11">
          {apps.length} application{apps.length === 1 ? '' : 's'} currently have access to your
          data. You can revoke access at any time.
        </Text>
      </Row>

      {/* App cards */}
      {apps.map((app) => (
        <AppCard key={app.id} app={app} onRevoke={onRevoke} onViewDetails={onViewDetails} />
      ))}

      {/* Info text */}
      <Text color="$gray11" marginTop={8}>
        Revoking access will immediately prevent the application from accessing your data. Some
        applications may require you to re-authorize access to restore functionality.
      </Text>
    </Stack>
  )
}

export default ConnectedAppsPanel
