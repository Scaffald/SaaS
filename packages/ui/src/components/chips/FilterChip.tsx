import { X } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import type { GetThemeValueForKey, SizeTokens, ThemeName } from '@tamagui/core'
import { Text } from 'tamagui'
import { XStack } from '@tamagui/stacks'
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
      style={{ alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}
      background="$background"
      borderColor="$borderColor"
      borderWidth={1}
      gap="$2"
      theme={color as ThemeName}
    >
      {icon && icon}
      <Text fontSize={size as GetThemeValueForKey<'fontSize'>} color="$color">
        {label}
      </Text>
      {removable && onRemove && (
        <Button
          size="$2"
          circular
          background="transparent"
          onPress={onRemove}
          style={{ padding: 4 }}
        >
          <X size={12} color="$color" />
        </Button>
      )}
    </XStack>
  )
}
