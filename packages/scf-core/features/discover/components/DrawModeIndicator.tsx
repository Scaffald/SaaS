import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface DrawModeIndicatorProps {
  isActive: boolean
}

export function DrawModeIndicator({ isActive }: DrawModeIndicatorProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  if (!isActive) return null

  return (
    <Stack
      padding="sm"
      borderRadius={16}
      align="center"
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 100,
        backgroundColor: t === 'dark' ? colors.blue[700] : colors.blue[500],
      }}
    >
      <Text style={{ color: '#ffffff' }}>🖊️ Draw Mode Active - Draw on the map to select an area</Text>
    </Stack>
  )
}
