import { memo, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Button, SizableText, XStack, YStack } from 'tamagui'
import { Check } from '@tamagui/lucide-icons'
import type { SearchSelectOption, SearchSelectHighlightRange } from '../types'

export interface ResultItemProps<T> {
  option: SearchSelectOption<T>
  index: number
  isActive?: boolean
  isSelected?: boolean
  onPress?: (option: SearchSelectOption<T>) => void
  renderOption?: (option: SearchSelectOption<T>) => ReactNode
  showSelectionIcon?: boolean
  itemId?: string
}

const highlightText = (label: string, ranges?: SearchSelectHighlightRange[]) => {
  if (!ranges?.length) {
    return label
  }

  const ordered = [...ranges].sort((a, b) => a.start - b.start)
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const range of ordered) {
    const rangeKey = `${range.start}-${range.end}`
    if (range.start > cursor) {
      nodes.push(
        <SizableText key={`label-segment-${rangeKey}-plain`} color="$color12">
          {label.slice(cursor, range.start)}
        </SizableText>
      )
    }

    nodes.push(
      <SizableText key={`label-segment-${rangeKey}-highlight`} color="$blue10" fontWeight="600">
        {label.slice(range.start, range.end + 1)}
      </SizableText>
    )
    cursor = range.end + 1
  }

  if (cursor < label.length) {
    nodes.push(
      <SizableText key={`label-segment-${cursor}-trailing`} color="$color12">
        {label.slice(cursor)}
      </SizableText>
    )
  }

  return nodes
}

function ResultItemComponent<T>({
  option,
  index,
  isActive,
  isSelected,
  onPress,
  renderOption,
  showSelectionIcon = true,
  itemId,
}: ResultItemProps<T>) {
  const content = useMemo(() => {
    if (renderOption) {
      return renderOption(option)
    }

    return (
      <YStack gap="$1" flex={1} items="flex-start">
        <XStack gap="$2" items="center">
          <SizableText fontSize="$4" fontWeight="600">
            {highlightText(option.label, option.meta?.highlightRanges)}
          </SizableText>
        </XStack>
        {option.description ? (
          <SizableText fontSize="$2" color="$color11" numberOfLines={1}>
            {option.description}
          </SizableText>
        ) : null}
      </YStack>
    )
  }, [option, renderOption])

  return (
    <Button
      unstyled
      id={itemId}
      px="$3"
      py="$3"
      items="center"
      justify="space-between"
      bg={isActive ? '$color4' : 'transparent'}
      hoverStyle={{ bg: '$color4' }}
      pressStyle={{ bg: '$color5' }}
      onPress={() => onPress?.(option)}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      aria-selected={isSelected}
      aria-posinset={index + 1}
    >
      {content}
      {showSelectionIcon ? (
        <Check
          size={18}
          color={isSelected ? '$color10' : 'transparent'}
          aria-hidden={!isSelected}
        />
      ) : null}
    </Button>
  )
}

export const ResultItem = memo(ResultItemComponent) as typeof ResultItemComponent
