import type { ComponentType, ReactNode } from 'react'
import { YStack, XStack } from '@tamagui/stacks'
import { Text } from 'tamagui'
import { Button } from '../buttons'
import type { ButtonProps } from '../buttons'

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
 *
 * Design Features:
 * - Centered layout with vertical stacking
 * - Optional circular icon container with subtle background
 * - Design token-based spacing and typography
 * - Support for primary and secondary action buttons
 * - Custom content support via children
 *
 * @example
 * ```tsx
 * // Basic empty state
 * <EmptyState
 *   title="No jobs found"
 *   description="Try adjusting your search filters"
 * />
 *
 * // With icon component and actions
 * <EmptyState
 *   icon={SearchIcon}
 *   title="No results"
 *   description="We couldn't find any matches"
 *   action={{
 *     label: "Clear Filters",
 *     onClick: handleClearFilters,
 *     variant: "primary"
 *   }}
 *   secondaryAction={{
 *     label: "Reset Search",
 *     onClick: handleReset,
 *     variant: "outlined"
 *   }}
 * />
 * ```
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
    <YStack style={{ alignItems: 'center' }} py="$12" px="$4">
      {Icon && (
        <XStack style={{ justifyContent: 'center' }} mb="$4">
          <XStack
            width={64}
            height={64}
            background="$gray3"
            style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 9999 }}
          >
            <Icon size={32} color="$gray9" />
          </XStack>
        </XStack>
      )}
      <Text fontSize="$4" fontWeight="600" color="$color11" mb="$2" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {description && (
        <Text color="$color10" mx="auto" mb="$6" style={{ textAlign: 'center', maxWidth: 448 }}>
          {description}
        </Text>
      )}
      {children}
      {(action || secondaryAction) && (
        <XStack
          gap="$3"
          mt="$6"
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          {action && (
            <Button
              onPress={action.onClick}
              variant={action.variant || 'primary'}
              size={action.size || '$4'}
              {...action}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onPress={secondaryAction.onClick}
              variant={secondaryAction.variant || 'outlined'}
              size={secondaryAction.size || '$4'}
              {...secondaryAction}
            >
              {secondaryAction.label}
            </Button>
          )}
        </XStack>
      )}
    </YStack>
  )
}
