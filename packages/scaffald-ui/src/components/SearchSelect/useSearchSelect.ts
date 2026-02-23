import { useState, useMemo, useCallback, useRef } from 'react'
import type { TextInput } from 'react-native'
import type { SearchSelectOption } from './SearchSelect.types'

export interface UseSearchSelectProps {
  options: SearchSelectOption[]
  value?: string | string[]
  onChange?: (value: any) => void
  multiple?: boolean
  searchable?: boolean
  disabled?: boolean
  filterFunction?: (option: SearchSelectOption, searchQuery: string) => boolean
}

export function useSearchSelect({
  options,
  value,
  onChange,
  multiple = false,
  searchable = true,
  disabled = false,
  filterFunction,
}: UseSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<TextInput>(null)

  // Normalize value to array for consistent handling
  const selectedValues = useMemo(() => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  }, [value])

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options

    const query = searchQuery.toLowerCase()

    if (filterFunction) {
      return options.filter((option) => filterFunction(option, searchQuery))
    }

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
    )
  }, [options, searchQuery, filterFunction])

  // Group options if they have group property
  const groupedOptions = useMemo(() => {
    const groups: Record<string, SearchSelectOption[]> = {}
    const ungrouped: SearchSelectOption[] = []

    filteredOptions.forEach((option) => {
      if (option.group) {
        if (!groups[option.group]) {
          groups[option.group] = []
        }
        groups[option.group].push(option)
      } else {
        ungrouped.push(option)
      }
    })

    return { groups, ungrouped }
  }, [filteredOptions])

  // Get display text for selected values
  const displayText = useMemo(() => {
    if (selectedValues.length === 0) return ''

    if (multiple && selectedValues.length > 1) {
      return `${selectedValues.length} selected`
    }

    const selectedOption = options.find((o) => o.value === selectedValues[0])
    return selectedOption?.label || ''
  }, [selectedValues, options, multiple])

  // Handle option selection
  const handleSelect = useCallback(
    (optionValue: string) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue]
        onChange?.(newValues)
      } else {
        onChange?.(optionValue)
        setIsOpen(false)
        setSearchQuery('')
      }
    },
    [multiple, selectedValues, onChange]
  )

  // Handle clear
  const handleClear = useCallback(() => {
    onChange?.(multiple ? [] : '')
    setSearchQuery('')
  }, [multiple, onChange])

  // Handle open/close
  const handleToggle = useCallback(() => {
    if (disabled) return
    setIsOpen((prev) => !prev)
    if (!isOpen && searchable) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [disabled, isOpen, searchable])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setSearchQuery('')
  }, [])

  return {
    // State
    isOpen,
    searchQuery,
    inputRef,
    selectedValues,
    filteredOptions,
    groupedOptions,
    displayText,

    // Setters
    setSearchQuery,
    setIsOpen,

    // Actions
    handleSelect,
    handleClear,
    handleToggle,
    handleClose,
  }
}
