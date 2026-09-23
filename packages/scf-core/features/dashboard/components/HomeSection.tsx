import type { ReactNode } from 'react'
import { H3, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/**
 * One section opener for Home.
 *
 * Home was eight cards stacked on a gradient — every block the same weight,
 * each with its own heading drawn as a bold `<Text>` at whatever size the
 * widget happened to pick (18, 16, 14 across the eight). The prototype
 * replaces the card grid with hairline bands, so a section here is a real
 * heading and its content, and the composition puts the rules between them.
 */
export function HomeSection({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack gap={12}>
      <Row justify="space-between" align="center" gap={12} wrap>
        {/* React Native defaults flexShrink to 0, so a heading beside an
            action pushes the row wider than the column (#858). */}
        <H3 style={{ color: colors.text[t].primary, flex: 1, minWidth: 0 }}>{title}</H3>
        {action}
      </Row>
      {children}
    </Stack>
  )
}
