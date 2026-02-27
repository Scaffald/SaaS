import { List, RotateCcw, Search, SlidersHorizontal } from 'lucide-react-native'
import { Button, Row } from '@scaffald/ui'

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
      align="center"
      justify="center"
      style={{ position: 'absolute', bottom: 16, left: 0, zIndex: 50 }}
    >
      <Row
        backgroundColor="$background"
        paddingHorizontal={12}
        paddingVertical={8}
        borderRadius={12}
        gap={8}
        align="center"
        justify="center"
        borderWidth={2}
        borderColor="$borderColor"
        style={{
          opacity: 0.95,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        }}
      >
        <Button size="md" onPress={onResultsPress} variant="outline" color="gray">
          {resultsCount > 0 ? resultsCount : <List size={22} />}
        </Button>
        <Button
          size="md"
          iconStart={Search}
          onPress={onSearchPress}
          variant="outline"
          color={searchActive ? 'primary' : 'gray'}
        />
        <Button
          size="md"
          iconStart={SlidersHorizontal}
          onPress={onFilterPress}
          variant="outline"
          color={filterActive ? 'primary' : 'gray'}
        />
        <Button
          size="md"
          iconStart={RotateCcw}
          onPress={onResetPress}
          variant="outline"
          color="gray"
        />
      </Row>
    </Row>
  )
}
