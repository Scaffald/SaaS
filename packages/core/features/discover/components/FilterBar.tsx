import type { CSSProperties } from 'react'
import { XStack, Button } from 'tamagui'
import { Search, SlidersHorizontal, RotateCcw, List } from '@tamagui/lucide-icons'

type FilterBarProps = {
  onSearchPress?: () => void
  onFilterPress?: () => void
  onResetPress?: () => void
  onResultsPress?: () => void
  resultsCount?: number
  railVisible?: boolean
  searchActive?: boolean
  filterActive?: boolean
}

/**
 * Simplified FilterBar component with icon buttons
 * Designed to overlay the bottom of a map
 */
export const FilterBar = ({
  onSearchPress,
  onFilterPress,
  onResetPress,
  onResultsPress,
  resultsCount = 0,
  railVisible = false,
  searchActive = false,
  filterActive = false,
}: FilterBarProps) => {
  return (
    <XStack
      position="absolute"
      b="$4"
      l={0}
      r={railVisible ? 440 : 0}
      z={50}
      items="center"
      justify="center"
      animation="quick"
    >
      <XStack
        bg="$background"
        opacity={0.95}
        px="$3"
        py="$2"
        rounded="$12"
        gap="$2"
        items="center"
        justify="center"
        borderWidth={2}
        borderColor="$borderColor"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.25}
        shadowRadius={16}
        style={
          {
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          } satisfies CSSProperties
        }
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
          bg={searchActive ? '$blue9' : '$background'}
          color={searchActive ? 'white' : '$color'}
          hoverStyle={{ bg: searchActive ? '$blue10' : '$backgroundHover' }}
          pressStyle={{ bg: searchActive ? '$blue11' : '$backgroundPress' }}
        />
        <Button
          size="$4"
          circular
          icon={SlidersHorizontal}
          scaleIcon={1.4}
          onPress={onFilterPress}
          variant="outlined"
          bg={filterActive ? '$blue9' : '$background'}
          color={filterActive ? 'white' : '$color'}
          hoverStyle={{ bg: filterActive ? '$blue10' : '$backgroundHover' }}
          pressStyle={{ bg: filterActive ? '$blue11' : '$backgroundPress' }}
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
