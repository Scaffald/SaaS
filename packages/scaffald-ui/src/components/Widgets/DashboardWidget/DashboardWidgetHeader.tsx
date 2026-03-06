/**
 * DashboardWidgetHeader
 * Theme-aware header for dashboard widgets. Uses primary text color so headings
 * are light in dark mode and dark in light mode. Use for consistent widget titles.
 */

import type React from 'react'
import { useThemeContext } from '../../../theme'
import { colors } from '../../../tokens/colors'
import { H4 } from '../../Typography/Heading'
import { Row } from '../../Layout'

export interface DashboardWidgetHeaderProps {
  /** Widget title (e.g. "Activity", "News", "Team invitations") */
  title: string
  /** Optional action (e.g. button) aligned to the end */
  action?: React.ReactNode
}

export function DashboardWidgetHeader({
  title,
  action,
}: DashboardWidgetHeaderProps): React.ReactElement {
  const { theme } = useThemeContext()

  return (
    <Row align="center" justify="space-between" style={{ paddingBottom: 4 }}>
      <H4 style={{ color: colors.text[theme].primary }}>{title}</H4>
      {action}
    </Row>
  )
}
