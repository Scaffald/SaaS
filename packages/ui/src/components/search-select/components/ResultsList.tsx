import type { ReactNode } from 'react'
import { memo, useMemo } from 'react'
import { Platform } from 'react-native'
import { ScrollView, SizableText, YStack } from 'tamagui'
import type { SearchSelectOption } from '../types'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { ResultItem } from './ResultItem'
import { ResultsSkeletonLoader } from './SkeletonLoader'

const isWeb = Platform.OS === 'web'

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
  /** @deprecated Virtualization is no longer supported. This prop is kept for backward compatibility but has no effect. */
  virtualizationThreshold?: number
  /** @deprecated Virtualization is no longer supported. This prop is kept for backward compatibility but has no effect. */
  itemHeight?: number
  headerContent?: ReactNode
  footerContent?: ReactNode
}

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
  virtualizationThreshold: _virtualizationThreshold, // Deprecated - kept for backward compatibility
  itemHeight: _itemHeight, // Deprecated - kept for backward compatibility
  headerContent,
  footerContent,
}: ResultsListProps<T>) {
  const selectedSet = useMemo(() => selectedValues ?? new Set<string>(), [selectedValues])

  if (loading) {
    return (
      <YStack gap="$3" aria-busy={true}>
        <SizableText fontSize="$3" color="$color11" paddingHorizontal="$3">
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

  const activeDescendant = isWeb && activeIndex >= 0 ? `search-result-${activeIndex}` : undefined

  const accessibilityProps = isWeb
    ? ({ role: 'listbox', 'aria-activedescendant': activeDescendant } as Record<string, unknown>)
    : {}

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
