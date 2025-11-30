import { X } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import type { GetThemeValueForKey, SizeTokens, ThemeName } from 'tamagui'
import { Button, Text, XStack } from 'tamagui'

type FilterChipProps = {
  label: string
  icon?: ReactNode
  color?: string
  size?: SizeTokens
  onRemove?: () => void
  removable?: boolean
}

export function FilterChip({
  label,
  icon,
  color = 'blue',
  size = '$3',
  onRemove,
  removable = true,
}: FilterChipProps) {
  return (
    <XStack
      items="center"
      bg="$background"
      borderColor="$borderColor"
      borderWidth={1}
      rounded="$4"
      px="$3"
      py="$2"
      gap="$2"
      theme={color as ThemeName}
    >
      {icon && icon}
      <Text fontSize={size as GetThemeValueForKey<'fontSize'>} color="$color">
        {label}
      </Text>
      {removable && onRemove && (
        <Button size="$2" circular bg="transparent" onPress={onRemove} p="$1">
          <X size={12} color="$color" />
        </Button>
      )}
    </XStack>
  )
}
