import { Text, YStack } from '@app/ui'

interface DrawModeIndicatorProps {
  isActive: boolean
}

export function DrawModeIndicator({ isActive }: DrawModeIndicatorProps) {
  if (!isActive) return null

  return (
    <YStack
      position="absolute"
      t="$4"
      l="$4"
      r="$4"
      z={100}
      bg="$blue9"
      p="$3"
      rounded="$4"
      items="center"
    >
      <Text color="white" fontSize="$4" fontWeight="600">
        🖊️ Draw Mode Active - Draw on the map to select an area
      </Text>
    </YStack>
  )
}
