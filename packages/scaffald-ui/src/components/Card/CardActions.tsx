/**
 * CardActions component
 * Action buttons for cards
 */

import type React from 'react'
import { Row } from '../Layout'
import { Button } from '../Button'
import type { ButtonProps } from '../Button/Button.types'

export interface CardAction extends Omit<ButtonProps, 'children'> {
  key: string
  label: string
}

export interface CardActionsProps {
  /** Array of actions */
  actions: CardAction[]
  /** Gap between actions */
  gap?: number
  /** Justify content */
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between'
}

/**
 * CardActions - Action buttons for cards
 *
 * @example
 * ```tsx
 * <CardActions
 *   actions={[
 *     { key: 'view', label: 'View Details', variant: 'filled', color: 'primary', onPress: handleView },
 *     { key: 'apply', label: 'Apply', variant: 'outline', color: 'gray', onPress: handleApply }
 *   ]}
 *   justify="flex-end"
 * />
 * ```
 */
export function CardActions({
  actions,
  gap = 8,
  justify = 'flex-end',
}: CardActionsProps): React.ReactElement {
  return (
    <Row gap={gap} justify={justify} wrap>
      {actions.map(({ key, label, ...buttonProps }) => (
        <Button key={key} {...buttonProps}>
          {label}
        </Button>
      ))}
    </Row>
  )
}
