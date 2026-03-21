import { useOfficeListUsers } from '@scf/core/utils/office-users-sdk-hooks'
import { useDebounce } from '@scf/core/utils/useDebounce'
import type { OfficeUser } from '@scaffald/sdk'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { Input, Spinner, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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

  // Fetch all users (filter client-side)
  const { data, isLoading } = useOfficeListUsers()

  // Debounce search term for filtering
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Filter users based on search term
  const filteredUsers = (data?.users || []).filter((user: OfficeUser) => {
    if (!debouncedSearch || debouncedSearch.length < 2) return false

    const searchLower = debouncedSearch.toLowerCase()
    const firstName = (user.first_name || '').toLowerCase()
    const lastName = (user.last_name || '').toLowerCase()
    const username = (user.username || '').toLowerCase()
    const displayName = (user.display_name || '').toLowerCase()

    return (
      firstName.includes(searchLower) ||
      lastName.includes(searchLower) ||
      username.includes(searchLower) ||
      displayName.includes(searchLower) ||
      `${firstName} ${lastName}`.trim().includes(searchLower)
    )
  })

  // Get selected user details when value is provided (for edit mode)
  const selectedUser = value ? (data?.users || []).find((u: OfficeUser) => u.id === value) : null

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
    showResults && debouncedSearch.length >= 2 && (filteredUsers.length > 0 || isLoading)

  return (
    <Stack gap={8} style={{ position: 'relative', width: '100%' }}>
      <Row
        gap={8}
        align="center"
        style={{
          borderWidth: 1,
          borderColor: error ? colors.error[600] : colors.border[t].default,
          borderRadius: 16,
          backgroundColor: colors.bg[t].default,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Input
          style={{ flex: 1 }}
          placeholder={placeholder}
          value={searchTerm}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
        />
        {isLoading && <Spinner size="sm" />}
        {searchTerm && !isLoading && (
          <Text color="secondary" onPress={handleClear} style={{ paddingHorizontal: 8 }}>
            ✕
          </Text>
        )}
      </Row>

      {showDropdown && (
        <Stack
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            borderWidth: 1,
            borderColor: colors.border[t].default,
            borderRadius: 12,
            backgroundColor: colors.bg[t].default,
            maxHeight: 300,
            overflow: 'scroll',
            zIndex: 1000,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user: OfficeUser) => {
              return (
                <Pressable key={user.id} onPress={() => handleSelect(user)}>
                  <Row padding="sm" gap={8}>
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
          ) : null}
        </Stack>
      )}

      {debouncedSearch.length >= 2 && !isLoading && filteredUsers.length === 0 && showResults && (
        <Stack
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            borderWidth: 1,
            borderColor: colors.border[t].default,
            borderRadius: 12,
            backgroundColor: colors.bg[t].default,
            zIndex: 1000,
          }}
          padding="sm"
        >
          <Text color="secondary">No users found for "{debouncedSearch}"</Text>
        </Stack>
      )}

      {error && <Text style={{ color: colors.fg[t].error }}>{error}</Text>}
    </Stack>
  )
}
