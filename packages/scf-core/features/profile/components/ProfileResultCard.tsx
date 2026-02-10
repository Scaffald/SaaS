import { X } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import { Button, Card, type CardProps, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
 *   <Stack gap="$2">
 *     <Text fontWeight="600">{item.name}</Text>
 *     <Text color="$color11">{item.description}</Text>
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
      bordered={bordered}
      size="$4"
      backgroundColor={isNew ? '$green2' : undefined}
      borderColor={isNew ? '$green9' : undefined}
      borderWidth={isNew ? 2 : undefined}
      animation={isNew ? 'quick' : undefined}
      {...props}
    >
      <Card.Header gap="$2">
        <Stack gap="$3" flex={1}>
          {children}
        </Stack>

        {/* Action buttons */}
        {(onRemove || actions) && (
          <Row gap="$2" justifyContent="flex-end" paddingTop="$2">
            {actions}
            {onRemove && (
              <Button
                size="$2"
                variant="outlined"
                icon={isLoading ? undefined : X}
                onPress={onRemove}
                disabled={removeDisabled || isRemoving || isLoading}
              >
                {isLoading ? (
                  <Row gap="$2" alignItems="center">
                    <Spinner size="small" />
                    <Text>Removing...</Text>
                  </Row>
                ) : (
                  'Remove'
                )}
              </Button>
            )}
          </Row>
        )}
      </Card.Header>
    </Card>
  )
}
