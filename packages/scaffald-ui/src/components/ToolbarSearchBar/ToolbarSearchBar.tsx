/**
 * ToolbarSearchBar — iOS 26 glassmorphic search bar
 *
 * A search input with glass background, search icon, optional microphone,
 * and clear button. Used inside toolbars and search accessories.
 *
 * @example
 * ```tsx
 * <ToolbarSearchBar
 *   value={query}
 *   onChangeText={setQuery}
 *   placeholder="Search"
 * />
 * ```
 */

import { useState, useRef, useCallback } from 'react'
import type React from 'react'
import { View, TextInput, Pressable } from 'react-native'
import { Text } from '../Typography'
import type { ToolbarSearchBarProps } from './ToolbarSearchBar.types'
import { getToolbarSearchBarStyles } from './ToolbarSearchBar.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'

export function ToolbarSearchBar({
  value = '',
  onChangeText,
  placeholder = 'Search',
  onFocus,
  onBlur,
  onCancel,
  showMicrophone = true,
  showClear = true,
  active,
  style,
  testID,
}: ToolbarSearchBarProps): React.ReactElement {
  const { theme } = useThemeContext()
  const styles = useStyles(getToolbarSearchBarStyles, [theme] as const)
  const inputRef = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState(false)

  const isActive = active ?? isFocused
  const hasValue = value.length > 0

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    onFocus?.()
  }, [onFocus])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    onBlur?.()
  }, [onBlur])

  const handleClear = useCallback(() => {
    onChangeText?.('')
    inputRef.current?.focus()
  }, [onChangeText])

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.row}>
        {/* Search icon */}
        <View style={styles.searchIcon}>
          <Text style={{ fontSize: 16, color: styles.iconColor }}>⌕</Text>
        </View>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={styles.placeholderColor}
          style={styles.input}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityRole="search"
          accessibilityLabel={placeholder}
        />

        {/* Trailing icons */}
        <View style={styles.trailingIcons}>
          {showClear && hasValue && (
            <Pressable
              style={styles.iconButton}
              onPress={handleClear}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 14, color: styles.iconColor }}>✕</Text>
            </Pressable>
          )}

          {showMicrophone && !hasValue && (
            <View style={styles.iconButton}>
              <Text style={{ fontSize: 16, color: styles.iconColor }}>🎤</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
