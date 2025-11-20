import { DashboardWidget, Text } from '@app/ui'
import { ArrowRightCircle, Eye, Pencil, RefreshCw, Save, Trash2, X } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import { Button, YStack } from 'tamagui'

export interface QuickActionsWidgetProps {
  /** Context of the page (determines which actions to show) */
  context: 'list' | 'create' | 'edit' | 'detail'
  /** Name of the resource (e.g., "Job", "Organization") */
  resourceName: string
  /** Create action (for list pages) */
  onCreate?: () => void
  /** Refresh action (for list pages) */
  onRefresh?: () => void
  /** Save action (for create/edit pages) */
  onSave?: () => void
  /** Cancel action (for create/edit pages) */
  onCancel?: () => void
  /** Delete action (for edit/detail pages) */
  onDelete?: () => void
  /** Edit action (for detail pages) */
  onEdit?: () => void
  /** View action (for detail pages) */
  onView?: () => void
  /** Loading state */
  isLoading?: boolean
  /** Additional custom actions to display */
  additionalActions?: ReactNode
}

/**
 * QuickActionsWidget - Context-aware quick actions widget for Office pages
 *
 * Provides consistent quick actions in the right sidebar based on page context.
 *
 * @example
 * ```tsx
 * <QuickActionsWidget
 *   context="list"
 *   resourceName="Job"
 *   onCreate={() => router.push('/office/jobs/create')}
 *   onRefresh={() => refetch()}
 *   isLoading={isLoading}
 * />
 * ```
 */
export function QuickActionsWidget({
  context,
  resourceName,
  onCreate,
  onRefresh,
  onSave,
  onCancel,
  onDelete,
  onEdit,
  onView,
  isLoading = false,
  additionalActions,
}: QuickActionsWidgetProps) {
  const renderListActions = () => (
    <YStack gap="$2">
      {onCreate && (
        <Button theme="info" icon={ArrowRightCircle} onPress={onCreate}>
          Create {resourceName}
        </Button>
      )}
      {onRefresh && (
        <Button variant="outlined" icon={RefreshCw} onPress={onRefresh} disabled={isLoading}>
          Refresh
        </Button>
      )}
      {additionalActions}
    </YStack>
  )

  const renderCreateActions = () => (
    <YStack gap="$2">
      {onSave && (
        <Button theme="info" icon={Save} onPress={onSave} disabled={isLoading}>
          Save
        </Button>
      )}
      {onCancel && (
        <Button variant="outlined" icon={X} onPress={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      )}
      {additionalActions}
    </YStack>
  )

  const renderEditActions = () => (
    <YStack gap="$2">
      {onSave && (
        <Button theme="info" icon={Save} onPress={onSave} disabled={isLoading}>
          Save Changes
        </Button>
      )}
      {onCancel && (
        <Button variant="outlined" icon={X} onPress={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      )}
      {onDelete && (
        <Button theme="error" icon={Trash2} onPress={onDelete} disabled={isLoading}>
          Delete {resourceName}
        </Button>
      )}
      {additionalActions}
    </YStack>
  )

  const renderDetailActions = () => (
    <YStack gap="$2">
      {onEdit && (
        <Button theme="info" icon={Pencil} onPress={onEdit}>
          Edit
        </Button>
      )}
      {onView && (
        <Button variant="outlined" icon={Eye} onPress={onView}>
          View
        </Button>
      )}
      {onDelete && (
        <Button theme="error" icon={Trash2} onPress={onDelete} disabled={isLoading}>
          Delete {resourceName}
        </Button>
      )}
      {additionalActions}
    </YStack>
  )

  const renderActions = () => {
    switch (context) {
      case 'list':
        return renderListActions()
      case 'create':
        return renderCreateActions()
      case 'edit':
        return renderEditActions()
      case 'detail':
        return renderDetailActions()
      default:
        return null
    }
  }

  return (
    <DashboardWidget gap="$3" elevated>
      <Text fontSize="$5" fontWeight="700">
        Quick Actions
      </Text>
      {renderActions()}
    </DashboardWidget>
  )
}
