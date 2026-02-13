import { Text, Stack } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

/**
 * Profile Employment Right Component
 * Navigation and overview for employment profile settings
 */
export function ProfileEmploymentRight() {
  const { theme } = useThemeContext()
) 
  return (
    <Stack>
      <Stack gap={16} padding="md">
        <Text style={{ color: colors.text[theme].secondary }}>
          Update your employment preferences including location, travel willingness, availability,
          and compensation.
        </Text>
      </Stack>
    </Stack>
  )
