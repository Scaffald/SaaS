import { ChevronDown, Check } from '@tamagui/lucide-icons'
import { useState } from 'react'
import {
  Adapt,
  Button,
  ScrollView,
  Select,
  Text,
  useWindowDimensions,
  XStack,
  YStack,
} from 'tamagui'
import { Sheet } from './sheets/Sheet'

export interface ResponsiveSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ResponsiveSelectProps {
  /** Current selected value */
  value?: string
  /** Callback when value changes */
  onValueChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Options to display */
  options: ResponsiveSelectOption[]
  /** Label for the select field */
  label?: string
  /** Error message to display */
  error?: string
  /** Whether the select is disabled */
  disabled?: boolean
  /** Size of the select trigger */
  size?: '$1' | '$2' | '$3' | '$4' | '$5'
  /** Custom trigger props */
  triggerProps?: Record<string, unknown>
  /** Custom content props */
  contentProps?: Record<string, unknown>
  /** Sheet snap points for mobile (default: [70]) */
  sheetSnapPoints?: number[]
  /** Sheet title for mobile (default: placeholder or "Select an option") */
  sheetTitle?: string
  /** Whether to show check indicator on selected item */
  showIndicator?: boolean
  /** Test ID for the trigger */
  testID?: string
}

/**
 * ResponsiveSelect Component
 *
 * A cross-platform select component that automatically adapts to viewport size:
 * - Desktop (>800px, $md): Renders as anchored Select dropdown
 * - Mobile (≤800px, $sm): Renders as bottom Sheet with action buttons
 *
 * Features:
 * - Automatic responsive behavior based on window dimensions
 * - Consistent styling with theme tokens
 * - Accessible keyboard navigation
 * - Smooth animations and transitions
 * - Error state support
 *
 * @example
 * ```tsx
 * <ResponsiveSelect
 *   value={selectedValue}
 *   onValueChange={setSelectedValue}
 *   placeholder="Select an industry"
 *   options={[
 *     { value: 'tech', label: 'Technology' },
 *     { value: 'finance', label: 'Finance' },
 *   ]}
 * />
 * ```
 */
export function ResponsiveSelect({
  value,
  onValueChange,
  placeholder = 'Select an option',
  options,
  label,
  error,
  disabled = false,
  size = '$4',
  triggerProps = {},
  contentProps = {},
  sheetSnapPoints = [70],
  sheetTitle,
  showIndicator = true,
  testID,
}: ResponsiveSelectProps) {
  const { width } = useWindowDimensions()
  const isMobile = width <= 800

  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption?.label ?? placeholder

  // Mobile: Render as Sheet with action buttons
  if (isMobile) {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <YStack gap="$2">
        {label && (
          <Text fontWeight="600" fontSize="$4">
            {label}
          </Text>
        )}
        <Button
          testID={testID}
          size={size}
          disabled={disabled}
          onPress={() => !disabled && setIsOpen(true)}
          justify="space-between"
          width="100%"
          {...triggerProps}
        >
          <Text
            flex={1}
            style={{ textAlign: 'left' }}
            color={selectedOption ? '$color' : '$color10'}
          >
            {displayValue}
          </Text>
          <ChevronDown size={16} />
        </Button>

        <Sheet
          modal
          open={isOpen}
          onOpenChange={setIsOpen}
          snapPoints={sheetSnapPoints}
          dismissOnSnapToBottom
          zIndex={100000}
          animation="medium"
        >
          <Sheet.Overlay />
          <Sheet.Frame>
            <Sheet.Handle />
            <XStack
              px="$4"
              pt="$3"
              pb="$2"
              justify="space-between"
              items="center"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
            >
              <Text fontSize="$6" fontWeight="700" flex={1}>
                {sheetTitle ?? label ?? placeholder}
              </Text>
              <Button size="$3" circular chromeless onPress={() => setIsOpen(false)}>
                <Text>Done</Text>
              </Button>
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <YStack p="$4" gap="$2">
                {options.map((option) => {
                  const isSelected = value === option.value
                  return (
                    <Button
                      key={option.value}
                      size="$4"
                      disabled={option.disabled}
                      onPress={() => {
                        onValueChange(option.value)
                        setIsOpen(false)
                      }}
                      justify="space-between"
                      bg={isSelected ? '$blue2' : 'transparent'}
                      borderWidth={isSelected ? 1 : 0}
                      borderColor="$blue8"
                      pressStyle={{
                        bg: isSelected ? '$blue3' : '$backgroundHover',
                      }}
                    >
                      <Text
                        flex={1}
                        style={{ textAlign: 'left' }}
                        fontWeight={isSelected ? '600' : '400'}
                      >
                        {option.label}
                      </Text>
                      {showIndicator && isSelected && <Check size={16} color="$blue10" />}
                    </Button>
                  )
                })}
              </YStack>
            </ScrollView>
          </Sheet.Frame>
        </Sheet>

        {error && (
          <Text fontSize="$2" color="$red10">
            {error}
          </Text>
        )}
      </YStack>
    )
  }

  // Desktop: Render as Select with Adapt pattern
  return (
    <YStack gap="$2">
      {label && (
        <Text fontWeight="600" fontSize="$4">
          {label}
        </Text>
      )}
      <Select value={value} onValueChange={onValueChange} disablePreventBodyScroll>
        <Select.Trigger
          testID={testID}
          size={size}
          iconAfter={ChevronDown}
          disabled={disabled}
          borderColor={error ? '$red8' : '$borderColor'}
          {...triggerProps}
        >
          <Select.Value placeholder={placeholder}>{displayValue}</Select.Value>
        </Select.Trigger>

        <Adapt when="sm" platform="touch">
          <Sheet
            native
            modal
            dismissOnSnapToBottom
            animationConfig={{
              type: 'spring',
              damping: 20,
              mass: 1.2,
              stiffness: 250,
            }}
          >
            <Sheet.Frame>
              <Sheet.ScrollView>
                <Adapt.Contents />
              </Sheet.ScrollView>
            </Sheet.Frame>
            <Sheet.Overlay
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
          </Sheet>
        </Adapt>

        <Select.Content zIndex={200000} {...contentProps}>
          <Select.ScrollUpButton />
          <Select.Viewport>
            <Select.Group>
              {options.map((option, index) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  index={index}
                  disabled={option.disabled}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  {showIndicator && (
                    <Select.ItemIndicator>
                      <Check size={16} />
                    </Select.ItemIndicator>
                  )}
                </Select.Item>
              ))}
            </Select.Group>
          </Select.Viewport>
          <Select.ScrollDownButton />
        </Select.Content>
      </Select>

      {error && (
        <Text fontSize="$2" color="$red10">
          {error}
        </Text>
      )}
    </YStack>
  )
}
