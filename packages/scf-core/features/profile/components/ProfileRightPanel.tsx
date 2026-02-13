import { DashboardWidget } from '@unicornlove/beyond-ui'
import { H3, Text } from '@unicornlove/beyond-ui'

interface ProfileRightPanelProps {
  title: string
  description: string
  stats?: string
}

/**
 * Profile Right Panel Component
 * Simplified right column with title, description, and optional stats
 */
export function ProfileRightPanel({ title, description, stats }: ProfileRightPanelProps) {
  return (
    <DashboardWidget>
      <H3>{title}</H3>
      {stats && (
        <Text color="gray">
          {stats}
        </Text>
      )}
      <Text color="gray">
        {description}
      </Text>
    </DashboardWidget>
  )
}
