import { ChevronDown, Check } from '@tamagui/lucide-icons'
import { useCallback } from 'react'
import { Adapt, Select, Sheet, YStack } from 'tamagui'

interface MinimalIndustrySelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: Array<{ value: string; label: string }>
  testID?: string
}

/**
 * Minimal Industry Select Component
 * Ultra-simple Select with no side effects, no window tracking, minimal logic
 */
export function MinimalIndustrySelect({
  value,
  onValueChange,
  placeholder = 'Select an industry',
  options,
  testID,
}: MinimalIndustrySelectProps) {
  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption?.label ?? placeholder

  // Prevent calling onValueChange if value hasn't actually changed
  const handleValueChange = useCallback(
    (newValue: string) => {
      if (newValue !== value) {
        onValueChange(newValue)
      }
    },
    [value, onValueChange]
  )

  return (
    <YStack gap="$2">
      <Select value={value} onValueChange={handleValueChange} disablePreventBodyScroll>
        <Select.Trigger
          testID={testID}
          size="$4"
          iconAfter={ChevronDown}
          borderColor="$borderColor"
        >
          <Select.Value placeholder={placeholder}>{displayValue}</Select.Value>
        </Select.Trigger>

        <Adapt when="sm" platform="touch">
          <Sheet native modal dismissOnSnapToBottom>
            <Sheet.Frame>
              <Sheet.ScrollView>
                <Adapt.Contents />
              </Sheet.ScrollView>
            </Sheet.Frame>
            <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
          </Sheet>
        </Adapt>

        <Select.Content zIndex={200000}>
          <Select.ScrollUpButton />
          <Select.Viewport>
            <Select.Group>
              {options.map((option, index) => (
                <Select.Item key={option.value} value={option.value} index={index}>
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Group>
          </Select.Viewport>
          <Select.ScrollDownButton />
        </Select.Content>
      </Select>
    </YStack>
  )
}

