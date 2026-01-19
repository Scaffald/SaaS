/**
 * REQ-166: Task Management Workflow & UI
 * REQ-12: Manual user indicators in task assignment
 * TaskAssignment component for user picker with search and filtering
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import type { User, UserRole } from '../../types'
import { User as UserIcon, ChevronDown, Check, Loader2, AlertTriangle } from 'lucide-react'
import { Stack, Row, Text, Input, Button, Card } from '@unicornlove/beyond-ui'
import { ManualUserBadge } from '../ManualUsers'

/**
 * Extended user type with manual user flag
 * REQ-12: Manual users need special indicators
 */
interface AssignableUser extends User {
  is_manually_created?: boolean
}

interface TaskAssignmentProps {
  users: AssignableUser[]
  assignedUserId?: string
  onAssign: (userId: string) => void
  allowedRoles?: UserRole[]
  loading?: boolean
  /** REQ-12: Require acknowledgment when assigning to manual users */
  requireManualUserAcknowledgment?: boolean
}

export const TaskAssignment: React.FC<TaskAssignmentProps> = ({
  users,
  assignedUserId,
  onAssign,
  allowedRoles,
  loading = false,
  requireManualUserAcknowledgment = true,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // REQ-12: Track pending manual user selection for acknowledgment
  const [pendingManualUserId, setPendingManualUserId] = useState<string | null>(null)
  const [manualUserAcknowledged, setManualUserAcknowledged] = useState(false)

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

  // REQ-12: Get pending manual user for warning display
  const pendingManualUser = pendingManualUserId
    ? filteredUsers.find((u) => u.id === pendingManualUserId)
    : null

  const handleUserSelect = (userId: string) => {
    const selectedUser = filteredUsers.find((u) => u.id === userId)

    // REQ-12: If selecting a manual user and acknowledgment is required
    if (
      selectedUser?.is_manually_created &&
      requireManualUserAcknowledgment &&
      !manualUserAcknowledged
    ) {
      setPendingManualUserId(userId)
      return // Don't close dropdown yet, show warning
    }

    // Proceed with assignment
    onAssign(userId)
    setIsOpen(false)
    setSearchQuery('')
    setPendingManualUserId(null)
    setManualUserAcknowledged(false)
  }

  // REQ-12: Confirm manual user assignment after acknowledgment
  const handleConfirmManualUserAssignment = () => {
    if (pendingManualUserId) {
      onAssign(pendingManualUserId)
      setIsOpen(false)
      setSearchQuery('')
      setPendingManualUserId(null)
      setManualUserAcknowledged(false)
    }
  }

  // REQ-12: Cancel manual user selection
  const handleCancelManualUserSelection = () => {
    setPendingManualUserId(null)
    setManualUserAcknowledged(false)
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
                  <Row style={{ alignItems: 'center', gap: '6px' }}>
                    <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-color12)' }}>
                      {assignedUser.name}
                    </Text>
                    {/* REQ-12: Show badge for manual users */}
                    {(assignedUser as AssignableUser).is_manually_created && (
                      <ManualUserBadge size="sm" showTooltip={false} />
                    )}
                  </Row>
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
            {/* REQ-12: Warning banner when manual user selected */}
            {pendingManualUser && (
              <Stack
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--color-orange-2)',
                  borderBottom: '1px solid var(--color-orange-6)',
                }}
              >
                <Row style={{ alignItems: 'flex-start', gap: '8px' }}>
                  <AlertTriangle
                    size={16}
                    style={{ color: 'var(--color-orange-10)', flexShrink: 0, marginTop: 2 }}
                  />
                  <Stack style={{ gap: '8px', flex: 1 }}>
                    <Text style={{ fontSize: '13px', color: 'var(--color-orange-11)' }}>
                      <strong>{pendingManualUser.name}</strong> is a manually added user and will
                      not receive task notifications.
                    </Text>
                    <Row style={{ alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="acknowledge-manual-user"
                        checked={manualUserAcknowledged}
                        onChange={(e) => setManualUserAcknowledged(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <label
                        htmlFor="acknowledge-manual-user"
                        style={{ fontSize: '12px', color: 'var(--color-orange-11)', cursor: 'pointer' }}
                      >
                        I understand this user won't be notified
                      </label>
                    </Row>
                    <Row style={{ gap: '8px', paddingTop: '4px' }}>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onPress={handleConfirmManualUserAssignment}
                        disabled={!manualUserAcknowledged}
                        style={{
                          opacity: manualUserAcknowledged ? 1 : 0.5,
                          fontSize: '12px',
                          padding: '4px 12px',
                        }}
                      >
                        Confirm Assignment
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onPress={handleCancelManualUserSelection}
                        style={{ fontSize: '12px', padding: '4px 12px' }}
                      >
                        Cancel
                      </Button>
                    </Row>
                  </Stack>
                </Row>
              </Stack>
            )}

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
                  onClick={() => handleUserSelect(user.id)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'flex-start',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    background:
                      user.id === pendingManualUserId
                        ? 'var(--color-orange-2)'
                        : 'none',
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
                      <Row style={{ alignItems: 'center', gap: '6px' }}>
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
                        {/* REQ-12: Badge for manual users in dropdown */}
                        {user.is_manually_created && <ManualUserBadge size="sm" showTooltip={false} />}
                      </Row>
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
