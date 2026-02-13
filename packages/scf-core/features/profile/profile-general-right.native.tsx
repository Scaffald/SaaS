import { DashboardWidget } from '@scaffald/ui'
import { H3, Text, Stack } from '@scaffald/ui'

/**
 * Profile General Right Component
 * Navigation and overview for general profile settings with animated tips
 */
export function ProfileGeneralRight() {
  return (
    <Stack gap={16}>
      <DashboardWidget>
        <H3>General Information</H3>
        <Text color="$gray11">
          Update your basic profile information including your name, photo, and contact details.
        </Text>
      </DashboardWidget>
    </Stack>
  )
}
