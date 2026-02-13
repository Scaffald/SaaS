import { DashboardWidget, Text } from '@unicornlove/beyond-ui'
import { ArrowRightCircle, Eye, Pencil, RefreshCw, Save, Trash2, X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Button, Stack } from '@unicornlove/beyond-ui'

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
 *   onCreate={() => router.push(ROUTES.OFFICE.CMS.JOBS.CREATE.path)}
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
    <Stack gap={8}>
      {onCreate && (
        <Button theme="info" iconStart={ArrowRightCircle} onPress={onCreate}>
          Create {resourceName}
        </Button>
      )}
      {onRefresh && (
        <Button variant="outline" iconStart={RefreshCw} onPress={onRefresh} disabled={isLoading}>
          Refresh
        </Button>
      )}
      {additionalActions}
    </Stack>
  )

  const renderCreateActions = () => (
    <Stack gap={8}>
      {onSave && (
        <Button theme="info" iconStart={Save} onPress={onSave} disabled={isLoading}>
          Save
        </Button>
      )}
      {onCancel && (
        <Button variant="outline" iconStart={X} onPress={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      )}
      {additionalActions}
    </Stack>
  )

  const renderEditActions = () => (
    <Stack gap={8}>
      {onSave && (
        <Button theme="info" iconStart={Save} onPress={onSave} disabled={isLoading}>
          Save Changes
        </Button>
      )}
      {onCancel && (
        <Button variant="outline" iconStart={X} onPress={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      )}
      {onDelete && (
        <Button theme="error" iconStart={Trash2} onPress={onDelete} disabled={isLoading}>
          Delete {resourceName}
        </Button>
      )}
      {additionalActions}
    </Stack>
  )

  const renderDetailActions = () => (
    <Stack gap={8}>
      {onEdit && (
        <Button theme="info" iconStart={Pencil} onPress={onEdit}>
          Edit
        </Button>
      )}
      {onView && (
        <Button variant="outline" iconStart={Eye} onPress={onView}>
          View
        </Button>
      )}
      {onDelete && (
        <Button theme="error" iconStart={Trash2} onPress={onDelete} disabled={isLoading}>
          Delete {resourceName}
        </Button>
      )}
      {additionalActions}
    </Stack>
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
    <DashboardWidget gap={12} elevated>
      <Text>Quick Actions</Text>
      {renderActions()}
    </DashboardWidget>
  )
}
