import { Text, Stack } from '@scaffald/ui'

interface DrawModeIndicatorProps {
  isActive: boolean
}

export function DrawModeIndicator({ isActive }: DrawModeIndicatorProps) {
  if (!isActive) return null

  return (
    <Stack
      backgroundColor="$blue9"
      padding="sm"
      borderRadius={16}
      align="center"
      style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 100 }}
    >
      <Text color="white">🖊️ Draw Mode Active - Draw on the map to select an area</Text>
    </Stack>
  )
}
