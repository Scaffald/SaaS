/**
 * REQ-166: Task Management Workflow & UI
 * TaskAssignment component for user picker with search and filtering
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import type { User, UserRole } from '../../types'
import { User as UserIcon, ChevronDown, Check, Loader2 } from 'lucide-react'
import { Stack, Row, Text, Input, Button, Card } from '@unicornlove/beyond-ui'

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
    <Stack ref={dropdownRef} style={{ position: 'relative' }}>
      <Button
        type="button"
        onPress={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={loading}
        variant="outline"
        size="md"
        style={{
          paddingLeft: '16px',
          paddingRight: '16px',
          paddingTop: '8px',
          paddingBottom: '8px',
          backgroundColor: 'var(--color-background)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'var(--color-border)',
          borderRadius: '12px',
          opacity: loading ? 0.5 : 1,
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Row style={{ alignItems: 'center', gap: '8px', width: '100%' }}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <Text style={{ fontSize: '14px', color: 'var(--color-color10)' }}>
                Loading...
              </Text>
            </>
          ) : assignedUser ? (
            <>
              <Row style={{ alignItems: 'center', gap: '8px', flex: 1 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-blue10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>
                    {assignedUser.name.charAt(0)}
                  </Text>
                </div>
                <Stack style={{ alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-color12)' }}>
                    {assignedUser.name}
                  </Text>
                  <Text style={{ fontSize: '12px', color: 'var(--color-color10)' }}>
                    {assignedUser.role}
                  </Text>
                </Stack>
              </Row>
              <ChevronDown size={16} color="var(--color-color10)" />
              <span style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}>
                Reassign task
              </span>
            </>
          ) : (
            <>
              <UserIcon size={20} color="var(--color-color10)" />
              <Text style={{ fontSize: '14px', color: 'var(--color-color10)' }}>
                Unassigned
              </Text>
              <ChevronDown size={16} color="var(--color-color10)" />
              <span style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}>
                Assign task
              </span>
            </>
          )}
        </Row>
      </Button>

      {isOpen && (
        <Card
          style={{
            position: 'absolute',
            zIndex: 10,
            marginTop: '8px',
            width: '320px',
            backgroundColor: 'var(--color-background)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--color-border)',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Stack style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderRadius: '6px',
                fontSize: '14px',
              }}
              autoFocus
            />
          </Stack>

          <Stack style={{ maxHeight: '256px', overflow: 'auto' }} role="listbox">
            {users.length === 0 ? (
              <Stack style={{ padding: '16px', alignItems: 'center' }}>
                <Text style={{ fontSize: '14px', color: 'var(--color-color10)' }}>
                  No users available
                </Text>
              </Stack>
            ) : filteredUsers.length === 0 ? (
              <Stack style={{ padding: '16px', alignItems: 'center' }}>
                <Text style={{ fontSize: '14px', color: 'var(--color-color10)' }}>
                  No users found
                </Text>
              </Stack>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onPress={() => handleUserSelect(user.id)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'flex-start',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  role="option"
                  aria-selected={user.id === assignedUserId}
                >
                  <Row style={{ alignItems: 'center', gap: '12px', width: '100%' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-blue10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Text style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>
                        {user.name.charAt(0)}
                      </Text>
                    </div>
                    <Stack style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: 'var(--color-color12)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-color10)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.email}
                      </Text>
                      <Text style={{ fontSize: '12px', color: 'var(--color-color10)', textTransform: 'capitalize' }}>
                        {user.role}
                      </Text>
                    </Stack>
                    {user.id === assignedUserId && <Check size={20} color="var(--color-blue10)" />}
                  </Row>
                </button>
              ))
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
