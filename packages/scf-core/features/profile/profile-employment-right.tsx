import { Text, Stack } from '@scaffald/ui'

/**
 * Profile Employment Right Component
 * Navigation and overview for employment profile settings
 */
export function ProfileEmploymentRight() {
  return (
    <Stack>
      <Stack gap={16} padding="md">
        <Text color="$gray11">
          Update your employment preferences including location, travel willingness, availability,
          and compensation.
        </Text>
      </Stack>
    </Stack>
  )
}
