import { Text, Stack } from '@unicornlove/beyond-ui'

/**
 * Profile Employment Right Component
 * Navigation and overview for employment profile settings
 */
export function ProfileEmploymentRight() {
  return (
    <Stack>
      <Stack gap={16} padding={16}>
        <Text color="gray">
          Update your employment preferences including location, travel willingness, availability,
          and compensation.
        </Text>
      </Stack>
    </Stack>
  )
}
