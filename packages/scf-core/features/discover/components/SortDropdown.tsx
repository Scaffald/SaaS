import { Popover } from '@scaffald/ui'
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { filterPillGlassStyle } from '@scf/core/components/ui'

type SortOption = {
  value: string
  label: string
  disabled?: boolean
}

type SortDropdownProps = {
  value: string
  onChange: (value: string) => void
  options: SortOption[]
}

/**
 * Popover-based sort selector for use in PageHeader's children slot.
 * Shows the currently selected sort label and a dropdown of options.
 */
export const SortDropdown = ({ value, onChange, options }: SortDropdownProps) => {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [isOpen, setIsOpen] = useState(false)

  const selectedLabel = options.find((o) => o.value === value)?.label ?? 'Sort'

  const popoverContent = (
    <Stack gap={4} style={{ minWidth: 200, padding: 8 }}>
      <Text style={{ fontSize: 13, color: colors.text[t].secondary, paddingHorizontal: 8, paddingBottom: 4 }}>
        Sort by
      </Text>
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (!option.disabled) {
                onChange(option.value)
                setIsOpen(false)
              }
            }}
            disabled={option.disabled}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 8,
              paddingHorizontal: 8,
              borderRadius: 6,
              backgroundColor: isSelected ? colors.bg[t].muted : 'transparent',
              opacity: option.disabled ? 0.5 : 1,
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled: option.disabled }}
          >
            <Text style={{ color: isSelected ? colors.text[t].primary : colors.text[t].secondary }}>
              {option.label}
            </Text>
            {isSelected ? <Check size={16} color={colors.fg[t].active} /> : null}
          </Pressable>
        )
      })}
    </Stack>
  )

  const isNonDefault = value !== options[0]?.value
  const pillText = isNonDefault
    ? colors.text[t].primary
    : colors.text[t].secondary

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-start"
      content={popoverContent}
    >
      <Pressable
        onPress={() => setIsOpen((v) => !v)}
        style={filterPillGlassStyle(t, isNonDefault)}
        accessibilityRole="button"
        accessibilityLabel={`Sort by ${selectedLabel}`}
      >
        <ArrowUpDown size={14} color={pillText} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: pillText }} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <ChevronDown size={14} color={pillText} />
      </Pressable>
    </Popover>
  )
}
