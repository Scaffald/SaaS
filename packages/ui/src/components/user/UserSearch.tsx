import { useState, useEffect } from 'react'
import { YStack, XStack, Text, Input, Spinner } from 'tamagui'
import { api } from '@app/core/utils/api'
import { useDebounce } from '@app/core/utils/useDebounce'

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
  const selectedUser = value
    ? (data?.users || []).find((u: User) => u.id === value)
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
  }, [value, selectedUser])

  const getUserDisplayName = (user: User): string => {
    if (user.first_name || user.last_name) {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
      return name ? `${name} (${user.username})` : user.username
    }
    return user.display_name || user.username
  }

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
    showResults &&
    debouncedSearch.length >= 2 &&
    (filteredUsers.length > 0 || isLoading)

  return (
    <YStack gap="$2" position="relative" width="100%">
      <XStack
        gap="$2"
        items="center"
        borderWidth={1}
        borderColor={error ? '$red8' : '$borderColor'}
        rounded="$4"
        bg="$background"
        px="$3"
        py="$2"
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
          bg="transparent"
          fontSize="$4"
        />
        {isLoading && <Spinner size="small" />}
        {searchTerm && !isLoading && (
          <Text
            fontSize="$3"
            color="$color10"
            cursor="pointer"
            onPress={handleClear}
            px="$2"
          >
            ✕
          </Text>
        )}
      </XStack>

      {showDropdown && (
        <YStack
          position="absolute"
          t="100%"
          l={0}
          r={0}
          mt="$1"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$3"
          bg="$background"
          maxH={300}
          overflow="scroll"
          z={1000}
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.1}
          shadowRadius={4}
        >
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user: User) => {
              const userName = getUserDisplayName(user)
              return (
                <XStack
                  key={user.id}
                  p="$3"
                  gap="$2"
                  hoverStyle={{
                    bg: '$backgroundHover',
                  }}
                  pressStyle={{
                    bg: '$backgroundPress',
                  }}
                  cursor="pointer"
                  onPress={() => handleSelect(user)}
                >
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$3" fontWeight="600">
                      {user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : user.display_name || user.username}
                    </Text>
                    <Text fontSize="$2" color="$color11">
                      @{user.username}
                    </Text>
                  </YStack>
                </XStack>
              )
            })
          ) : isLoading ? (
            <YStack p="$4" items="center">
              <Text color="$color11">Searching...</Text>
            </YStack>
          ) : null}
        </YStack>
      )}

      {debouncedSearch.length >= 2 &&
        !isLoading &&
        filteredUsers.length === 0 &&
        showResults && (
          <YStack
            position="absolute"
            t="100%"
            l={0}
            r={0}
            mt="$1"
            borderWidth={1}
            borderColor="$borderColor"
            rounded="$3"
            bg="$background"
            p="$3"
            z={1000}
          >
            <Text fontSize="$3" color="$color11">
              No users found for "{debouncedSearch}"
            </Text>
          </YStack>
        )}

      {error && (
        <Text fontSize="$2" color="$red10">
          {error}
        </Text>
      )}
    </YStack>
  )
}

