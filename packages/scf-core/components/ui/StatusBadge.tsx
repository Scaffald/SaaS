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

/**
 * Theme-aware tints. These were fixed 600-weight ramps on an 18-alpha wash of
 * the 500, which read in light mode and all but vanished on the dark ground:
 * the default variant was gray-600 text on near-black (#1035).
 */
function variantColors(variant: BadgeVariant, t: 'light' | 'dark') {
  if (variant === 'default') {
    return { bg: colors.bg[t].muted, text: colors.text[t].secondary }
  }
  const fg = colors.fg[t][variant === 'error' ? 'error' : variant]
  return { bg: `${fg}1F`, text: fg }
}

export function StatusBadge({ variant = 'default', children }: StatusBadgeProps) {
  const { theme } = useThemeContext()
  const style = variantColors(variant, theme === 'dark' ? 'dark' : 'light')

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
