import { List, RotateCcw, Search, SlidersHorizontal } from '@tamagui/lucide-icons'
import type { CSSProperties } from 'react'
import { Button, Row } from '@unicornlove/beyond-ui'

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
    <Row
      position="absolute"
      bottom="$4"
      left={0}
      $sm={{ right: 0 }}
      $md={{ right: railVisible ? 440 : 0 }}
      zIndex={50}
      alignItems="center"
      justifyContent="center"
      animation="quick"
    >
      <Row
        backgroundColor="$background"
        opacity={0.95}
        paddingHorizontal="$3"
        paddingVertical="$2"
        borderRadius="$12"
        gap="$2"
        alignItems="center"
        justifyContent="center"
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
          backgroundColor="$background"
          hoverStyle={{ backgroundColor: '$backgroundHover' }}
          pressStyle={{ backgroundColor: '$backgroundPress' }}
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
          backgroundColor={searchActive ? '$blue9' : '$background'}
          color={searchActive ? 'white' : '$color'}
          hoverStyle={{ backgroundColor: searchActive ? '$blue10' : '$backgroundHover' }}
          pressStyle={{ backgroundColor: searchActive ? '$blue11' : '$backgroundPress' }}
        />
        <Button
          size="$4"
          circular
          icon={SlidersHorizontal}
          scaleIcon={1.4}
          onPress={onFilterPress}
          variant="outlined"
          backgroundColor={filterActive ? '$blue9' : '$background'}
          color={filterActive ? 'white' : '$color'}
          hoverStyle={{ backgroundColor: filterActive ? '$blue10' : '$backgroundHover' }}
          pressStyle={{ backgroundColor: filterActive ? '$blue11' : '$backgroundPress' }}
        />
        <Button
          size="$4"
          circular
          icon={RotateCcw}
          scaleIcon={1.4}
          onPress={onResetPress}
          variant="outlined"
          backgroundColor="$background"
          hoverStyle={{ backgroundColor: '$backgroundHover' }}
          pressStyle={{ backgroundColor: '$backgroundPress' }}
        />
      </Row>
    </Row>
  )
}
