import { Text, Stack } from '@unicornlove/beyond-ui'

interface DrawModeIndicatorProps {
  isActive: boolean
}

export function DrawModeIndicator({ isActive }: DrawModeIndicatorProps) {
  if (!isActive) return null

  return (
    <Stack
      position="absolute"
      top={16}
      left={16}
      right={16}
      zIndex={100}
      backgroundColor="$blue9"
      padding={12}
      borderRadius={16}
      align="center"
    >
      <Text color="white">
        🖊️ Draw Mode Active - Draw on the map to select an area
      </Text>
    </Stack>
  )
}
