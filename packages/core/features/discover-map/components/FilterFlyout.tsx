import { ReactNode } from 'react'
import {
  Adapt,
  Button,
  Paragraph,
  Popover,
  ScrollView,
  Separator,
  Sheet,
  Text,
  XStack,
  YStack,
  useDidFinishSSR,
} from '@app/ui'
import { ChevronDown, X } from '@tamagui/lucide-icons'

type FilterFlyoutProps = {
  label: string
  summary?: string
  children: ReactNode
  isCompact?: boolean
  onClear?: () => void
}

export const FilterFlyout = ({
  label,
  summary,
  children,
  isCompact = false,
  onClear,
}: FilterFlyoutProps) => {
  const triggerLabel = summary ? `${label}: ${summary}` : label
  const isHydrated = useDidFinishSSR()

  const renderContent = (variant: 'popover' | 'sheet') => (
    <YStack
      width={variant === 'popover' ? 320 : '100%'}
      maxHeight={variant === 'popover' ? 380 : undefined}
      padding="$4"
      gap="$4"
    >
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <Text fontSize="$5" fontWeight="600">
          {label}
        </Text>
        {onClear ? (
          <Button size="$2" theme="gray" onPress={onClear} icon={X}>
            Clear
          </Button>
        ) : null}
      </XStack>
      <Paragraph color="$color11">
        {summary ? `Currently: ${summary}` : 'Adjust filter values to refine the map results.'}
      </Paragraph>
      <Separator />
      <ScrollView maxHeight={variant === 'popover' ? 260 : undefined} showsVerticalScrollIndicator>
        <YStack gap="$3" paddingBottom="$4">
          {children}
        </YStack>
      </ScrollView>
    </YStack>
  )

  return (
    <Popover placement="bottom-start" size="$5">
      <Popover.Trigger asChild>
        <Button
          size={isCompact ? '$2' : '$3'}
          borderRadius="$6"
          theme="surface2"
          iconAfter={ChevronDown}
          accessibilityLabel={`${label} filter`}
        >
          {isCompact ? label : triggerLabel}
        </Button>
      </Popover.Trigger>
      {isHydrated ? (
        <Adapt when="sm">
          <Sheet modal dismissOnSnapToBottom snapPoints={[85]}>
            <Sheet.Overlay />
            <Sheet.Handle />
            <Sheet.Frame>
              <Sheet.ScrollView>{renderContent('sheet')}</Sheet.ScrollView>
            </Sheet.Frame>
          </Sheet>
        </Adapt>
      ) : null}
      <Popover.Content padding={0} bordered elevate>
        {renderContent('popover')}
      </Popover.Content>
    </Popover>
  )
}

export default FilterFlyout
