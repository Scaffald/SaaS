import { Plus } from '@tamagui/lucide-icons'
import { Button, Input, XStack } from 'tamagui'

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
    <XStack gap="$3" items="center" flex={1} px="$4">
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
    </XStack>
  )
}
