import { useId, type ReactNode } from 'react'
import {
  Button,
  Label,
  Switch,
  Text,
  View,
  YStack,
  AnimatePresence,
  styled,
  getTokens,
  type ThemeName,
} from 'tamagui'

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
  /** Width of the card */
  width?: number | string
  /** Theme variant to apply */
  theme?: ThemeName
  /** Optional test ID for testing */
  testID?: string
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
 *   description="I am a permanent resident of the United States"
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
  width = 400,
  theme = 'surface1',
  testID,
}: ToggleCardProps) {
  const uniqueId = useId()
  const tokens = getTokens()

  const handlePress = () => {
    if (!disabled) {
      onCheckedChange(!checked)
    }
  }

  return (
    <YStack width={width} testID={testID}>
      <Button
        flexDirection="row"
        maxWidth="100%"
        borderColor="$borderColor"
        borderWidth={1}
        paddingHorizontal="$4"
        paddingVertical="$3"
        $sm={{ marginHorizontal: '$0' }}
        borderRadius={expandedContent && checked ? '$3 $3 $0 $0' : '$3'}
        width="100%"
        height="auto"
        alignItems="center"
        gap="$2.5"
        theme={theme}
        animation="medium"
        onPress={handlePress}
        disabled={disabled}
        opacity={disabled ? 0.5 : 1}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        // Hover and press states
        hoverStyle={{
          borderColor: '$borderColorHover',
          backgroundColor: '$backgroundHover',
        }}
        pressStyle={{
          backgroundColor: '$backgroundPress',
        }}
      >
        {/* Icon */}
        {icon && <View flexShrink={0}>{icon}</View>}

        {/* Title and Description */}
        <View flexDirection="column" flex={1}>
          <Label size="$4" htmlFor={uniqueId + 'switch'} fontWeight="600" color="$color12">
            {title}
          </Label>
          {description && (
            <Text
              theme="alt1"
              color="$color11"
              lineHeight="$1"
              marginTop="$1"
              fontSize="$3"
              textAlign="left"
            >
              {description}
            </Text>
          )}
        </View>

        {/* Switch */}
        <View alignSelf="center" marginLeft="auto">
          <Switch
            id={uniqueId + 'switch'}
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            size="$2"
            backgroundColor={checked ? '$color10' : '$color5'}
            borderColor={checked ? '$color10' : '$color6'}
            animation="200ms"
          >
            <Switch.Thumb borderColor="$white" animation="200ms" backgroundColor="$color1" />
          </Switch>
        </View>
      </Button>

      {/* Expandable Content */}
      {expandedContent && (
        <AnimatePresence>
          {checked && (
            <AnimatedExpandedContent
              key="expanded-content"
              open={checked}
              borderColor="$borderColor"
              borderWidth="0 1px 1px 1px"
              borderRadius="$0 $0 $3 $3"
              paddingHorizontal="$4"
              paddingVertical="$3"
              backgroundColor="$background"
              enterStyle={{
                opacity: 0,
                maxHeight: 0,
              }}
              exitStyle={{
                opacity: 0,
                maxHeight: 0,
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
