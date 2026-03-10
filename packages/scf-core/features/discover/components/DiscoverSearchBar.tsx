import { DashboardWidget, Input } from '@scaffald/ui'
import { Search, X } from 'lucide-react-native'

interface DiscoverSearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

/**
 * Prominent search bar for discover screens.
 * Placed at the top of the left panel so it's the first thing users see.
 */
export function DiscoverSearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
}: DiscoverSearchBarProps) {
  return (
    <DashboardWidget>
      <Input
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        iconStart={Search}
        iconEnd={value.length > 0 ? X : undefined}
        iconEndOnPress={value.length > 0 ? () => onChangeText('') : undefined}
        iconEndAccessibilityLabel={value.length > 0 ? 'Clear search' : undefined}
        accessibilityLabel="Search"
      />
    </DashboardWidget>
  )
}
