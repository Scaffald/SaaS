import { DashboardWidget } from '@unicornlove/beyond-ui'
import type { ComponentType, ReactNode } from 'react'
import { ScrollView, Spinner, Text, Stack, type YStackProps } from '@unicornlove/beyond-ui'

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
        <Stack gap="$4" {...props}>
          {title && (
            <Text fontWeight="600" fontSize="$5">
              {title}
            </Text>
          )}

          {isLoading ? (
            <Stack alignItems="center" justifyContent="center" padding="$8" gap="$3">
              <Spinner size="large" />
              <Text color="$color11">Loading...</Text>
            </Stack>
          ) : isEmpty ? (
            <Stack alignItems="center" justifyContent="center" padding="$8" gap="$3">
              {EmptyIcon && <EmptyIcon size={48} color="$color11" />}
              <Text color="$color11" textAlign="center">
                {emptyMessage || 'No items added yet'}
              </Text>
            </Stack>
          ) : (
            children
          )}
        </Stack>
      </DashboardWidget>
    </ScrollView>
  )
}
