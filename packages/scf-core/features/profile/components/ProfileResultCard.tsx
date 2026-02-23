import { X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Button, Card, CardHeader, type CardProps, Spinner, Text, Row, Stack } from '@scaffald/ui'

interface ProfileResultCardProps extends CardProps {
  /** Child content for the card */
  children: ReactNode
  /** Callback when remove button is clicked */
  onRemove?: () => void
  /** Whether remove action is disabled */
  removeDisabled?: boolean
  /** Whether skill is currently being removed (for animation state) */
  isRemoving?: boolean
  /** Whether remove action is in progress (shows loading spinner) */
  isLoading?: boolean
  /** Whether this is a newly added skill (for highlight animation) */
  isNew?: boolean
  /** Custom action buttons to display */
  actions?: ReactNode
  /** Whether to show the card border */
  bordered?: boolean
}

/**
 * ProfileResultCard Component
 * Consistent card display for individual items in profile results
 *
 * @example
 * ```tsx
 * <ProfileResultCard
 *   onRemove={() => handleRemove(item.id)}
 *   removeDisabled={isRemoving}
 * >
 *   <Stack gap={8}>
 *     <Text>{item.name}</Text>
 *     <Text color="$gray11">{item.description}</Text>
 *   </Stack>
 * </ProfileResultCard>
 * ```
 */
export function ProfileResultCard({
  children,
  onRemove,
  removeDisabled = false,
  isRemoving = false,
  isLoading = false,
  isNew = false,
  actions,
  bordered = true,
  ...props
}: ProfileResultCardProps) {
  return (
    <Card
      variant={bordered ? 'outlined' : undefined}
      style={isNew ? { backgroundColor: '#f0fdf4', borderColor: '#4ade80', borderWidth: 2 } : undefined}
      {...props}
    >
      <CardHeader>
        <Stack gap={12} flex={1}>
          {children}
        </Stack>

        {/* Action buttons */}
        {(onRemove || actions) && (
          <Row gap={8} justify="flex-end" paddingTop={8}>
            {actions}
            {onRemove && (
              <Button
                size="sm"
                variant="outline"
                iconStart={isLoading ? undefined : X}
                onPress={onRemove}
                disabled={removeDisabled || isRemoving || isLoading}
              >
                {isLoading ? (
                  <Row gap={8} align="center">
                    <Spinner size="sm" />
                    <Text>Removing...</Text>
                  </Row>
                ) : (
                  'Remove'
                )}
              </Button>
            )}
          </Row>
        )}
      </CardHeader>
    </Card>
  )
}
