import { Plus, SlidersHorizontal } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import { Button, Input, Paragraph, Separator, XStack, YStack } from 'tamagui'

export interface TableActionBarProps {
  /**
   * Current value of the search input.
   */
  searchValue: string
  /**
   * Callback triggered when the search value changes.
   */
  onSearchChange: (value: string) => void
  /**
   * Placeholder text for the search input.
   * @default "Search"
   */
  searchPlaceholder?: string
  /**
   * Label shown on the add button.
   * @default "Add"
   */
  addLabel?: string
  /**
   * Handler invoked when the add button is pressed.
   */
  onAddPress?: () => void
  /**
   * Optional accessory rendered to the left of the primary actions.
   */
  leftAccessory?: ReactNode
  /**
   * Optional accessory rendered to the right of the search input.
   */
  rightAccessory?: ReactNode
  /**
   * Whether the add button is disabled.
   */
  addDisabled?: boolean
  /**
   * Label shown on the column visibility button.
   * @default "Show"
   */
  showLabel?: string
  /**
   * Handler invoked when the show button is pressed.
   */
  onShowPress?: () => void
  /**
   * Whether the show button is disabled.
   */
  showDisabled?: boolean
  /**
   * Optional helper text displayed under the left actions.
   */
  helperText?: string
}

/**
 * TableActionBar
 *
 * A composable action bar intended to sit above tabular data views. It
 * consolidates primary actions (add/show) on the left and a search input on
 * the right, matching the flows in the design reference.
 *
 * Consumers can customise the left or right sections by providing accessories.
 */
export function TableActionBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  addLabel = 'Add',
  onAddPress,
  leftAccessory,
  rightAccessory,
  addDisabled = false,
  showLabel = 'Show',
  onShowPress,
  showDisabled = false,
  helperText,
}: TableActionBarProps) {
  return (
    <YStack gap="$2" width="100%">
      <XStack width="100%" items="center" justify="space-between" gap="$4" flexWrap="wrap">
        <YStack gap="$2">
          <XStack gap="$2" items="center">
            {leftAccessory}
            <Button icon={Plus} disabled={addDisabled} onPress={onAddPress}>
              {addLabel}
            </Button>
            <Button
              variant="outlined"
              icon={SlidersHorizontal}
              disabled={showDisabled}
              onPress={onShowPress}
            >
              {showLabel}
            </Button>
          </XStack>
          {helperText ? <Paragraph size="$3">{helperText}</Paragraph> : null}
        </YStack>

        <XStack gap="$2" items="center">
          <Input
            width={280}
            value={searchValue}
            placeholder={searchPlaceholder}
            onChangeText={onSearchChange}
          />
          {rightAccessory}
        </XStack>
      </XStack>

      <Separator />
    </YStack>
  )
}
