import { DashboardWidget } from '@unicornlove/beyond-ui'
import { H3, Text, Stack } from '@unicornlove/beyond-ui'

/**
 * Profile General Right Component
 * Navigation and overview for general profile settings with animated tips
 */
export function ProfileGeneralRight() {
  return (
    <Stack gap="$4">
      <DashboardWidget>
        <H3>General Information</H3>
        <Text color="$color11" fontSize="$3">
          Update your basic profile information including your name, photo, and contact details.
        </Text>
      </DashboardWidget>
    </Stack>
  )
}
