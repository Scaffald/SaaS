import { useCallback, useMemo, useRef, useState } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import { FilterChip } from '../chips/FilterChip'
import { FieldError } from '../FieldError'
import { Sheet } from '../sheets/Sheet'
import { ResultsList } from './components/ResultsList'
import { SearchInput } from './components/SearchInput'
import { DEFAULT_STRINGS } from './constants'
import { useSearchSelect } from './hooks/useSearchSelect'
import type { SearchSelectOption, SearchSelectProps } from './types'

export function SearchSelectMobile<T>(props: SearchSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const strings = useMemo(() => ({ ...DEFAULT_STRINGS, ...(props.strings ?? {}) }), [props.strings])
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
    canSelectMore,
    clearResults,
    refreshResults,
    setSelection,
  } = useSearchSelect<T>(props)

  const multiMode = mode === 'multiple'
  const selectedValueSet = useMemo(
    () => new Set(selectedOptions.map((option) => option.value)),
    [selectedOptions]
  )
  const initialSelectionRef = useRef<T | T[] | null>(null)

  const openSheet = useCallback(() => {
    if (props.disabled) return
    setOpen(true)
    initialSelectionRef.current = multiMode
      ? selectedOptions.map((option) => option.raw)
      : (selectedOptions[0]?.raw ?? null)
  }, [multiMode, props.disabled, selectedOptions])

  const closeSheet = useCallback(() => {
    setOpen(false)
    setInputValue('')
    clearResults()
  }, [clearResults, setInputValue])

  const restoreSelection = useCallback(() => {
    if (multiMode) {
      const snapshot = initialSelectionRef.current
      if (Array.isArray(snapshot)) {
        setSelection(snapshot as T[])
      } else if (snapshot) {
        setSelection([snapshot])
      } else {
        setSelection([] as T[])
      }
    } else {
      const snapshot = initialSelectionRef.current
      if (Array.isArray(snapshot)) {
        setSelection(snapshot[0] ?? null)
      } else {
        setSelection((snapshot as T | null) ?? null)
      }
    }
  }, [multiMode, setSelection])

  const handleCancel = () => {
    restoreSelection()
    closeSheet()
  }

  const handleDone = () => {
    closeSheet()
  }

  const handleOptionPress = useCallback(
    (option: SearchSelectOption<T>) => {
      handleOptionSelect(option)
      // Close sheet after selection (for both single and multi-select)
      closeSheet()
    },
    [handleOptionSelect, closeSheet]
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
      <Text fontSize="$3" color="$color11" style={{ textAlign: 'center' }}>
        {strings.minCharacters(minSearchLength)}
      </Text>
    </YStack>
  ) : undefined

  const collapsedValue = multiMode
    ? selectedOptions.length > 0
      ? `${selectedOptions.length} selected`
      : ''
    : (selectedOptions[0]?.label ?? '')

  return (
    <YStack gap="$2">
      <SearchInput
        value={collapsedValue}
        placeholder={props.placeholder}
        onChangeText={() => {}}
        onFocus={openSheet}
        onPressIn={openSheet}
        editable={false}
        showClear={false}
        disabled={props.disabled}
        isInvalid={Boolean(props.error)}
      />
      <FieldError message={props.error} />

      <Sheet
        modal
        open={open}
        onOpenChange={(next: boolean) => {
          if (!next) {
            closeSheet()
          } else {
            setOpen(true)
          }
        }}
        snapPoints={[90, 60]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame gap="$3" p="$4">
          <Sheet.Handle />
          <XStack justify="space-between" items="center">
            <Button variant="outlined" onPress={handleCancel} size="$2">
              Cancel
            </Button>
            <Text fontSize="$4" fontWeight="600">
              {multiMode ? `${selectedOptions.length} selected` : (selectedOptions[0]?.label ?? '')}
            </Text>
            <Button variant="outlined" onPress={handleDone} size="$2">
              Done
            </Button>
          </XStack>

          <SearchInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={props.placeholder}
            loading={isSearching}
            autoFocus
            showClear
            onClear={() => setInputValue('')}
            disabled={props.disabled}
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

          <ResultsList
            options={results}
            selectedValues={selectedValueSet}
            onOptionPress={handleOptionPress}
            loading={isSearching}
            loadingLabel={strings.searching}
            error={error}
            onRetry={refreshResults}
            headerContent={listHeader}
            emptyContent={emptyContent}
            virtualizationThreshold={props.virtualizationThreshold}
          />

          {multiMode && props.allowClearAll !== false && selectedOptions.length > 0 ? (
            <Button
              mt="$2"
              size="$2"
              variant="outlined"
              onPress={handleClearSelection}
              style={{ alignSelf: 'flex-start' }}
            >
              {strings.clear}
            </Button>
          ) : null}
        </Sheet.Frame>
      </Sheet>
    </YStack>
  )
}
