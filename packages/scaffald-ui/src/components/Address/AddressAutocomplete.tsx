/**
 * AddressAutocomplete – input with address suggestions dropdown.
 * Provider-agnostic: pass a GeocodingProvider (e.g. from your Mapbox adapter).
 * On web, the dropdown is rendered via a portal into document.body so it always stacks on top.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { View, ScrollView, Pressable, Text, type ViewStyle } from 'react-native'
import { Input } from '../Input'
import { useAddressAutocomplete } from './useAddressAutocomplete'
import type { AddressAutocompleteProps, AddressResult } from './Address.types'
import { Platform } from '../../platform/Platform'
import { useHoverState } from '../../platform/web/useHoverState'

const DROPDOWN_Z = 2147483647

function getCreatePortal(): typeof import('react-dom').createPortal | null {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null
  try {
    return require('react-dom').createPortal
  } catch {
    return null
  }
}

function ResultItem({
  address,
  onSelect,
}: {
  address: AddressResult
  onSelect: () => void
}) {
  const { isHovered, hoverProps } = useHoverState()
  return (
    <Pressable
      onPress={onSelect}
      {...hoverProps}
      style={({ pressed }) => ({
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor:
          pressed || isHovered ? '#f3f4f6' : 'transparent',
      })}
    >
      <Text style={{ fontSize: 14, color: '#111827' }}>{address.formattedAddress}</Text>
    </Pressable>
  )
}

export function AddressAutocomplete({
  value: controlledValue,
  onAddressSelect,
  onChange,
  placeholder = 'Search addresses...',
  error,
  errorMessage,
  disabled = false,
  provider,
  searchOptions,
  debounceMs = 300,
  minLength = 2,
  maxResults = 5,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(controlledValue ?? '')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<View>(null)
  const dropdownRef = useRef<View>(null)
  const [dropdownLayout, setDropdownLayout] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const {
    results,
    loading,
    error: searchError,
    search,
    clearResults,
  } = useAddressAutocomplete({
    provider: provider ?? null,
    searchOptions,
    debounceMs,
    minLength,
    maxResults,
  })

  const showList = open && (results.length > 0 || loading)

  useEffect(() => {
    if (controlledValue !== undefined) setInputValue(controlledValue)
  }, [controlledValue])

  useEffect(() => {
    if (!showList || !Platform.isWeb) {
      setDropdownLayout(null)
      return
    }
    const node = containerRef.current as unknown as HTMLElement | null
    if (node?.getBoundingClientRect) {
      const raf = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect()
        setDropdownLayout({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        })
      })
      return () => cancelAnimationFrame(raf)
    }
    setDropdownLayout(null)
  }, [showList])

  // Dismiss dropdown when user clicks outside (input or dropdown)
  useEffect(() => {
    if (!showList || !Platform.isWeb) return
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      const containerEl = containerRef.current as unknown as HTMLElement | null
      const dropdownEl = dropdownRef.current as unknown as HTMLElement | null
      const inContainer = containerEl?.contains?.(target)
      const inDropdown = dropdownEl?.contains?.(target)
      if (!inContainer && !inDropdown) {
        setOpen(false)
        clearResults()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [showList, clearResults])

  const handleChange = useCallback(
    (text: string) => {
      setInputValue(text)
      onChange?.(text)
      if (text.trim().length >= minLength) search(text)
      else clearResults()
      setOpen(true)
    },
    [minLength, search, clearResults, onChange]
  )

  const handleSelect = useCallback(
    (address: AddressResult) => {
      setInputValue(address.formattedAddress)
      onChange?.(address.formattedAddress)
      onAddressSelect?.(address)
      clearResults()
      setOpen(false)
    },
    [onChange, onAddressSelect, clearResults]
  )

  const displayError =
    typeof error === 'string' ? error : (errorMessage ?? searchError ?? undefined)

  const isWebFixed = Platform.isWeb && dropdownLayout && showList
  const shadowStyle =
    Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : {
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }
  const dropdownStyle = (isWebFixed
    ? {
        position: 'fixed' as const,
        top: dropdownLayout.top,
        left: dropdownLayout.left,
        width: dropdownLayout.width,
        height: 240,
        zIndex: DROPDOWN_Z,
        marginTop: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden' as const,
        ...shadowStyle,
      }
    : {
        position: 'absolute' as const,
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 4,
        maxHeight: 240,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden' as const,
        zIndex: DROPDOWN_Z,
        ...shadowStyle,
      }) as ViewStyle

  const dropdownContent = showList ? (
    <View ref={dropdownRef} style={dropdownStyle} collapsable={false}>
      {loading ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#3b82f6',
              borderTopColor: 'transparent',
            }}
          />
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled
          style={{ flexGrow: 0, maxHeight: 236 }}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {results.map((addr) => (
            <ResultItem
              key={addr.id}
              address={addr}
              onSelect={() => handleSelect(addr)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  ) : null

  const createPortal = getCreatePortal()
  const usePortal = Platform.isWeb && showList && dropdownLayout && createPortal && document?.body

  return (
    <View
      ref={containerRef}
      style={{
        position: 'relative',
        zIndex: 1,
        overflow: 'visible' as const,
      }}
    >
      <Input
        value={inputValue}
        onChangeText={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        error={Boolean(displayError)}
        errorMessage={displayError}
        disabled={disabled}
      />
      {usePortal && document.body
        ? createPortal(dropdownContent, document.body)
        : dropdownContent}
    </View>
  )
}
