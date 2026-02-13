import { DashboardWidget } from '@scaffald/ui'
import type { ReactNode } from 'react'
import { ScrollView, Stack, type YStackProps } from '@scaffald/ui'

interface ProfileFormPanelProps extends YStackProps {
  /** Child content for the form panel */
  children: ReactNode
  /** Whether to show scrollbar */
  showScrollbar?: boolean
}

/**
 * ProfileFormPanel Component
 * Consistent wrapper for left column input/form areas in profile pages
 *
 * @example
 * ```tsx
 * <ProfileFormPanel>
 *   <H4>Skills & Expertise</H4>
 *   <Stack gap={16}>
 *     {/* Form inputs and controls *\/}
 *   </Stack>
 * </ProfileFormPanel>
 * ```
 */
export function ProfileFormPanel({
  children,
  showScrollbar = false,
  ...props
}: ProfileFormPanelProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={showScrollbar}>
      <DashboardWidget>
        <Stack gap={16} {...props}>
          {children}
        </Stack>
      </DashboardWidget>
    </ScrollView>
  )
}
