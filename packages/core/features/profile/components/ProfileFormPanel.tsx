import { YStack, ScrollView, type YStackProps } from 'tamagui'
import { DashboardWidget } from '@app/ui'

interface ProfileFormPanelProps extends YStackProps {
  /** Child content for the form panel */
  children: React.ReactNode
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
 *   <YStack gap="$4">
 *     {/* Form inputs and controls *\/}
 *   </YStack>
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
        <YStack gap="$4" {...props}>
          {children}
        </YStack>
      </DashboardWidget>
    </ScrollView>
  )
}
