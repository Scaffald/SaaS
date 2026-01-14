import type { ComponentType, ReactNode } from 'react'
import { Stack, Row, Text, Button, colors, spacing } from '@unicornlove/beyond-ui'
import type { ButtonProps } from '@unicornlove/beyond-ui'

/**
 * EmptyState component props
 */
export interface EmptyStateProps {
  /** Icon component to display (receives size and color props) */
  icon?: ComponentType<{ size?: number; color?: string }>
  /** Primary message */
  title: string
  /** Optional descriptive text */
  description?: string
  /** Primary action button configuration */
  action?: {
    label: string
    onClick: () => void
  } & Partial<ButtonProps>
  /** Secondary action button configuration */
  secondaryAction?: {
    label: string
    onClick: () => void
  } & Partial<ButtonProps>
  /** Optional custom content to display below description */
  children?: ReactNode
}

/**
 * EmptyState - Clean, centered empty state component with optional actions
 *
 * Use when lists, search results, or data views have no content to display.
 * Provides clear messaging and optional primary/secondary actions to guide users.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
}: EmptyStateProps) {
  return (
    <Stack
      style={{
        alignItems: 'center',
        paddingVertical: spacing[48],
        paddingHorizontal: spacing[16],
      }}
    >
      {Icon && (
        <Row justifyContent="center" style={{ marginBottom: spacing[16] }}>
          <Row
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.gray[150],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={32} color={colors.gray[400]} />
          </Row>
        </Row>
      )}
      <Text
        size="lg"
        weight="semibold"
        color={colors.text.light.primary}
        style={{ marginBottom: spacing[8], textAlign: 'center' }}
      >
        {title}
      </Text>
      {description && (
        <Text
          color={colors.text.light.secondary}
          style={{
            marginHorizontal: 'auto',
            marginBottom: spacing[24],
            textAlign: 'center',
            maxWidth: 448,
          }}
        >
          {description}
        </Text>
      )}
      {children}
      {(action || secondaryAction) && (
        <Row
          alignItems="center"
          justifyContent="center"
          gap={spacing[12]}
          style={{ marginTop: spacing[24] }}
        >
          {action && (
            <Button
              onPress={action.onClick}
              variant={action.variant || 'filled'}
              size={action.size || 'md'}
              color={action.color || 'primary'}
              {...action}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onPress={secondaryAction.onClick}
              variant={secondaryAction.variant || 'outline'}
              size={secondaryAction.size || 'md'}
              color={secondaryAction.color || 'gray'}
              {...secondaryAction}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Row>
      )}
    </Stack>
  )
}
