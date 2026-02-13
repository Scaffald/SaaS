import { List, RotateCcw, Search, SlidersHorizontal } from 'lucide-react-native'
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
  railVisible: _railVisible = false,
  searchActive = false,
  filterActive = false,
}: FilterBarProps) => {
  return (
    <Row
      position="absolute"
      bottom={16}
      left={0}
      zIndex={50}
      align="center"
      justify="center"
      animation="quick"
    >
      <Row
        backgroundColor="$background"
        opacity={0.95}
        paddingHorizontal={12}
        paddingVertical={8}
        borderRadius="$12"
        gap={8}
        align="center"
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
          size="md"
          
          onPress={onResultsPress}
          variant="outline"
          backgroundColor="$background"
          hoverStyle={{ backgroundColor: '$backgroundHover' }}
          pressStyle={{ backgroundColor: '$backgroundPress' }}
        >
          {resultsCount > 0 ? resultsCount : <List size={22} />}
        </Button>
        <Button
          size="md"
          
          iconStart={Search}
          scaleIcon={1.4}
          onPress={onSearchPress}
          variant="outline"
          backgroundColor={searchActive ? '$blue9' : '$background'}
          color={searchActive ? 'white' : '$color'}
          hoverStyle={{ backgroundColor: searchActive ? '$blue10' : '$backgroundHover' }}
          pressStyle={{ backgroundColor: searchActive ? '$blue11' : '$backgroundPress' }}
        />
        <Button
          size="md"
          
          iconStart={SlidersHorizontal}
          scaleIcon={1.4}
          onPress={onFilterPress}
          variant="outline"
          backgroundColor={filterActive ? '$blue9' : '$background'}
          color={filterActive ? 'white' : '$color'}
          hoverStyle={{ backgroundColor: filterActive ? '$blue10' : '$backgroundHover' }}
          pressStyle={{ backgroundColor: filterActive ? '$blue11' : '$backgroundPress' }}
        />
        <Button
          size="md"
          
          iconStart={RotateCcw}
          scaleIcon={1.4}
          onPress={onResetPress}
          variant="outline"
          backgroundColor="$background"
          hoverStyle={{ backgroundColor: '$backgroundHover' }}
          pressStyle={{ backgroundColor: '$backgroundPress' }}
        />
      </Row>
    </Row>
  )
}
