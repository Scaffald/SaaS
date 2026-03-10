/**
 * StatusBadge
 *
 * Lightweight inline badge for displaying status labels with color-coded variants.
 * Used across dashboard widgets, integration screens, and scheduling views.
 */

import type { ReactNode } from 'react'
import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error'

interface StatusBadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: `${colors.gray[500]}18`, text: colors.gray[600] },
  success: { bg: `${colors.success[500]}18`, text: colors.success[600] },
  warning: { bg: `${colors.warning[500]}18`, text: colors.warning[600] },
  error: { bg: `${colors.error[500]}18`, text: colors.error[600] },
}

export function StatusBadge({ variant = 'default', children }: StatusBadgeProps) {
  const { theme: _theme } = useThemeContext()
  const style = variantColors[variant]

  return (
    <Stack
      style={{
        backgroundColor: style.bg,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: style.text, fontSize: 11, fontWeight: '600' }}>
        {children}
      </Text>
    </Stack>
  )
}
