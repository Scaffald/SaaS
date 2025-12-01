import { X } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import type { GetThemeValueForKey, SizeTokens, ThemeName } from 'tamagui'
import { Text, XStack } from 'tamagui'
import { Button } from '../buttons/Button'

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
      alignItems="center"
      backgroundColor="$background"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$4"
      paddingHorizontal="$3"
      paddingVertical="$2"
      gap="$2"
      theme={color as ThemeName}
    >
      {icon && icon}
      <Text fontSize={size as GetThemeValueForKey<'fontSize'>} color="$color">
        {label}
      </Text>
      {removable && onRemove && (
        <Button size="$2" circular backgroundColor="transparent" onPress={onRemove} padding="$1">
          <X size={12} color="$color" />
        </Button>
      )}
    </XStack>
  )
}
