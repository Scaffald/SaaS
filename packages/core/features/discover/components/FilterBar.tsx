import { XStack, Button } from '@app/ui'
import { Search, SlidersHorizontal, Pencil, RotateCcw, List } from '@tamagui/lucide-icons'

type FilterBarProps = {
  onSearchPress?: () => void
  onFilterPress?: () => void
  onDrawPress?: () => void
  onResetPress?: () => void
  onResultsPress?: () => void
  resultsCount?: number
}

/**
 * Simplified FilterBar component with 4 icon buttons
 * Designed to overlay the bottom of a map
 */
export const FilterBar = ({
  onSearchPress,
  onFilterPress,
  onDrawPress,
  onResetPress,
  onResultsPress,
  resultsCount = 0,
}: FilterBarProps) => {
  return (
    <XStack position="absolute" b="$4" l={0} r={0} z={50} items="center" justify="center">
      <XStack
        bg="$background"
        px="$3"
        py="$2"
        rounded="$12"
        gap="$2"
        items="center"
        justify="center"
        borderWidth={1}
        borderColor="$borderColor"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.15}
        shadowRadius={12}
      >
        <Button
          size="$4"
          circular
          onPress={onResultsPress}
          variant="outlined"
          bg="$background"
          hoverStyle={{ bg: '$backgroundHover' }}
          pressStyle={{ bg: '$backgroundPress' }}
        >
          {resultsCount > 0 ? resultsCount : <List size={22} />}
        </Button>
        <Button
          size="$4"
          circular
          icon={Search}
          scaleIcon={1.4}
          onPress={onSearchPress}
          variant="outlined"
          bg="$background"
          hoverStyle={{ bg: '$backgroundHover' }}
          pressStyle={{ bg: '$backgroundPress' }}
        />
        <Button
          size="$4"
          circular
          icon={SlidersHorizontal}
          scaleIcon={1.4}
          onPress={onFilterPress}
          variant="outlined"
          bg="$background"
          hoverStyle={{ bg: '$backgroundHover' }}
          pressStyle={{ bg: '$backgroundPress' }}
        />
        <Button
          size="$4"
          circular
          icon={Pencil}
          scaleIcon={1.4}
          onPress={onDrawPress}
          variant="outlined"
          bg="$background"
          hoverStyle={{ bg: '$backgroundHover' }}
          pressStyle={{ bg: '$backgroundPress' }}
        />
        <Button
          size="$4"
          circular
          icon={RotateCcw}
          scaleIcon={1.4}
          onPress={onResetPress}
          variant="outlined"
          bg="$background"
          hoverStyle={{ bg: '$backgroundHover' }}
          pressStyle={{ bg: '$backgroundPress' }}
        />
      </XStack>
    </XStack>
  )
}
