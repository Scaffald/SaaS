import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SearchSelectOption, SearchSelectProps, UseSearchSelectResult } from '../types'
import { useSearch } from './useSearch'

const ensureArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is T => item !== undefined && item !== null)
  }
  if (value === null || value === undefined) {
    return []
  }
  return [value]
}

export function useSearchSelect<T>(props: SearchSelectProps<T>): UseSearchSelectResult<T> {
  const {
    mode = 'single',
    value,
    defaultValue,
    onChange,
    options,
    onSearch,
    getOptionLabel,
    getOptionValue,
    getOptionDescription,
    debounceMs,
    minSearchLength,
    enableFuzzyMatch,
    enableHighlight,
    maxSelections,
    allowSelectAll = true,
    allowClearAll = true,
    inputValue: controlledInput,
    onInputChange,
    onOpenChange,
  } = props

  const [internalValue, setInternalValue] = useState<T | T[] | null | undefined>(
    value ?? defaultValue ?? (mode === 'multiple' ? [] : null)
  )
  const isControlled = value !== undefined

  const resolvedValue = isControlled ? value : internalValue
  const normalizedSelection = ensureArray(resolvedValue as T | T[] | null | undefined)

  const normalizeOption = useCallback(
    (option: T): SearchSelectOption<T> => ({
      raw: option,
      label: getOptionLabel(option),
      value: String(getOptionValue(option)),
      description: getOptionDescription?.(option),
    }),
    [getOptionDescription, getOptionLabel, getOptionValue]
  )

  const selectedOptions = useMemo(
    () => normalizedSelection.map((option) => normalizeOption(option)),
    [normalizeOption, normalizedSelection]
  )

  const selectionMap = useMemo(() => {
    const map = new Map<string, SearchSelectOption<T>>()
    for (const option of selectedOptions) {
      map.set(option.value, option)
    }
    return map
  }, [selectedOptions])

  const [isOpenState, setIsOpenState] = useState(false)
  const setIsOpen = useCallback(
    (next: boolean) => {
      setIsOpenState(next)
      onOpenChange?.(next)
    },
    [onOpenChange]
  )

  const [internalInput, setInternalInput] = useState('')
  const isInputControlled = controlledInput !== undefined && onInputChange !== undefined
  const inputValue = isInputControlled ? (controlledInput ?? '') : internalInput

  const search = useSearch<T>({
    options,
    onSearch,
    getOptionLabel,
    getOptionValue,
    getOptionDescription,
    debounceMs,
    minSearchLength,
    enableFuzzyMatch,
    enableHighlight,
  })

  const updateInputValue = useCallback(
    (next: string) => {
      // Always call onInputChange if provided, regardless of controlled state
      // This allows parent components to trigger searches even when input is uncontrolled
      onInputChange?.(next)

      if (isInputControlled) {
        // If controlled, parent manages state via onInputChange
        // Don't set internal state
      } else {
        setInternalInput(next)
      }
      search.handleQueryChange(next)
    },
    [isInputControlled, onInputChange, search]
  )

  useEffect(() => {
    if (isInputControlled) {
      search.handleQueryChange(controlledInput ?? '')
    }
  }, [controlledInput, isInputControlled, search])

  const emitChange = useCallback(
    (nextValue: T | T[] | null) => {
      if (!isControlled) {
        setInternalValue(nextValue ?? (mode === 'multiple' ? [] : null))
      }
      onChange?.(nextValue)
    },
    [isControlled, mode, onChange]
  )

  const canSelectMore = useMemo(() => {
    if (mode !== 'multiple') {
      return selectedOptions.length === 0
    }
    if (!maxSelections) {
      return true
    }
    return selectedOptions.length < maxSelections
  }, [maxSelections, mode, selectedOptions.length])

  const handleOptionSelect = useCallback(
    (option: SearchSelectOption<T>) => {
      if (option.disabled) {
        return
      }

      const isAlreadySelected = selectionMap.has(option.value)

      if (mode === 'multiple') {
        if (isAlreadySelected) {
          // Toggle off if allowed
          const filtered = selectedOptions.filter((item) => item.value !== option.value)
          emitChange(filtered.map((item) => item.raw))
          return
        }

        if (!canSelectMore) {
          return
        }

        const nextRaw = [...selectedOptions.map((item) => item.raw), option.raw]
        emitChange(nextRaw as T[])
        updateInputValue('')
      } else {
        if (isAlreadySelected) {
          setIsOpen(false)
          return
        }
        emitChange(option.raw)
        updateInputValue(option.label)
        setIsOpen(false)
      }
    },
    [canSelectMore, emitChange, mode, selectedOptions, selectionMap, setIsOpen, updateInputValue]
  )

  const handleRemoveOption = useCallback(
    (valueToRemove: string) => {
      if (mode === 'single') {
        if (!selectedOptions.length) return
        if (selectedOptions[0].value === valueToRemove) {
          emitChange(null)
          updateInputValue('')
        }
        return
      }

      const filtered = selectedOptions.filter((option) => option.value !== valueToRemove)
      emitChange(filtered.map((option) => option.raw))
    },
    [emitChange, mode, selectedOptions, updateInputValue]
  )

  const handleClearSelection = useCallback(() => {
    emitChange(mode === 'multiple' ? ([] as T[]) : null)
    updateInputValue('')
  }, [emitChange, mode, updateInputValue])

  const handleSelectAll = useCallback(() => {
    if (mode !== 'multiple' || !allowSelectAll) {
      return
    }

    const existing = new Set(selectionMap.keys())
    const nextRaw = selectedOptions.map((option) => option.raw)

    for (const option of search.results) {
      if (option.disabled) continue
      if (existing.has(option.value)) continue
      if (maxSelections && nextRaw.length >= maxSelections) {
        break
      }
      nextRaw.push(option.raw)
      existing.add(option.value)
    }

    emitChange(nextRaw as T[])
  }, [
    allowSelectAll,
    emitChange,
    maxSelections,
    mode,
    search.results,
    selectedOptions,
    selectionMap,
  ])

  const handleClearAll = useCallback(() => {
    if (mode !== 'multiple' || !allowClearAll) {
      if (mode === 'single') {
        handleClearSelection()
      }
      return
    }
    emitChange([] as T[])
    updateInputValue('')
  }, [allowClearAll, emitChange, handleClearSelection, mode, updateInputValue])

  const isSelected = useCallback(
    (optionValue: string) => selectionMap.has(optionValue),
    [selectionMap]
  )

  const setSelection = useCallback(
    (nextValue: T | T[] | null) => {
      if (mode === 'multiple') {
        if (Array.isArray(nextValue)) {
          emitChange(nextValue as T[])
        } else if (nextValue) {
          emitChange([nextValue])
        } else {
          emitChange([] as T[])
        }
      } else {
        if (Array.isArray(nextValue)) {
          emitChange(nextValue[0] ?? null)
        } else {
          emitChange(nextValue ?? null)
        }
      }
    },
    [emitChange, mode]
  )

  return {
    mode,
    query: search.query,
    inputValue,
    setInputValue: updateInputValue,
    isOpen: isOpenState,
    setIsOpen,
    results: search.results,
    selectedOptions,
    isSearching: search.isSearching,
    error: search.error,
    canSelectMore,
    handleOptionSelect,
    handleRemoveOption,
    handleClearSelection,
    handleSelectAll,
    handleClearAll,
    isSelected,
    clearResults: search.clearResults,
    refreshResults: search.refresh,
    setSelection,
  }
}
