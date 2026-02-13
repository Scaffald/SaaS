/**
 * ResponsiveSelect – select that is dropdown on desktop, sheet on mobile
 */

import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react-native'
import { Pressable, Text } from 'react-native'
import { useWindowDimensions } from '../../hooks/useWindowDimensions'
import { breakpoints } from '../../tokens/breakpoints'
import { Stack } from '../Layout'
import { Button } from '../Button'
import { Dropdown, DropdownItem } from '../Dropdown'
import { Label } from '../Typography'
import { FieldError } from '../FieldError'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { AdaptiveSelectSheet } from './AdaptiveSelectSheet'
import type { ResponsiveSelectProps, ResponsiveSelectOption } from './ResponsiveSelect.types'

const MOBILE_BREAKPOINT = breakpoints.sm // 800px

export function ResponsiveSelect({
  value,
  onValueChange,
  placeholder = 'Select an option',
  options,
  label,
  error,
  disabled = false,
  size = 'md',
  sheetTitle,
  showIndicator = true,
  testID,
}: ResponsiveSelectProps) {
  const { width } = useWindowDimensions()
  const isMobile = width < MOBILE_BREAKPOINT
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption?.label ?? placeholder

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setIsOpen(false)
  }

  if (isMobile) {
    return (
      <Stack gap={spacing[2]}>
        {label ? <Label>{label}</Label> : null}
        <Button
          testID={testID}
          size={size}
          disabled={disabled}
          onPress={() => !disabled && setIsOpen(true)}
          variant="outline"
          color="gray"
          iconEnd={ChevronDown}
          style={{ justifyContent: 'space-between' }}
        >
          {displayValue}
        </Button>
        <AdaptiveSelectSheet
          visible={isOpen}
          onClose={() => setIsOpen(false)}
          title={sheetTitle ?? label ?? placeholder}
          height="half"
        >
          <Stack gap={spacing[2]} style={{ padding: spacing[4] }}>
            {options.map((opt: ResponsiveSelectOption) => {
              const isSelected = value === opt.value
              return (
                <Pressable
                  key={opt.value}
                  disabled={opt.disabled}
                  onPress={() => handleSelect(opt.value)}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: spacing[3],
                      paddingHorizontal: spacing[4],
                      borderRadius: borderRadius.s,
                      backgroundColor: isSelected ? colors.primary[50] : 'transparent',
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: colors.primary[200],
                      opacity: opt.disabled ? 0.5 : 1,
                    },
                    pressed && !opt.disabled && { backgroundColor: colors.gray[100] },
                  ]}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: opt.disabled ? colors.text.light.disabled : colors.text.light.primary,
                      fontWeight: isSelected ? '600' : '400',
                    }}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                  {showIndicator && isSelected && (
                    <Check size={16} color={colors.primary[600]} />
                  )}
                </Pressable>
              )
            })}
          </Stack>
        </AdaptiveSelectSheet>
        <FieldError message={error} />
      </Stack>
    )
  }

  return (
    <Stack gap={spacing[2]}>
      {label ? <Label>{label}</Label> : null}
      <Dropdown
        open={isOpen}
        onOpenChange={setIsOpen}
        trigger={displayValue}
        disabled={disabled}
        position="bottom-left"
      >
        {options.map((opt) => (
          <DropdownItem
            key={opt.value}
            onPress={() => handleSelect(opt.value)}
            selected={value === opt.value}
            disabled={opt.disabled}
          >
            {opt.label}
          </DropdownItem>
        ))}
      </Dropdown>
      <FieldError message={error} />
    </Stack>
  )
}
