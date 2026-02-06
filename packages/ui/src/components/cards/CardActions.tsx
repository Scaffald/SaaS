import { memo } from 'react'
import { XStack } from '@tamagui/stacks'
import { Button } from '../buttons/Button'
import type { CardActionsProps } from './types'

/**
 * CardActions - Standardized action buttons component
 *
 * Displays a row of action buttons at the bottom of cards
 *
 * @example
 * ```tsx
 * <CardActions
 *   actions={[
 *     { label: 'View Details', onPress: handleView, theme: 'blue' },
 *     { label: 'Apply', onPress: handleApply, theme: 'green' }
 *   ]}
 * />
 * ```
 */
export const CardActions = memo(({ actions }: CardActionsProps) => {
  if (actions.length === 0) {
    return null
  }

  return (
    <XStack gap="$2" style={{ paddingTop: 8 }}>
      {actions.map((action, index) => (
        <Button
          key={`${action.label}-${index}`}
          flex={1}
          size="$3"
          disabled={action.disabled}
          onPress={action.onPress}
          background={
            action.variant === 'outline'
              ? 'transparent'
              : action.variant === 'secondary'
                ? '$color3'
                : '$blue9'
          }
          color={action.variant === 'outline' ? '$color12' : '$color1'}
          borderWidth={action.variant === 'outline' ? 1 : 0}
          borderColor={action.variant === 'outline' ? '$borderColor' : undefined}
        >
          {action.label}
        </Button>
      ))}
    </XStack>
  )
})

CardActions.displayName = 'CardActions'
