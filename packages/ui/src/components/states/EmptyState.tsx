import { Inbox } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import { Text, YStack } from 'tamagui'
import { spacing } from '../../config/spacing'
import { typography } from '../../config/typography'

/**
 * EmptyState component props
 */
export interface EmptyStateProps {
  /** Icon to display (defaults to Inbox icon) */
  icon?: ReactNode
  /** Primary message */
  title: string
  /** Optional descriptive text */
  description?: string
  /** Optional action button */
  action?: ReactNode
}

/**
 * EmptyState - Clean, centered empty state component
 *
 * Use when lists, search results, or data views have no content to display.
 * Provides clear messaging and optional actions to guide users.
 *
 * Design Features:
 * - Centered layout with vertical stacking
 * - Subtle grey icon and text for non-intrusive display
 * - Design token-based spacing and typography
 * - Optional action button (typically primary Button)
 *
 * @example
 * ```tsx
 * // Basic empty state
 * <EmptyState
 *   title="No jobs found"
 *   description="Try adjusting your search filters"
 * />
 *
 * // With custom icon and action
 * <EmptyState
 *   icon={<Search size={48} color="$color9" />}
 *   title="No results"
 *   description="We couldn't find any matches"
 *   action={
 *     <Button variant="primary" onPress={handleClearFilters}>
 *       Clear Filters
 *     </Button>
 *   }
 * />
 * ```
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <YStack
      flex={1}
      items="center"
      justify="center"
      gap={spacing.md}
      p={spacing['2xl']}
      style={{ minHeight: 300 }}
    >
      {/* Icon */}
      <YStack items="center" opacity={0.6}>
        {icon || <Inbox size={48} color="$color9" />}
      </YStack>

      {/* Title */}
      <Text
        fontSize={typography.xl}
        fontWeight={typography.fontWeightSemibold}
        color="$color11"
        style={{ textAlign: 'center' }}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          fontSize={typography.base}
          color="$color10"
          style={{ textAlign: 'center', maxWidth: 400 }}
          lineHeight={typography.lineHeightRelaxed}
        >
          {description}
        </Text>
      )}

      {/* Action */}
      {action && <YStack mt={spacing.md}>{action}</YStack>}
    </YStack>
  )
}
