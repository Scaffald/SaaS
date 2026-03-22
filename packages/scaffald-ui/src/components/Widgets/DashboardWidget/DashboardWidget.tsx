/**
 * DashboardWidget
 * A card-style container for dashboard sections (profile, assessments, etc.)
 * Used by scf-core dashboard and profile widgets.
 */

import type React from 'react'
import { Card } from '../../Card'
import { Stack } from '../../Layout'
import type { GapValue } from '../../Layout'
import { useResponsive } from '../../../hooks/useResponsive'

export interface DashboardWidgetProps {
  children: React.ReactNode
  /** Gap between children (maps to Stack gap) */
  gap?: GapValue | number
  /** Use elevated card variant */
  elevated?: boolean
  style?: object
  testID?: string
}

export function DashboardWidget({
  children,
  gap = 16,
  elevated = false,
  style,
  testID,
}: DashboardWidgetProps): React.ReactElement {
  const { isDesktop } = useResponsive()
  return (
    <Card
      variant={elevated ? 'elevated' : 'glass'}
      padding="2xl"
      radius="xl"
      elevation={elevated ? 'soft' : 'glass'}
      style={style}
      testID={testID}
    >
      <Stack gap={typeof gap === 'number' ? gap : 16}>{children}</Stack>
    </Card>
  )
}
