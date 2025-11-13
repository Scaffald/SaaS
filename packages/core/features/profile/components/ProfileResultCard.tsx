import { Card, XStack, YStack, Button, Spinner, Text, type CardProps } from 'tamagui'
import { X } from '@tamagui/lucide-icons'

interface ProfileResultCardProps extends CardProps {
  /** Child content for the card */
  children: React.ReactNode
  /** Callback when remove button is clicked */
  onRemove?: () => void
  /** Whether remove action is disabled */
  removeDisabled?: boolean
  /** Whether skill is currently being removed (for animation state) */
  isRemoving?: boolean
  /** Whether remove action is in progress (shows loading spinner) */
  isLoading?: boolean
  /** Custom action buttons to display */
  actions?: React.ReactNode
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
 *   <YStack gap="$2">
 *     <Text fontWeight="600">{item.name}</Text>
 *     <Text color="$color11">{item.description}</Text>
 *   </YStack>
 * </ProfileResultCard>
 * ```
 */
export function ProfileResultCard({
  children,
  onRemove,
  removeDisabled = false,
  isRemoving = false,
  isLoading = false,
  actions,
  bordered = true,
  ...props
}: ProfileResultCardProps) {
  return (
    <Card bordered={bordered} size="$4" {...props}>
      <Card.Header gap="$2">
        <YStack gap="$3" flex={1}>
          {children}
        </YStack>

        {/* Action buttons */}
        {(onRemove || actions) && (
          <XStack gap="$2" justify="flex-end" pt="$2">
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
                  <XStack gap="$2" items="center">
                    <Spinner size="small" />
                    <Text>Removing...</Text>
                  </XStack>
                ) : (
                  'Remove'
                )}
              </Button>
            )}
          </XStack>
        )}
      </Card.Header>
    </Card>
  )
}
