import { Plus } from '@tamagui/lucide-icons'
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
    <Row gap="$3" alignItems="center" flex={1} paddingHorizontal="$4">
      <Input
        flex={1}
        placeholder={searchPlaceholder}
        value={searchValue}
        onChangeText={onSearchChange}
      />
      {createButtonLabel && onCreateClick && (
        <Button icon={Plus} onPress={onCreateClick} themeInverse>
          {createButtonLabel}
        </Button>
      )}
    </Row>
  )
}
