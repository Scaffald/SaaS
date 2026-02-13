import { DashboardWidget } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { H3, Text, Stack } , useThemeContext } from '@unicornlove/beyond-ui'

/**
 * Profile General Right Component
 * Navigation and overview for general profile settings with animated tips
 */
export function ProfileGeneralRight() {
  const { theme } = useThemeContext()
) {
  return (
    <Stack gap={16}>
      <DashboardWidget>
        <H3>General Information</H3>
        <Text style={{ color: colors.text[theme].secondary }}>
          Update your basic profile information including your name, photo, and contact details.
        </Text>
      </DashboardWidget>
    </Stack>
  )
}
