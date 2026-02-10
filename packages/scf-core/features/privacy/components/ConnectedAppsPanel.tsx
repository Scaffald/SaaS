/**
 * Connected Apps Panel Component
 * REQ-3: CCPA Compliance Implementation
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
    <Row
      backgroundColor={colors.bg}
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$2"
    >
      <Text fontSize="$1" color={colors.text} fontWeight="500">
        {permission}
      </Text>
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
      borderRadius="$3"
      backgroundColor="$color4"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize="$4" fontWeight="600" color="$color11">
        {initials}
      </Text>
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
      padding="$4"
      backgroundColor="$color2"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$3"
    >
      {/* App header */}
      <Row gap="$3" alignItems="flex-start">
        <AppIconPlaceholder name={app.app_name} />
        <Stack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600">
            {app.app_name}
          </Text>
          {app.description && (
            <Text fontSize="$3" color="$color11" numberOfLines={2}>
              {app.description}
            </Text>
          )}
        </Stack>
      </Row>

      {/* Connection info */}
      <Row gap="$4" flexWrap="wrap">
        <Stack gap="$1">
          <Text fontSize="$2" color="$color10">
            Connected
          </Text>
          <Text fontSize="$3">
            {formatDate(app.connected_at)}
          </Text>
        </Stack>
        {app.last_accessed_at && (
          <Stack gap="$1">
            <Text fontSize="$2" color="$color10">
              Last Access
            </Text>
            <Text fontSize="$3">
              {formatRelativeTime(app.last_accessed_at)}
            </Text>
          </Stack>
        )}
      </Row>

      {/* Permissions */}
      <Stack gap="$2">
        <Text fontSize="$2" color="$color10" fontWeight="500">
          Permissions
        </Text>
        <Row gap="$1" flexWrap="wrap">
          {app.permissions.slice(0, 5).map((permission) => (
            <PermissionBadge key={permission} permission={permission} />
          ))}
          {app.permissions.length > 5 && (
            <Row
              backgroundColor="$color4"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
            >
              <Text fontSize="$1" color="$color11">
                +{app.permissions.length - 5} more
              </Text>
            </Row>
          )}
        </Row>
      </Stack>

      {/* Data categories */}
      <Stack gap="$2">
        <Text fontSize="$2" color="$color10" fontWeight="500">
          Data Categories Accessed
        </Text>
        <Text fontSize="$3" color="$color11">
          {app.data_categories.join(' • ')}
        </Text>
      </Stack>

      {/* Actions */}
      <Row gap="$2" justifyContent="flex-end" marginTop="$1">
        <Button
          size="$3"
          variant="outlined"
          onPress={() => onViewDetails?.(app.id)}
        >
          View Details
        </Button>
        {app.can_revoke && (
          <Button
            size="$3"
            theme="red"
            onPress={() => onRevoke?.(app.id)}
          >
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
      padding="$6"
      backgroundColor="$color2"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      alignItems="center"
      gap="$2"
    >
      <Text fontSize="$4" color="$color11">
        No Connected Applications
      </Text>
      <Text fontSize="$3" color="$color10" textAlign="center">
        When you connect third-party applications to your account,
        they will appear here so you can manage their access to your data.
      </Text>
    </Stack>
  )
}

/**
 * Connected Apps Panel Component
 *
 * Displays all third-party applications with access to user data
 */
export function ConnectedAppsPanel({
  apps,
  onRevoke,
  onViewDetails,
}: ConnectedAppsPanelProps) {
  if (!apps || apps.length === 0) {
    return <EmptyState />
  }

  return (
    <Stack gap="$3">
      {/* Summary */}
      <Row
        padding="$3"
        backgroundColor="$orange2"
        borderRadius="$3"
        gap="$2"
        alignItems="center"
      >
        <Text fontSize="$3" color="$orange11">
          {apps.length} application{apps.length === 1 ? '' : 's'} currently have access to your data.
          You can revoke access at any time.
        </Text>
      </Row>

      {/* App cards */}
      {apps.map((app) => (
        <AppCard
          key={app.id}
          app={app}
          onRevoke={onRevoke}
          onViewDetails={onViewDetails}
        />
      ))}

      {/* Info text */}
      <Text fontSize="$2" color="$color10" marginTop="$2">
        Revoking access will immediately prevent the application from accessing your data.
        Some applications may require you to re-authorize access to restore functionality.
      </Text>
    </Stack>
  )
}

export default ConnectedAppsPanel
