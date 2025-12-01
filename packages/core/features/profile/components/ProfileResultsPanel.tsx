import { DashboardWidget } from '@unicornlove/ui'
import type { ComponentType, ReactNode } from 'react'
import { ScrollView, Spinner, Text, YStack, type YStackProps } from 'tamagui'

interface ProfileResultsPanelProps extends YStackProps {
  /** Child content for results */
  children?: ReactNode
  /** Title for the results section */
  title?: string
  /** Whether data is loading */
  isLoading?: boolean
  /** Whether results are empty */
  isEmpty?: boolean
  /** Empty state icon */
  emptyIcon?: ComponentType<{ size?: number; color?: string }>
  /** Empty state message */
  emptyMessage?: string
  /** Whether to show scrollbar */
  showScrollbar?: boolean
}

/**
 * ProfileResultsPanel Component
 * Consistent wrapper for right column results display in profile pages
 *
 * @example
 * ```tsx
 * <ProfileResultsPanel
 *   title="Your Skills"
 *   isLoading={isLoading}
 *   isEmpty={skills.length === 0}
 *   emptyIcon={Award}
 *   emptyMessage="No skills added yet"
 * >
 *   {skills.map(skill => <ProfileResultCard key={skill.id} {...skill} />)}
 * </ProfileResultsPanel>
 * ```
 */
export function ProfileResultsPanel({
  children,
  title,
  isLoading = false,
  isEmpty = false,
  emptyIcon: EmptyIcon,
  emptyMessage,
  showScrollbar = false,
  ...props
}: ProfileResultsPanelProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={showScrollbar}>
      <DashboardWidget>
        <YStack gap="$4" {...props}>
          {title && (
            <Text fontWeight="600" fontSize="$5">
              {title}
            </Text>
          )}

          {isLoading ? (
            <YStack items="center" justify="center" p="$8" gap="$3">
              <Spinner size="large" />
              <Text color="$color11">Loading...</Text>
            </YStack>
          ) : isEmpty ? (
            <YStack items="center" justify="center" p="$8" gap="$3">
              {EmptyIcon && <EmptyIcon size={48} color="$color11" />}
              <Text color="$color11" text="center">
                {emptyMessage || 'No items added yet'}
              </Text>
            </YStack>
          ) : (
            children
          )}
        </YStack>
      </DashboardWidget>
    </ScrollView>
  )
}
