import type { ReactNode } from 'react'
import { AnimatePresence, styled, Text, type ThemeName, View, XStack, YStack } from 'tamagui'
import { ToggleSwitch } from './ToggleSwitch'

export interface ToggleCardProps {
  /** Icon to display on the left side */
  icon?: ReactNode
  /** Main title text */
  title: string
  /** Optional description text below title */
  description?: string
  /** Whether the toggle is checked */
  checked: boolean
  /** Callback when toggle state changes */
  onCheckedChange: (checked: boolean) => void
  /** Optional content to show when expanded (when checked is true) */
  expandedContent?: ReactNode
  /** Whether the card is disabled */
  disabled?: boolean
  /** Width of the card (can be number or string like "100%") */
  width?: number | string
  /** Theme variant to apply */
  theme?: ThemeName
  /** Optional test ID for testing */
  testID?: string
  /** Disable press-to-toggle behavior on the card container */
  cardPressDisabled?: boolean
}

const AnimatedExpandedContent = styled(YStack, {
  overflow: 'hidden',
  variants: {
    open: {
      true: {
        opacity: 1,
        maxHeight: 1000,
      },
      false: {
        opacity: 0,
        maxHeight: 0,
      },
    },
  } as const,
  animation: 'medium',
})

/**
 * ToggleCard - A reusable toggle component with icon, title, description and expandable content
 *
 * Features:
 * - Fat-finger friendly (entire card is clickable)
 * - Optional expandable content when toggled on
 * - Icon + title + description layout
 * - Smooth animations for expand/collapse
 * - Cross-platform compatible
 *
 * @example
 * ```tsx
 * <ToggleCard
 *   icon={<Flag size="$2" color="$color11" />}
 *   title="US Resident"
 *   description="I am a resident of the United States"
 *   checked={usResident}
 *   onCheckedChange={setUsResident}
 *   expandedContent={
 *     <YStack gap="$2" pt="$3">
 *       <Input placeholder="Social Security Number" />
 *     </YStack>
 *   }
 * />
 * ```
 */
export function ToggleCard({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  expandedContent,
  disabled = false,
  width,
  theme,
  testID,
  cardPressDisabled = false,
}: ToggleCardProps) {
  const handlePress = () => {
    if (!disabled && !cardPressDisabled) {
      onCheckedChange(!checked)
    }
  }

  return (
    <YStack
      {...(width
        ? typeof width === 'number'
          ? { width }
          : { flex: 1, minWidth: 0 }
        : { flex: 1, minWidth: 0 })}
      testID={testID}
    >
      <XStack
        flexDirection="row"
        borderColor="$borderColor"
        borderWidth={1}
        px="$4"
        py="$3"
        $sm={{ mx: '$0' }}
        rounded="$3"
        borderBottomLeftRadius={checked && expandedContent ? 0 : undefined}
        borderBottomRightRadius={checked && expandedContent ? 0 : undefined}
        flex={1}
        height="auto"
        items="center"
        gap="$2.5"
        theme={theme}
        animation="medium"
        onPress={cardPressDisabled ? undefined : handlePress}
        disabled={disabled}
        opacity={disabled ? 0.5 : 1}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        // Hover and press states
        hoverStyle={{
          borderColor: '$borderColorHover',
          bg: '$backgroundHover',
        }}
        pressStyle={{
          bg: '$backgroundPress',
        }}
      >
        {/* Icon */}
        {icon && <View shrink={0}>{icon}</View>}

        {/* Title and Description */}
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            {title}
          </Text>
          {description && (
            <Text color="$color11" lineHeight="$1" fontSize="$3">
              {description}
            </Text>
          )}
        </YStack>

        {/* Custom Toggle */}
        <View self="center">
          <ToggleSwitch
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            size="medium"
            testID={testID ? `${testID}-toggle` : undefined}
          />
        </View>
      </XStack>

      {/* Expandable Content */}
      {expandedContent && (
        <AnimatePresence>
          {checked && (
            <AnimatedExpandedContent
              key="expanded-content"
              open={checked}
              borderColor="$borderColor"
              borderWidth={1}
              borderTopWidth={0}
              borderBottomLeftRadius="$3"
              borderBottomRightRadius="$3"
              borderTopRightRadius={0}
              borderTopLeftRadius={0}
              px="$4"
              py="$3"
              bg="$color1"
              enterStyle={{
                opacity: 0,
                maxH: 0,
              }}
              exitStyle={{
                opacity: 0,
                maxH: 0,
              }}
            >
              {expandedContent}
            </AnimatedExpandedContent>
          )}
        </AnimatePresence>
      )}
    </YStack>
  )
}
