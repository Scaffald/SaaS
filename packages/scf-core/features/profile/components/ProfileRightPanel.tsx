import { DashboardWidget, useThemeContext } from '@scaffald/ui'
import { H3, Text } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <DashboardWidget>
      <H3>{title}</H3>
      {stats && <Text style={{ color: colors.text[t].secondary }}>{stats}</Text>}
      <Text style={{ color: colors.text[t].secondary }}>{description}</Text>
    </DashboardWidget>
  )
}
