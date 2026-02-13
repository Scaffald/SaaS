/**
 * TableHeader component
 * Table header with search input and action buttons
 *
 * @example
 * ```tsx
 * <TableHeader
 *   searchValue={searchValue}
 *   onSearchChange={setSearchValue}
 *   searchPlaceholder="Search..."
 *   actions={
 *     <>
 *       <Button>Add New</Button>
 *       <Button variant="outline">Export</Button>
 *     </>
 *   }
 * />
 * ```
 */

import { View, TextInput, StyleSheet } from 'react-native'
import { getTableStyles } from './Table.styles'

// Legacy component - TableHeaderProps moved to Table component
interface TableHeaderProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  actions?: React.ReactNode
  style?: any
}
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'

export function TableHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions,
  style,
}: TableHeaderProps) {
  const { theme } = useThemeContext()
  const styles = getTableStyles(theme)

  return (
    <View style={[styles.header, style]}>
      {/* Search Input */}
      {onSearchChange && (
        <View style={localStyles.searchContainer}>
          <TextInput
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.text[theme].tertiary}
            style={[
              localStyles.input,
              {
                color: colors.text[theme].primary,
                borderColor: colors.border[theme].default,
                backgroundColor: colors.bg[theme].default,
              },
            ]}
          />
        </View>
      )}

      {/* Action Buttons */}
      {actions && (
        <View style={localStyles.actionsContainer}>
          {actions}
        </View>
      )}
    </View>
  )
}

const localStyles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    minWidth: 263,
  },
  input: {
    height: 68,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: borderRadius.m,
    borderWidth: 1,
    ...typography.body,
    letterSpacing: 0,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
})
