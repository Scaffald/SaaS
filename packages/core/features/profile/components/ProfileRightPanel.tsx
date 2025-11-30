import { DashboardWidget } from '@scaffald/neue-ui'
import { H3, Text } from 'tamagui'

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
        <Text color="$color11" fontSize="$3">
          {stats}
        </Text>
      )}
      <Text color="$color11" fontSize="$3">
        {description}
      </Text>
    </DashboardWidget>
  )
}
