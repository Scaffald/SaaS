import { X } from '@tamagui/lucide-icons'
import type { SizeTokens, ThemeName } from 'tamagui'
import { Chip } from './components/chipsParts'

type FilterChipProps = {
  label: string
  icon?: React.ReactNode
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
    <Chip rounded size={size} theme={color as ThemeName} backgroundColor="$color4">
      {icon && (
        <Chip.Icon y={-1} scaleIcon={1.1} color="$color9">
          {icon}
        </Chip.Icon>
      )}
      <Chip.Text color="$color9">{label}</Chip.Text>
      {removable && onRemove && (
        <Chip.Button alignRight onPress={onRemove}>
          <Chip.Icon>
            <X color="$color9" />
          </Chip.Icon>
        </Chip.Button>
      )}
    </Chip>
  )
}
