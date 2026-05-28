import { Button, DashboardWidget } from '@scaffald/ui'
import type { ComponentType, ReactNode } from 'react'
import { ScrollView, Spinner, Text, Stack, type StackProps, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface ProfileResultsPanelProps extends StackProps {
  /** Child content for results */
  children?: ReactNode
  /** Title for the results section */
  title?: string
  /** Whether data is loading */
  isLoading?: boolean
  /** Whether the fetch failed (shown before empty/children) */
  isError?: boolean
  /** Error state message */
  errorMessage?: string
  /** Retry handler; shows a Retry button when provided */
  onRetry?: () => void
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
  isError = false,
  errorMessage,
  onRetry,
  isEmpty = false,
  emptyIcon: EmptyIcon,
  emptyMessage,
  showScrollbar = false,
  ...props
}: ProfileResultsPanelProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <ScrollView showsVerticalScrollIndicator={showScrollbar}>
      <DashboardWidget>
        <Stack gap={16} {...props}>
          {title && <Text>{title}</Text>}

          {isLoading ? (
            <Stack align="center" justify="center" padding={32} gap={12}>
              <Spinner variant="ios" size="lg" />
              <Text style={{ color: '#414e62' }}>Loading...</Text>
            </Stack>
          ) : isError ? (
            <Stack align="center" justify="center" padding={32} gap={12}>
              <Text style={{ color: '#ef4444', textAlign: 'center' }}>
                {errorMessage || "Couldn't load this section. Please try again."}
              </Text>
              {onRetry && (
                <Button size="sm" variant="outline" onPress={onRetry}>
                  Retry
                </Button>
              )}
            </Stack>
          ) : isEmpty ? (
            <Stack align="center" justify="center" padding={32} gap={12}>
              {EmptyIcon && <EmptyIcon size={48} color={colors.text[t].secondary} />}
              <Text style={{ color: '#414e62', textAlign: 'center' }}>
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
