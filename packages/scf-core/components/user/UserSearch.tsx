import { api } from '@scf/core/utils/api'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { useEffect, useState } from 'react'
import { Input, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

export interface UserSearchProps {
  value?: string // user ID
  onUserSelect?: (userId: string, userName: string) => void
  onChange?: (userId: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
}

interface User {
  id: string
  username: string
  display_name: string | null
  first_name: string
  last_name: string
  avatar_path: string | null
}

const getUserDisplayName = (user: User): string => {
  if (user.first_name || user.last_name) {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
    return name ? `${name} (${user.username})` : user.username
  }
  return user.display_name || user.username
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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserName, setSelectedUserName] = useState('')
  const [showResults, setShowResults] = useState(false)

  // Fetch all users (office.listUsers doesn't support search, so we filter client-side)
  const { data, isLoading } = api.office.listUsers.useQuery(undefined, {
    enabled: true, // Always fetch users for filtering
  })

  // Debounce search term for filtering
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Filter users based on search term
  const filteredUsers = (data?.users || []).filter((user: User) => {
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
  const selectedUser = value ? (data?.users || []).find((u: User) => u.id === value) : null

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

  const handleSelect = (user: User) => {
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
    <Stack gap={8} position="relative" width="100%">
      <Row
        gap={8}
        align="center"
        borderWidth={1}
        borderColor={error ? '$red8' : '$borderColor'}
        borderRadius={16}
        backgroundColor="$background"
        paddingHorizontal={12}
        paddingVertical={8}
        focusStyle={{
          borderColor: error ? '$red8' : '$color8',
        }}
      >
        <Input
          flex={1}
          placeholder={placeholder}
          value={searchTerm}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          borderWidth={0}
          backgroundColor="transparent"
        />
        {isLoading && <Spinner size="sm" />}
        {searchTerm && !isLoading && (
          <Text color="gray" cursor="pointer" onPress={handleClear} paddingHorizontal={8}>
            ✕
          </Text>
        )}
      </Row>

      {showDropdown && (
        <Stack
          position="absolute"
          top="100%"
          left={0}
          right={0}
          marginTop={4}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={12}
          backgroundColor="$background"
          maxHeight={300}
          overflow="scroll"
          zIndex={1000}
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.1}
          shadowRadius={4}
        >
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user: User) => {
              return (
                <Row
                  key={user.id}
                  padding={12}
                  gap={8}
                  hoverStyle={{
                    backgroundColor: '$backgroundHover',
                  }}
                  pressStyle={{
                    backgroundColor: '$backgroundPress',
                  }}
                  cursor="pointer"
                  onPress={() => handleSelect(user)}
                >
                  <Stack flex={1} gap={4}>
                    <Text>
                      {user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : user.display_name || user.username}
                    </Text>
                    <Text color="gray">@{user.username}</Text>
                  </Stack>
                </Row>
              )
            })
          ) : isLoading ? (
            <Stack padding={16} align="center">
              <Text color="gray">Searching...</Text>
            </Stack>
          ) : null}
        </Stack>
      )}

      {debouncedSearch.length >= 2 && !isLoading && filteredUsers.length === 0 && showResults && (
        <Stack
          position="absolute"
          top="100%"
          left={0}
          right={0}
          marginTop={4}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={12}
          backgroundColor="$background"
          padding={12}
          zIndex={1000}
        >
          <Text color="gray">No users found for "{debouncedSearch}"</Text>
        </Stack>
      )}

      {error && <Text color="$red10">{error}</Text>}
    </Stack>
  )
}
