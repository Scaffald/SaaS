import { useCallback, useMemo } from 'react'
import { Button, Separator, XStack, YStack } from 'tamagui'
import { FilterChip } from '../chips/FilterChip'
import { FieldError } from '../FieldError'
import { Popover } from '../popovers/Popover'
import { ResultsList } from './components/ResultsList'
import { SearchInput } from './components/SearchInput'
import { DEFAULT_STRINGS } from './constants'
import { useKeyboardNav } from './hooks/useKeyboardNav'
import { useSearchSelect } from './hooks/useSearchSelect'
import type { SearchSelectProps } from './types'

export function SearchSelectWeb<T>(props: SearchSelectProps<T>) {
  const {
    mode,
    inputValue,
    setInputValue,
    results,
    selectedOptions,
    isSearching,
    error,
    handleOptionSelect,
    handleRemoveOption,
    handleClearSelection,
    handleSelectAll,
    handleClearAll,
    isOpen,
    setIsOpen,
    canSelectMore,
    clearResults,
    refreshResults,
    setSelection,
  } = useSearchSelect<T>(props)

  const strings = useMemo(() => ({ ...DEFAULT_STRINGS, ...(props.strings ?? {}) }), [props.strings])
  const multiMode = mode === 'multiple'
  const selectedValueSet = useMemo(
    () => new Set(selectedOptions.map((option) => option.value)),
    [selectedOptions]
  )

  const keyboardNav = useKeyboardNav({
    optionCount: results.length,
    isEnabled: isOpen && results.length > 0,
    onSelectActive: (index) => {
      const option = results[index]
      if (option) {
        handleOptionSelect(option)
      }
    },
    onEscape: () => setIsOpen(false),
  })

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value)
      const trimmed = value.trim()
      if (!trimmed) {
        clearResults()
        setIsOpen(false)
      } else {
        setIsOpen(true)
      }
    },
    [clearResults, setInputValue, setIsOpen]
  )

  const minSearchLength = props.minSearchLength ?? 2
  const trimmedQuery = inputValue.trim()
  const requiresAdditionalCharacters =
    Boolean(props.onSearch) && trimmedQuery.length > 0 && trimmedQuery.length < minSearchLength

  const listHeader = multiMode ? (
    <XStack px="$3" py="$2" justify="space-between" gap="$3" bg="$color3">
      {props.allowSelectAll !== false && (
        <Button size="$2" variant="outlined" onPress={handleSelectAll} disabled={!canSelectMore}>
          {strings.selectAll}
        </Button>
      )}
      {props.allowClearAll !== false && (
        <Button
          size="$2"
          variant="outlined"
          onPress={handleClearAll}
          disabled={selectedOptions.length === 0}
        >
          {strings.clearAll}
        </Button>
      )}
    </XStack>
  ) : undefined

  const emptyContent = requiresAdditionalCharacters ? (
    <YStack p="$4" gap="$2" items="center">
      <Separator bg="$borderColor" />
      <Button variant="outlined" disabled>
        {strings.minCharacters(minSearchLength)}
      </Button>
    </YStack>
  ) : undefined

  const shouldShowDropdown = isOpen && (inputValue.trim().length > 0 || isSearching)

  return (
    <YStack gap="$2">
      <Popover open={shouldShowDropdown} onOpenChange={setIsOpen} placement="bottom-start">
        <Popover.Trigger asChild>
          <YStack gap="$2" width="100%">
            <SearchInput
              value={inputValue}
              onChangeText={handleInputChange}
              placeholder={props.placeholder}
              loading={isSearching}
              onClear={() => {
                setInputValue('')
                clearResults()
                setIsOpen(false)
              }}
              onFocus={() => {
                if (inputValue.trim().length > 0) {
                  setIsOpen(true)
                }
              }}
              onKeyPress={keyboardNav.handleKeyDown}
              disabled={props.disabled}
              isInvalid={Boolean(props.error)}
            />

            {multiMode && selectedOptions.length > 0 ? (
              <XStack gap="$2" flexWrap="wrap">
                {selectedOptions.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    onRemove={() => handleRemoveOption(option.value)}
                  />
                ))}
              </XStack>
            ) : null}
          </YStack>
        </Popover.Trigger>

        <Popover.Content
          p={0}
          mt="$2"
          bordered
          elevate
          style={{ maxHeight: 320, minWidth: 280, width: '100%' }}
        >
          <ResultsList
            options={results}
            activeIndex={keyboardNav.activeIndex}
            selectedValues={selectedValueSet}
            onOptionPress={handleOptionSelect}
            loading={isSearching}
            loadingLabel={strings.searching ?? DEFAULT_STRINGS.searching}
            error={error}
            onRetry={refreshResults}
            headerContent={listHeader}
            emptyContent={emptyContent}
            virtualizationThreshold={props.virtualizationThreshold}
            maxHeight={320}
          />
        </Popover.Content>
      </Popover>

      <FieldError message={props.error} />

      {multiMode && props.allowClearAll !== false && selectedOptions.length > 0 ? (
        <Button
          size="$2"
          variant="outlined"
          onPress={handleClearSelection}
          style={{ alignSelf: 'flex-start' }}
        >
          {strings.clear}
        </Button>
      ) : null}
    </YStack>
  )
}
