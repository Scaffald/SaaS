/**
 * InviteClientsModal - Modal for brokers to invite clients
 * Invite clients - email invite, manual creation, and manual user selection
 *
 * Modes:
 * - 'email': Traditional email invite (default)
 * - 'manual-create': Create a new manual user (placeholder)
 * - 'manual-select': Select from existing manual users to send invite
 */

import { useState, useCallback, useMemo } from 'react'
import { X, Mail, Copy, Loader2, Building2, HardHat, UserPlus, Users } from 'lucide-react'
import { Stack, Row, Text, Card, Input, Button } from '@scaffald/ui'
import { toast } from 'sonner'
import { createRelationshipInvitation } from '../../lib/relationshipInvitations'
import {
  ManualUserForm,
  type ManualUserFormData,
  type ManualUserRole,
} from '../ManualUsers/ManualUserForm'
import { ManualUserBadge } from '../ManualUsers'
import { trpc } from '../../lib/trpc'

interface InviteClientsModalProps {
  isOpen: boolean
  onClose: () => void
  brokerCode: string
  userId: string
  organizationId: string
  onInvitationSent: () => void
}

type InviteMode = 'email' | 'manual-create' | 'manual-select'

// Orange button styles for visibility
const orangeButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-orange-9)',
  color: 'white',
  border: 'none',
  fontWeight: 600,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  backgroundColor: 'var(--color-background)',
  fontSize: 14,
}

const clientTypeButtonStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 600,
  borderRadius: 8,
  border: 'none',
  backgroundColor: isSelected ? 'var(--color-orange-9)' : 'var(--color-gray-3)',
  color: isSelected ? 'white' : 'var(--color-text-muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
})

const modeButtonStyle = (isSelected: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 500,
  borderRadius: 8,
  border: `1px solid ${isSelected ? 'var(--color-orange-8)' : 'var(--color-border)'}`,
  backgroundColor: isSelected ? 'var(--color-orange-2)' : 'transparent',
  color: isSelected ? 'var(--color-orange-11)' : 'var(--color-text-muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
})

export default function InviteClientsModal({
  isOpen,
  onClose,
  brokerCode,
  userId,
  organizationId,
  onInvitationSent,
}: InviteClientsModalProps) {
  // Mode state
  const [inviteMode, setInviteMode] = useState<InviteMode>('email')

  // Client type for both email and manual create modes
  const [inviteClientType, setInviteClientType] = useState<'manager' | 'subcontractor'>('manager')

  // Email invite form state
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    name: '',
    company: '',
    phone: '',
  })
  const [sendingInvite, setSendingInvite] = useState(false)

  // Manual user creation state
  const [creatingManualUser, setCreatingManualUser] = useState(false)

  // Manual user selection state
  const [selectedManualUserId, setSelectedManualUserId] = useState<string | null>(null)

  // Fetch manual users for selection mode
  const { data: manualUsersData, refetch: refetchManualUsers } = trpc.manualUsers.list.useQuery(
    { limit: 100 },
    { enabled: isOpen && inviteMode === 'manual-select' }
  )
  const manualUsers = manualUsersData?.users || []

  // Filter manual users to only show client types (manager/contractor)
  const clientManualUsers = useMemo(() => {
    return manualUsers.filter(
      (u) => u.user_type === 'gc' || u.user_type === 'contractor' || u.user_type === 'manager'
    )
  }, [manualUsers])

  // Create manual user mutation
  const createManualUserMutation = trpc.manualUsers.create.useMutation({
    onSuccess: (data) => {
      toast.success('Client added successfully!', {
        description: `${data.name} has been added to your clients.`,
      })
      refetchManualUsers()
      // Reset to select mode to show the newly created user
      setInviteMode('manual-select')
      onInvitationSent()
    },
    onError: (err) => {
      console.error('[InviteClientsModal] Error creating manual user:', err)
      toast.error('Failed to add client. Please try again.')
    },
    onSettled: () => {
      setCreatingManualUser(false)
    },
  })

  // Get selected manual user details
  const selectedManualUser = selectedManualUserId
    ? clientManualUsers.find((u) => u.id === selectedManualUserId)
    : null

  // Handle manual user form submission - must be defined before early return
  const handleManualUserSubmit = useCallback(
    async (data: ManualUserFormData) => {
      if (!userId || !organizationId) {
        toast.error('Unable to add client. Please ensure you are logged in.')
        return
      }

      setCreatingManualUser(true)

      // Map the form role to the backend userType
      // For brokers adding clients: 'manager' stays 'manager', 'contractor' stays 'contractor'
      const userType = data.role as 'manager' | 'contractor'

      createManualUserMutation.mutate({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        company: data.company || undefined,
        userType,
        organizationId,
        sendInvitation: data.sendInvitation,
      })
    },
    [userId, organizationId, createManualUserMutation]
  )

  // Early return AFTER all hooks are defined
  if (!isOpen) return null

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId || !organizationId) {
      toast.error('Unable to send invitation. Please ensure you are logged in.')
      return
    }

    if (!inviteFormData.email || !inviteFormData.name) {
      toast.error('Client email and name are required')
      return
    }

    setSendingInvite(true)

    try {
      const invitation = await createRelationshipInvitation({
        inviterOrgId: organizationId,
        inviterUserId: userId,
        inviterType: 'broker',
        inviteeEmail: inviteFormData.email.trim(),
        inviteeName: inviteFormData.name.trim(),
        inviteeCompany: inviteFormData.company.trim(),
        inviteePhone: inviteFormData.phone.trim(),
        inviteeType: inviteClientType,
        connectionMethod: 'both',
      })

      toast.success('Client invitation sent!', {
        description: `${inviteFormData.name} can connect using code ${invitation.relationship_code}`,
      })

      setInviteFormData({
        email: '',
        name: '',
        company: '',
        phone: '',
      })

      onInvitationSent()
    } catch (error) {
      console.error('[InviteClientsModal] Error sending invitation:', error)
      toast.error('Failed to send invitation. Please try again.')
    } finally {
      setSendingInvite(false)
    }
  }

  // Handle sending invite to selected manual user
  const handleSendToManualUser = async () => {
    if (!selectedManualUser) {
      toast.error('Please select a client first')
      return
    }

    if (!selectedManualUser.email) {
      toast.error(
        'Selected client has no email address. Please add an email to send an invitation.'
      )
      return
    }

    setSendingInvite(true)

    try {
      const clientType =
        selectedManualUser.user_type === 'gc' || selectedManualUser.user_type === 'manager'
          ? 'manager'
          : 'subcontractor'

      const invitation = await createRelationshipInvitation({
        inviterOrgId: organizationId,
        inviterUserId: userId,
        inviterType: 'broker',
        inviteeEmail: selectedManualUser.email,
        inviteeName: selectedManualUser.name || 'Client',
        inviteeCompany: selectedManualUser.company || '',
        inviteePhone: selectedManualUser.phone || '',
        inviteeType: clientType,
        connectionMethod: 'both',
      })

      toast.success('Invitation sent!', {
        description: `${selectedManualUser.name} can connect using code ${invitation.relationship_code}`,
      })

      setSelectedManualUserId(null)
      onInvitationSent()
    } catch (error) {
      console.error('[InviteClientsModal] Error sending invitation to manual user:', error)
      toast.error('Failed to send invitation. Please try again.')
    } finally {
      setSendingInvite(false)
    }
  }

  const copyBrokerCode = () => {
    if (!brokerCode) return
    navigator.clipboard.writeText(brokerCode)
    toast.success('Broker code copied to clipboard')
  }

  const handleModeChange = (mode: InviteMode) => {
    setInviteMode(mode)
    setSelectedManualUserId(null)
  }

  // Map client type to ManualUserRole for the form
  const getManualUserRole = (): ManualUserRole => {
    return inviteClientType === 'manager' ? 'manager' : 'contractor'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack gap={4}>
            <Text size="lg" weight="bold" style={{ color: 'var(--color-text)' }}>
              Add Clients
            </Text>
            <Text size="sm" muted>
              Invite clients by email or add them manually
            </Text>
          </Stack>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          <Stack gap={24}>
            {/* Broker Code Display */}
            <Stack gap={8}>
              <Text size="sm" weight="medium" muted>
                Your Broker Code
              </Text>
              <Row gap={8} alignItems="center">
                <Card
                  style={{
                    backgroundColor: 'var(--color-orange-2)',
                    border: '1px solid var(--color-orange-6)',
                    borderRadius: 8,
                    padding: 12,
                    flex: 1,
                  }}
                >
                  <Text
                    size="lg"
                    weight="bold"
                    style={{
                      color: 'var(--color-orange-11)',
                      fontFamily: 'monospace',
                      textAlign: 'center',
                    }}
                  >
                    {brokerCode || 'Loading...'}
                  </Text>
                </Card>
                <Button
                  onPress={copyBrokerCode}
                  disabled={!brokerCode}
                  iconStart={Copy}
                  style={orangeButtonStyle}
                >
                  Copy
                </Button>
              </Row>
              <Text size="xs" muted>
                Share this code with clients so they can connect with you
              </Text>
            </Stack>

            {/* Mode Toggle */}
            <Stack gap={12} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
              <Text size="sm" weight="medium" muted>
                How would you like to add a client?
              </Text>
              <Row gap={8}>
                <button
                  type="button"
                  onClick={() => handleModeChange('email')}
                  style={modeButtonStyle(inviteMode === 'email')}
                >
                  <Mail size={16} />
                  Invite by Email
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('manual-create')}
                  style={modeButtonStyle(inviteMode === 'manual-create')}
                >
                  <UserPlus size={16} />
                  Add Manually
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('manual-select')}
                  style={modeButtonStyle(inviteMode === 'manual-select')}
                >
                  <Users size={16} />
                  Select Added
                </button>
              </Row>
            </Stack>

            {/* Email Invite Mode */}
            {inviteMode === 'email' && (
              <Stack gap={12}>
                <form onSubmit={handleSendInvitation}>
                  <Stack gap={12}>
                    {/* Client Type Selector */}
                    <Stack gap={8}>
                      <Text size="xs" weight="medium" muted>
                        Client Type *
                      </Text>
                      <Row gap={8}>
                        <button
                          type="button"
                          onClick={() => setInviteClientType('manager')}
                          style={clientTypeButtonStyle(inviteClientType === 'manager')}
                        >
                          <Building2 size={16} />
                          Manager
                        </button>
                        <button
                          type="button"
                          onClick={() => setInviteClientType('subcontractor')}
                          style={clientTypeButtonStyle(inviteClientType === 'subcontractor')}
                        >
                          <HardHat size={16} />
                          Contractor
                        </button>
                      </Row>
                    </Stack>

                    <Stack gap={8}>
                      <Text size="xs" weight="medium" muted>
                        Client Email *
                      </Text>
                      <Input
                        placeholder="client@example.com"
                        value={inviteFormData.email}
                        onChange={(e) =>
                          setInviteFormData({ ...inviteFormData, email: e.target.value })
                        }
                        disabled={sendingInvite}
                        style={inputStyle}
                      />
                    </Stack>

                    <Stack gap={8}>
                      <Text size="xs" weight="medium" muted>
                        Client Name *
                      </Text>
                      <Input
                        placeholder="John Doe"
                        value={inviteFormData.name}
                        onChange={(e) =>
                          setInviteFormData({ ...inviteFormData, name: e.target.value })
                        }
                        disabled={sendingInvite}
                        style={inputStyle}
                      />
                    </Stack>

                    <Row gap={12}>
                      <Stack gap={8} style={{ flex: 1 }}>
                        <Text size="xs" weight="medium" muted>
                          Company (Optional)
                        </Text>
                        <Input
                          placeholder="Acme Construction"
                          value={inviteFormData.company}
                          onChange={(e) =>
                            setInviteFormData({ ...inviteFormData, company: e.target.value })
                          }
                          disabled={sendingInvite}
                          style={inputStyle}
                        />
                      </Stack>

                      <Stack gap={8} style={{ flex: 1 }}>
                        <Text size="xs" weight="medium" muted>
                          Phone (Optional)
                        </Text>
                        <Input
                          placeholder="(555) 123-4567"
                          value={inviteFormData.phone}
                          onChange={(e) =>
                            setInviteFormData({ ...inviteFormData, phone: e.target.value })
                          }
                          disabled={sendingInvite}
                          style={inputStyle}
                        />
                      </Stack>
                    </Row>

                    <button
                      type="submit"
                      disabled={sendingInvite || !inviteFormData.email || !inviteFormData.name}
                      style={{
                        ...orangeButtonStyle,
                        padding: '10px 16px',
                        borderRadius: 8,
                        cursor:
                          sendingInvite || !inviteFormData.email || !inviteFormData.name
                            ? 'not-allowed'
                            : 'pointer',
                        opacity:
                          sendingInvite || !inviteFormData.email || !inviteFormData.name ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontSize: 14,
                        width: '100%',
                      }}
                    >
                      {sendingInvite ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Mail size={16} />
                      )}
                      {sendingInvite ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </Stack>
                </form>
              </Stack>
            )}

            {/* Manual Create Mode */}
            {inviteMode === 'manual-create' && (
              <Stack gap={12}>
                {/* Client Type Selector for manual create */}
                <Stack gap={8}>
                  <Text size="xs" weight="medium" muted>
                    Client Type *
                  </Text>
                  <Row gap={8}>
                    <button
                      type="button"
                      onClick={() => setInviteClientType('manager')}
                      style={clientTypeButtonStyle(inviteClientType === 'manager')}
                    >
                      <Building2 size={16} />
                      Manager
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteClientType('subcontractor')}
                      style={clientTypeButtonStyle(inviteClientType === 'subcontractor')}
                    >
                      <HardHat size={16} />
                      Contractor
                    </button>
                  </Row>
                </Stack>

                <ManualUserForm
                  role={getManualUserRole()}
                  onSubmit={handleManualUserSubmit}
                  onCancel={onClose}
                  loading={creatingManualUser}
                />

                {/* Info box for manual users */}
                <Card
                  style={{
                    backgroundColor: 'var(--color-blue-2)',
                    border: '1px solid var(--color-blue-6)',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <Text size="xs" style={{ color: 'var(--color-blue-11)' }}>
                    Manually added clients are private to you. If they register later with the same
                    email, their accounts will be merged automatically.
                  </Text>
                </Card>
              </Stack>
            )}

            {/* Manual Select Mode */}
            {inviteMode === 'manual-select' && (
              <Stack gap={12}>
                <Text size="sm" weight="medium">
                  Select from your added clients
                </Text>

                {clientManualUsers.length === 0 ? (
                  <Card
                    style={{
                      padding: 24,
                      backgroundColor: 'var(--color-gray-2)',
                      textAlign: 'center',
                      borderRadius: 8,
                    }}
                  >
                    <Stack alignItems="center" gap={12}>
                      <Users size={32} style={{ color: 'var(--color-text-muted)' }} />
                      <Text muted>No manually added clients yet.</Text>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => setInviteMode('manual-create')}
                        iconStart={UserPlus}
                      >
                        Add Your First Client
                      </Button>
                    </Stack>
                  </Card>
                ) : (
                  <>
                    <Stack gap={8} style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {clientManualUsers.map((user) => (
                        <Row
                          key={user.id}
                          onPress={() => setSelectedManualUserId(user.id)}
                          style={{
                            padding: 12,
                            border: `1px solid ${selectedManualUserId === user.id ? 'var(--color-orange-8)' : 'var(--color-border)'}`,
                            borderRadius: 8,
                            backgroundColor:
                              selectedManualUserId === user.id
                                ? 'var(--color-orange-2)'
                                : 'transparent',
                            cursor: 'pointer',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <input
                            type="radio"
                            checked={selectedManualUserId === user.id}
                            onChange={() => setSelectedManualUserId(user.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <Stack style={{ flex: 1 }}>
                            <Row alignItems="center" gap={8}>
                              <Text weight="medium">{user.name}</Text>
                              <ManualUserBadge size="sm" showTooltip={false} />
                            </Row>
                            {user.email ? (
                              <Text size="xs" muted>
                                {user.email}
                              </Text>
                            ) : (
                              <Text size="xs" style={{ color: 'var(--color-orange-11)' }}>
                                No email - cannot send invitation
                              </Text>
                            )}
                            {user.company && (
                              <Text size="xs" muted>
                                {user.company}
                              </Text>
                            )}
                          </Stack>
                          <Text
                            size="xs"
                            style={{
                              padding: '2px 8px',
                              backgroundColor:
                                user.user_type === 'gc' || user.user_type === 'manager'
                                  ? 'var(--color-blue-2)'
                                  : 'var(--color-green-2)',
                              color:
                                user.user_type === 'gc' || user.user_type === 'manager'
                                  ? 'var(--color-blue-11)'
                                  : 'var(--color-green-11)',
                              borderRadius: 4,
                            }}
                          >
                            {user.user_type === 'gc' || user.user_type === 'manager'
                              ? 'Manager'
                              : 'Contractor'}
                          </Text>
                        </Row>
                      ))}
                    </Stack>

                    <Button
                      onPress={handleSendToManualUser}
                      disabled={!selectedManualUser || !selectedManualUser.email || sendingInvite}
                      iconStart={sendingInvite ? Loader2 : Mail}
                      style={{
                        ...orangeButtonStyle,
                        width: '100%',
                        opacity:
                          !selectedManualUser || !selectedManualUser.email || sendingInvite
                            ? 0.5
                            : 1,
                      }}
                    >
                      {sendingInvite ? 'Sending...' : 'Send Invitation to Selected Client'}
                    </Button>

                    <Row justifyContent="center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => setInviteMode('manual-create')}
                        iconStart={UserPlus}
                      >
                        Add Another Client
                      </Button>
                    </Row>
                  </>
                )}
              </Stack>
            )}
          </Stack>
        </div>
      </div>
    </div>
  )
}
