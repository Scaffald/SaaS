import { Plus } from 'lucide-react-native'
import { Button, Input, Row } from '@unicornlove/beyond-ui'

interface OfficePageHeaderProps {
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  createButtonLabel?: string
  onCreateClick?: () => void
}

export function OfficePageHeader({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  createButtonLabel,
  onCreateClick,
}: OfficePageHeaderProps) {
  return (
    <Row gap={12} align="center" flex={1} paddingHorizontal={16}>
      <Input
        flex={1}
        placeholder={searchPlaceholder}
        value={searchValue}
        onChangeText={onSearchChange}
      />
      {createButtonLabel && onCreateClick && (
        <Button iconStart={Plus} onPress={onCreateClick} themeInverse>
          {createButtonLabel}
        </Button>
      )}
    </Row>
  )
}
