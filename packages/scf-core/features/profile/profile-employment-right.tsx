import { Text, Stack } from '@scaffald/ui'

/**
 * Profile Employment Right Component
 * Navigation and overview for employment profile settings
 */
export function ProfileEmploymentRight() {
  return (
    <Stack>
      <Stack style={{ gap: 16, padding: 16 }}>
        <Text style={{ color: '#414e62' }}>
          Update your employment preferences including location, travel willingness, availability,
          and compensation.
        </Text>
      </Stack>
    </Stack>
  )
}
