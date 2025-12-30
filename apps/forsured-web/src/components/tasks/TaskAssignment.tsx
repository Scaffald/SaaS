/**
 * REQ-166: Task Management Workflow & UI
 * TaskAssignment component for user picker with search and filtering
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import type { User, UserRole } from '../../types'
import { User as UserIcon, ChevronDown, Check } from 'lucide-react'
import { YStack, XStack, Text, Input, Button, Card, SizableText, Spinner } from '@unicornlove/ui'

interface TaskAssignmentProps {
  users: User[]
  assignedUserId?: string
  onAssign: (userId: string) => void
  allowedRoles?: UserRole[]
  loading?: boolean
}

export const TaskAssignment: React.FC<TaskAssignmentProps> = ({
  users,
  assignedUserId,
  onAssign,
  allowedRoles,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const assignedUser = users.find((u) => u.id === assignedUserId)

  const filteredUsers = useMemo(() => {
    let filtered = users

    // Filter by allowed roles
    if (allowedRoles && allowedRoles.length > 0) {
      filtered = filtered.filter((user) => allowedRoles.includes(user.role))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.company.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [users, allowedRoles, searchQuery])

  const handleUserSelect = (userId: string) => {
    onAssign(userId)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleToggle = () => {
    if (!loading) {
      setIsOpen(!isOpen)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <YStack ref={dropdownRef} position="relative">
      <Button
        type="button"
        onPress={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={loading}
        variant="outlined"
        size="$3"
        paddingHorizontal="$4"
        paddingVertical="$2"
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
        opacity={loading ? 0.5 : 1}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <XStack alignItems="center" gap="$2" width="100%">
          {loading ? (
            <>
              <Spinner size="small" />
              <SizableText fontSize="$3" color="$color10">
                Loading...
              </SizableText>
            </>
          ) : assignedUser ? (
            <>
              <XStack alignItems="center" gap="$2" flex={1}>
                <YStack
                  width={32}
                  height={32}
                  borderRadius={9999}
                  backgroundColor="$blue10"
                  alignItems="center"
                  justifyContent="center"
                >
                  <SizableText fontSize="$3" fontWeight="500" color="white">
                    {assignedUser.name.charAt(0)}
                  </SizableText>
                </YStack>
                <YStack alignItems="flex-start">
                  <SizableText fontSize="$3" fontWeight="500" color="$color12">
                    {assignedUser.name}
                  </SizableText>
                  <SizableText fontSize="$1" color="$color10">
                    {assignedUser.role}
                  </SizableText>
                </YStack>
              </XStack>
              <ChevronDown size={16} color="var(--color10)" />
              <Text position="absolute" opacity={0} width={0} height={0}>
                Reassign task
              </Text>
            </>
          ) : (
            <>
              <UserIcon size={20} color="var(--color10)" />
              <SizableText fontSize="$3" color="$color10">
                Unassigned
              </SizableText>
              <ChevronDown size={16} color="var(--color10)" />
              <Text position="absolute" opacity={0} width={0} height={0}>
                Assign task
              </Text>
            </>
          )}
        </XStack>
      </Button>

      {isOpen && (
        <Card
          position="absolute"
          zIndex={10}
          mt="$2"
          width={320}
          backgroundColor="$background"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          elevation={4}
        >
          <YStack padding="$2" borderBottomWidth={1} borderColor="$borderColor">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              width="100%"
              padding="$2"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$2"
              fontSize="$3"
              autoFocus
            />
          </YStack>

          <YStack maxHeight={256} overflow="scroll" role="listbox">
            {users.length === 0 ? (
              <YStack padding="$4" alignItems="center">
                <SizableText fontSize="$3" color="$color10">
                  No users available
                </SizableText>
              </YStack>
            ) : filteredUsers.length === 0 ? (
              <YStack padding="$4" alignItems="center">
                <SizableText fontSize="$3" color="$color10">
                  No users found
                </SizableText>
              </YStack>
            ) : (
              filteredUsers.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  onPress={() => handleUserSelect(user.id)}
                  variant="outlined"
                  width="100%"
                  justifyContent="flex-start"
                  paddingHorizontal="$4"
                  paddingVertical="$3"
                  role="option"
                  aria-selected={user.id === assignedUserId}
                >
                  <XStack alignItems="center" gap="$3" width="100%">
                    <YStack
                      width={40}
                      height={40}
                      borderRadius={9999}
                      backgroundColor="$blue10"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <SizableText fontSize="$3" fontWeight="500" color="white">
                        {user.name.charAt(0)}
                      </SizableText>
                    </YStack>
                    <YStack flex={1} minWidth={0}>
                      <SizableText
                        fontSize="$3"
                        fontWeight="500"
                        color="$color12"
                        numberOfLines={1}
                      >
                        {user.name}
                      </SizableText>
                      <SizableText fontSize="$1" color="$color10" numberOfLines={1}>
                        {user.email}
                      </SizableText>
                      <SizableText fontSize="$1" color="$color10" textTransform="capitalize">
                        {user.role}
                      </SizableText>
                    </YStack>
                    {user.id === assignedUserId && <Check size={20} color="var(--blue10)" />}
                  </XStack>
                </Button>
              ))
            )}
          </YStack>
        </Card>
      )}
    </YStack>
  )
}
