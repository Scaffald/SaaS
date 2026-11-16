import { useOfficeListUsers } from '@scf/core/utils/office-users-sdk-hooks'
import { useDebounce } from '@scf/core/utils/useDebounce'
import type { OfficeUser } from '@scaffald/sdk'
import { useEffect, useId, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  AnchoredOverlay,
  Input,
  Text,
  Row,
  Stack,
  getMenuItemStyle,
  useListboxNavigation,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { X } from 'lucide-react-native'

export interface UserSearchProps {
  value?: string // user ID
  onUserSelect?: (userId: string, userName: string) => void
  onChange?: (userId: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
}

const getUserDisplayName = (user: OfficeUser): string => {
  if (user.first_name || user.last_name) {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
    return name ? `${name} (${user.username || ''})` : (user.username || '')
  }
  return user.display_name || user.username || ''
}

/**
 * UserSearch Component
 *
 * Autocomplete search for users (hiring managers, recruiters, etc.)
 * Debounced search with dropdown results
 *
 * @param value - Current user ID selected
 * @param onUserSelect - Callback when user is selected (userId, userName)
 * @param onChange - Callback when user ID changes
 * @param placeholder - Input placeholder text
 * @param error - Error message to display
 * @param disabled - Whether input is disabled
 */
export function UserSearch({
  value,
  onUserSelect,
  onChange,
  placeholder = 'Search for user...',
  error,
  disabled = false,
}: UserSearchProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserName, setSelectedUserName] = useState('')
  const [showResults, setShowResults] = useState(false)
  const anchorRef = useRef<View>(null)
  const listboxId = `user-results-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // Debounce search term for the server search
  const debouncedSearch = useDebounce(searchTerm, 300)
  // The field shows the chosen user's name; that is not a new search.
  const query = debouncedSearch.trim()
  const searching = query.length >= 2 && query !== selectedUserName

  // Search on the server (#1343). This used to fetch the 50 newest users and
  // filter them here, so anyone older could not be found.
  const { data, isLoading } = useOfficeListUsers({
    search: query,
    limit: 20,
    enabled: searching,
  })
  const filteredUsers: OfficeUser[] = searching ? (data?.users ?? []) : []

  // Name the saved user (edit mode) by id: they need not match any search.
  const { data: selectedData } = useOfficeListUsers({
    ids: value ? [value] : [],
    enabled: Boolean(value),
  })
  const selectedUser = value
    ? ((selectedData?.users ?? []).find((u: OfficeUser) => u.id === value) ?? null)
    : null

  // Update display name when value changes (edit mode)
  useEffect(() => {
    if (value && selectedUser) {
      const userName = getUserDisplayName(selectedUser)
      // Only update if the display name has changed to avoid loops
      if (userName !== selectedUserName) {
        setSelectedUserName(userName)
        setSearchTerm(userName)
      }
    } else if (!value && selectedUserName) {
      setSelectedUserName('')
      setSearchTerm('')
    }
  }, [value, selectedUser, selectedUserName])

  const handleSelect = (user: OfficeUser) => {
    const userName = getUserDisplayName(user)
    setSearchTerm(userName)
    setSelectedUserName(userName)
    setShowResults(false)
    onUserSelect?.(user.id, userName)
    onChange?.(user.id)
  }

  const handleInputChange = (text: string) => {
    setSearchTerm(text)
    setShowResults(true)
    if (!text) {
      setSelectedUserName('')
      onChange?.('')
      onUserSelect?.('', '')
    }
  }

  const handleInputFocus = () => {
    if (searchTerm.length >= 2 || filteredUsers.length > 0) {
      setShowResults(true)
    }
  }

  const handleInputBlur = () => {
    // Delay to allow click on results
    setTimeout(() => setShowResults(false), 200)
  }

  const handleClear = () => {
    setSearchTerm('')
    setSelectedUserName('')
    setShowResults(false)
    onChange?.('')
    onUserSelect?.('', '')
  }

  const showDropdown =
    showResults && searching && (filteredUsers.length > 0 || isLoading)
  const showNoResults =
    showResults && searching && !isLoading && filteredUsers.length === 0
  const menuOpen = showDropdown || showNoResults
  const nav = useListboxNavigation({
    id: listboxId,
    itemCount: filteredUsers.length,
    open: menuOpen,
    onSelectIndex: (index) => {
      const user = filteredUsers[index]
      if (user) handleSelect(user)
    },
    onClose: () => setShowResults(false),
  })

  return (
    <Stack gap={8} style={{ position: 'relative', width: '100%' }}>
      {/* One Input with its own trailing clear button. A bordered Row around a
          full-width Input overflowed, and the × landed outside the field (#1335).
          While a search runs, the menu says "Searching…". */}
      <View ref={anchorRef}>
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          error={!!error}
          iconEnd={searchTerm && !disabled ? X : undefined}
          iconEndOnPress={searchTerm && !disabled ? handleClear : undefined}
          iconEndAccessibilityLabel="Clear"
          {...nav.inputProps}
        />
      </View>

      {/* Results menu (or "no users found") — portalled above the page on web (#1330) */}
      <AnchoredOverlay
        anchorRef={anchorRef}
        open={menuOpen}
        onRequestClose={() => setShowResults(false)}
        maxHeight={300}
        {...nav.listboxProps}
      >
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user: OfficeUser, index: number) => {
            return (
              <Pressable
                key={user.id}
                onPress={() => handleSelect(user)}
                {...nav.getOptionProps(index)}
                style={({ pressed }) =>
                  getMenuItemStyle(t, { active: nav.activeIndex === index, pressed })
                }
              >
                <Row gap={8}>
                  <Stack style={{ flex: 1 }} gap={4}>
                    <Text>
                      {user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : user.display_name || user.username}
                    </Text>
                    <Text color="secondary">@{user.username}</Text>
                  </Stack>
                </Row>
              </Pressable>
            )
          })
        ) : isLoading ? (
          <Stack padding={16} align="center">
            <Text color="secondary">Searching...</Text>
          </Stack>
        ) : (
          <Stack padding="sm">
            <Text color="secondary">No users found for "{debouncedSearch}"</Text>
          </Stack>
        )}
      </AnchoredOverlay>

      {error ? <Text style={{ color: colors.fg[t].error }}>{error}</Text> : null}
    </Stack>
  )
}
