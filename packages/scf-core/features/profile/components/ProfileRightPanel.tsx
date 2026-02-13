import { DashboardWidget } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { H3, Text } , useThemeContext } from '@unicornlove/beyond-ui'

interface ProfileRightPanelProps {
  title: string
  description: string
  stats?: string
}

/**
 * Profile Right Panel Component
 * Simplified right column with title, description, and optional stats
 */
export function ProfileRightPanel() {
  const { theme } = useThemeContext()
{ title, description, stats }: ProfileRightPanelProps) {
  return (
    <DashboardWidget>
      <H3>{title}</H3>
      {stats && <Text style={{ color: colors.text[theme].secondary }}>{stats}</Text>}
      <Text style={{ color: colors.text[theme].secondary }}>{description}</Text>
    </DashboardWidget>
  )
}
