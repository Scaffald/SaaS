/**
 * SearchAccessory — iOS 26 search bar with optional scope filter
 *
 * Combines a ToolbarSearchBar with an optional SegmentedControl for
 * scope filtering. Used in iPad navigation bars.
 *
 * @example
 * ```tsx
 * <SearchAccessory
 *   value={query}
 *   onChangeText={setQuery}
 *   scopes={[
 *     { label: 'All', value: 'all' },
 *     { label: 'Photos', value: 'photos' },
 *   ]}
 *   selectedScope={scope}
 *   onScopeChange={setScope}
 * />
 * ```
 */

import type React from 'react'
import { View } from 'react-native'
import { ToolbarSearchBar } from '../ToolbarSearchBar'
import { SegmentedControl } from '../SegmentedControl'
import type { SearchAccessoryProps } from './SearchAccessory.types'
import { getSearchAccessoryStyles } from './SearchAccessory.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'

export function SearchAccessory({
  value,
  onChangeText,
  placeholder,
  scopes,
  selectedScope,
  onScopeChange,
  showMicrophone,
  style,
  testID,
}: SearchAccessoryProps): React.ReactElement {
  const { theme } = useThemeContext()
  const styles = useStyles(getSearchAccessoryStyles, [theme] as const)

  const hasScopes = scopes != null && scopes.length > 0
  const selectedScopeIndex = hasScopes && selectedScope
    ? scopes!.findIndex((s) => s.value === selectedScope)
    : 0

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.row}>
        <View style={styles.searchWrapper}>
          <ToolbarSearchBar
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            showMicrophone={showMicrophone}
          />
        </View>

        {hasScopes && (
          <View style={styles.scopeWrapper}>
            <SegmentedControl
              segments={scopes!.map((s) => s.label)}
              selectedIndex={selectedScopeIndex >= 0 ? selectedScopeIndex : 0}
              onSelectionChange={(index) => {
                onScopeChange?.(scopes![index]!.value)
              }}
            />
          </View>
        )}
      </View>
    </View>
  )
}
