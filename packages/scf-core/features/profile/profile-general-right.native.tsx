import { DashboardWidget } from '@scaffald/ui'
import { H3, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/**
 * Profile General Right Component
 * Navigation and overview for general profile settings with animated tips
 */
export function ProfileGeneralRight() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Stack gap={16}>
      <DashboardWidget>
        <H3>General Information</H3>
        <Text style={{ color: colors.text[t].secondary }}>
          Update your basic profile information including your name, photo, and contact details.
        </Text>
      </DashboardWidget>
    </Stack>
  )
}
