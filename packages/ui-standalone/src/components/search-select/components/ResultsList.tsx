import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { memo, useMemo } from 'react'
import { Platform } from 'react-native'
import { ScrollView, SizableText, YStack } from 'tamagui'
import type { SearchSelectOption } from '../types'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { ResultItem } from './ResultItem'
import { ResultsSkeletonLoader } from './SkeletonLoader'

const isWeb = Platform.OS === 'web'
type FixedSizeListComponent = ComponentType<{
  height: number
  width: number | string
  itemCount: number
  itemSize: number
  className?: string
  itemData?: unknown
  children: ComponentType<{ index: number; style: CSSProperties; data: unknown }>
}>
let FixedSizeList: FixedSizeListComponent | null = null

if (isWeb) {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const reactWindow = require('react-window') as { FixedSizeList?: FixedSizeListComponent }
  FixedSizeList = reactWindow?.FixedSizeList ?? null
}

export interface ResultsListProps<T> {
  options: SearchSelectOption<T>[]
  activeIndex?: number
  selectedValues?: Set<string>
  onOptionPress: (option: SearchSelectOption<T>) => void
  renderOption?: (option: SearchSelectOption<T>) => ReactNode
  maxHeight?: number
  loading?: boolean
  loadingLabel?: string
  error?: string | null
  emptyContent?: ReactNode
  onRetry?: () => void
  virtualizationThreshold?: number
  itemHeight?: number
  headerContent?: ReactNode
  footerContent?: ReactNode
}

interface RowData<T> {
  options: SearchSelectOption<T>[]
  activeIndex: number
  selectedSet: Set<string>
  onOptionPress: (option: SearchSelectOption<T>) => void
  renderOption?: (option: SearchSelectOption<T>) => ReactNode
}

// Memoized Row component for react-window
const VirtualRow = memo(
  ({ index, style, data }: { index: number; style: CSSProperties; data: RowData<unknown> }) => {
    const { options, activeIndex, selectedSet, onOptionPress, renderOption } = data
    const option = options[index]
    const optionId = `search-result-${index}`
    const isLast = index === options.length - 1

    return (
      <YStack style={style} width="100%">
        <ResultItem
          option={option}
          index={index}
          isActive={activeIndex === index}
          isSelected={selectedSet.has(option.value)}
          onPress={onOptionPress}
          renderOption={renderOption}
          itemId={optionId}
          isLast={isLast}
        />
      </YStack>
    )
  }
)

function ResultsListComponent<T>({
  options,
  activeIndex = -1,
  selectedValues,
  onOptionPress,
  renderOption,
  maxHeight = 300,
  loading,
  loadingLabel = 'Searching…',
  error,
  emptyContent,
  onRetry,
  virtualizationThreshold = 1000, // Disabled by default - items should have natural height
  itemHeight = 48, // Only used if virtualization is explicitly enabled
  headerContent,
  footerContent,
}: ResultsListProps<T>) {
  const selectedSet = useMemo(() => selectedValues ?? new Set<string>(), [selectedValues])

  const itemData = useMemo(
    () => ({
      options,
      activeIndex,
      selectedSet,
      onOptionPress,
      renderOption,
    }),
    [options, activeIndex, selectedSet, onOptionPress, renderOption]
  )

  if (loading) {
    return (
      <YStack gap="$3" aria-busy={true}>
        <SizableText fontSize="$3" color="$color11" px="$3">
          {loadingLabel}
        </SizableText>
        <ResultsSkeletonLoader />
      </YStack>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  if (options.length === 0) {
    return emptyContent ?? <EmptyState />
  }

  const listboxRole = isWeb ? 'listbox' : undefined
  const activeDescendant = isWeb && activeIndex >= 0 ? `search-result-${activeIndex}` : undefined

  const accessibilityProps = isWeb
    ? ({ role: 'listbox', 'aria-activedescendant': activeDescendant } as Record<string, unknown>)
    : {}

  const shouldVirtualize =
    isWeb && Boolean(FixedSizeList) && options.length >= virtualizationThreshold

  if (shouldVirtualize && FixedSizeList) {
    const height = Math.min(maxHeight, options.length * itemHeight)

    return (
      <YStack {...accessibilityProps} width="100%">
        {headerContent}
        <FixedSizeList
          height={height}
          itemCount={options.length}
          itemSize={itemHeight}
          width="100%"
          className="search-select-virtual-list"
          itemData={itemData}
        >
          {VirtualRow as any}
        </FixedSizeList>
        {footerContent}
      </YStack>
    )
  }

  return (
    <YStack {...accessibilityProps} width="100%">
      {headerContent}
      <YStack style={{ maxHeight, overflow: 'hidden' }} width="100%">
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ width: '100%' }}
        >
          <YStack width="100%">
            {options.map((option, index) => {
              const optionId = `search-result-${index}`
              const isLast = index === options.length - 1
              return (
                <YStack key={option.value} width="100%">
                  <ResultItem
                    option={option}
                    index={index}
                    isActive={activeIndex === index}
                    isSelected={selectedSet.has(option.value)}
                    onPress={onOptionPress}
                    renderOption={renderOption}
                    itemId={optionId}
                    isLast={isLast}
                  />
                </YStack>
              )
            })}
          </YStack>
        </ScrollView>
      </YStack>
      {footerContent}
    </YStack>
  )
}

export const ResultsList = memo(ResultsListComponent) as typeof ResultsListComponent
