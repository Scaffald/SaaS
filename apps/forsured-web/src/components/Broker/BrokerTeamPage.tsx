import { useState, useMemo, useEffect, useCallback } from 'react'
import { Users, UserPlus, Shield, Mail, Clock } from 'lucide-react'
import { Stack, Row, Text, H2, Card, Grid } from '@scaffald/ui'
import { useUsers } from '../../hooks/useUsers'
import { useClients } from '../../hooks/useClients'
import { useUserInvitations } from '../../hooks/useUserInvitations'
import { useUser } from '../../contexts/UserContext'
import { useAuth } from '../../contexts/AuthContext'
import { getUserOrganizationId } from '../../lib/supabase'
import Button from '../Common/Button'
import { DashboardSkeleton } from '../Common/SkeletonLoader'
import InviteTeamMemberModal from './InviteTeamMemberModal'
import PendingTeamInvitationsModal from './PendingTeamInvitationsModal'
import ErrorBoundary from '../Common/ErrorBoundary'

export default function BrokerTeamPage() {
  const { users, loading: usersLoading, fetchUsers } = useUsers()
  const { clients, loading: clientsLoading } = useClients()
  const { currentUser } = useUser()
  const { user } = useAuth()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isPendingInvitationsModalOpen, setIsPendingInvitationsModalOpen] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  // Use either currentUser or auth user ID - try both to catch invitations
  const userId = currentUser?.id || user?.id
  
  // Query invitations by both user ID and organization ID to catch all relevant invitations
  // Must be called before handlers that use fetchInvitations
  const { invitations, loading: invitationsLoading, fetchInvitations, resendInvitation } = useUserInvitations({
    status: 'pending',
    invitedBy: userId,
    organizationId: organizationId,
  })

  // Separate handler for opening the modal - completely isolated from modal internals
  const handleOpenInviteModal = useCallback(() => {
    setIsInviteModalOpen(true)
  }, [])

  // Separate handler for closing the modal - isolated from modal internals
  const handleCloseInviteModal = useCallback(() => {
    setIsInviteModalOpen(false)
  }, [])

  // Separate handler for modal success - isolated from modal internals
  // Must be defined after fetchInvitations is available from the hook
  const handleInviteSuccess = useCallback(() => {
    fetchUsers()
    fetchInvitations()
    setIsInviteModalOpen(false)
  }, [fetchUsers, fetchInvitations])

  // Fetch organization ID - this is the broker's organization
  // When inviting team members, they will join this same organization
  useEffect(() => {
    async function fetchOrg() {
      const userId = currentUser?.id || user?.id
      if (userId) {
        try {
          const orgId = await getUserOrganizationId(userId)
          setOrganizationId(orgId)
        } catch (error) {
          console.error('[BrokerTeamPage] Error fetching organization:', error)
        }
      }
    }
    fetchOrg()
  }, [currentUser?.id, user?.id])

  const brokerUsers = users.filter((u) => u.role === 'broker')
  const adminUsers = brokerUsers.filter((u) => u.broker_role === 'admin')
  const workerUsers = brokerUsers.filter((u) => u.broker_role === 'worker')

  // Filter invitations for broker role and pending status
  const brokerInvitations = useMemo(() => {
    console.log('[BrokerTeamPage] All invitations:', invitations)
    console.log('[BrokerTeamPage] User ID:', userId)
    const filtered = invitations.filter((inv) => {
      const isBroker = inv.role === 'broker'
      const isPending = inv.status === 'pending'
      console.log('[BrokerTeamPage] Invitation:', {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        invited_by: inv.invited_by,
        isBroker,
        isPending,
      })
      return isBroker && isPending
    })
    console.log('[BrokerTeamPage] Filtered broker invitations:', filtered)
    return filtered
  }, [invitations, userId])

  if (usersLoading || clientsLoading || invitationsLoading) {
    return <DashboardSkeleton />
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background)',
    borderRadius: 12,
    padding: 24,
    border: '1px solid var(--color-border)',
  }

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    backgroundColor: `var(--color-${color}-3)`,
    padding: 12,
    borderRadius: 8,
  })

  return (
    <Stack gap={24}>
      <Row alignItems="center" justifyContent="flex-end">
        <Button color="primary" iconStart={UserPlus} onPress={handleOpenInviteModal}>
          Invite Team Member
        </Button>
      </Row>

      <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={24}>
        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text size="sm" muted>
                Total Team Members
              </Text>
              <Text size="2xl" weight="bold" style={{ marginTop: 4 }}>
                {brokerUsers.length}
              </Text>
            </Stack>
            <div style={iconBoxStyle('blue')}>
              <Users size={24} style={{ color: 'var(--color-blue-10)' }} />
            </div>
          </Row>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text size="sm" muted>
                Administrators
              </Text>
              <Text
                size="2xl"
                weight="bold"
                style={{ color: 'var(--color-purple-10)', marginTop: 4 }}
              >
                {adminUsers.length}
              </Text>
            </Stack>
            <div style={iconBoxStyle('purple')}>
              <Shield size={24} style={{ color: 'var(--color-purple-10)' }} />
            </div>
          </Row>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text size="sm" muted>
                Workers
              </Text>
              <Text
                size="2xl"
                weight="bold"
                style={{ color: 'var(--color-blue-10)', marginTop: 4 }}
              >
                {workerUsers.length}
              </Text>
            </Stack>
            <div style={iconBoxStyle('blue')}>
              <Users size={24} style={{ color: 'var(--color-blue-10)' }} />
            </div>
          </Row>
        </Card>

        {/* Pending Invitations Card - Clickable */}
        <div
          style={{
            ...cardStyle,
            cursor: brokerInvitations.length > 0 ? 'pointer' : 'default',
            border: brokerInvitations.length > 0
              ? '1px solid var(--color-yellow-6)'
              : '1px solid var(--color-border)',
            transition: 'all 0.15s ease',
          }}
          onClick={() => brokerInvitations.length > 0 && setIsPendingInvitationsModalOpen(true)}
          onMouseEnter={(e) => {
            if (brokerInvitations.length > 0) {
              e.currentTarget.style.borderColor = 'var(--color-yellow-8)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (brokerInvitations.length > 0) {
              e.currentTarget.style.borderColor = 'var(--color-yellow-6)'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text size="sm" muted>
                Pending Invitations
              </Text>
              <Text
                size="2xl"
                weight="bold"
                style={{ color: 'var(--color-yellow-10)', marginTop: 4 }}
              >
                {brokerInvitations.length}
              </Text>
            </Stack>
            <div style={iconBoxStyle('yellow')}>
              <Clock size={24} style={{ color: 'var(--color-yellow-10)' }} />
            </div>
          </Row>
          <Text size="sm" muted style={{ marginTop: 8 }}>
            {brokerInvitations.length === 0
              ? 'No pending invites'
              : brokerInvitations.length === 1
                ? 'Click to view'
                : `Click to view all`}
          </Text>
        </div>
      </Grid>

      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
        }}
      >
        <Stack padding={24} style={{ borderBottom: '1px solid var(--color-border)' }}>
          <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
            Team Members
          </H2>
        </Stack>

        <Stack>
          {brokerUsers.map((user, index) => (
            <Stack
              key={user.id}
              padding={24}
              style={{
                borderTop: index > 0 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <Row alignItems="center" justifyContent="space-between">
                <Row alignItems="center" gap={16}>
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: 'var(--color-blue-3)',
                      borderRadius: 9999,
                    }}
                  >
                    <Text size="lg" weight="semibold" style={{ color: 'var(--color-blue-10)' }}>
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </Text>
                  </Stack>
                  <Stack>
                    <Text size="md" weight="semibold">
                      {user.name}
                    </Text>
                    <Row alignItems="center" gap={16} style={{ marginTop: 4 }}>
                      <Row alignItems="center" gap={4}>
                        <Mail size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <Text size="sm" muted>
                          {user.email}
                        </Text>
                      </Row>
                      <Text
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 2,
                          paddingBottom: 2,
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          border: '1px solid',
                          backgroundColor:
                            user.broker_role === 'admin'
                              ? 'var(--color-purple-2)'
                              : 'var(--color-blue-2)',
                          color:
                            user.broker_role === 'admin'
                              ? 'var(--color-purple-11)'
                              : 'var(--color-blue-11)',
                          borderColor:
                            user.broker_role === 'admin'
                              ? 'var(--color-purple-6)'
                              : 'var(--color-blue-6)',
                        }}
                      >
                        {user.broker_role === 'admin' ? 'Administrator' : 'Worker'}
                      </Text>
                    </Row>
                  </Stack>
                </Row>

                <Row alignItems="center" gap={8}>
                  <Button variant="ghost" color="gray" size="sm">
                    Edit Access
                  </Button>
                  <Button variant="ghost" color="gray" size="sm">
                    View Activity
                  </Button>
                </Row>
              </Row>

              <Stack style={{ marginTop: 16, paddingLeft: 64 }}>
                <Stack
                  style={{
                    backgroundColor: 'var(--color-gray-2)',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <Text size="xs" weight="medium" muted style={{ marginBottom: 8 }}>
                    CLIENT ASSIGNMENTS
                  </Text>
                  <Row gap={8} style={{ flexWrap: 'wrap' }}>
                    {clients.slice(0, 3).map((client) => (
                      <Text
                        key={client.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      >
                        {client.company_name}
                      </Text>
                    ))}
                    {clients.length > 3 && (
                      <Text
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: 'var(--color-blue-2)',
                          color: 'var(--color-blue-11)',
                        }}
                      >
                        +{clients.length - 3} more
                      </Text>
                    )}
                  </Row>
                </Stack>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Card>

      {brokerUsers.length === 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 48,
          }}
        >
          <Stack alignItems="center">
            <Users size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 16 }} />
            <Text weight="medium" style={{ marginBottom: 8 }}>
              No team members yet
            </Text>
            <Text size="sm" muted style={{ marginBottom: 16 }}>
              Invite team members to collaborate
            </Text>
            <Button color="primary" iconStart={UserPlus} onPress={handleOpenInviteModal}>
              Invite Team Member
            </Button>
          </Stack>
        </Card>
      )}

      {/* Invite Team Member Modal */}
      <ErrorBoundary>
        <InviteTeamMemberModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          onSuccess={handleInviteSuccess}
          organizationId={organizationId}
        />
      </ErrorBoundary>

      {/* Pending Team Invitations Modal */}
      <PendingTeamInvitationsModal
        isOpen={isPendingInvitationsModalOpen}
        onClose={() => setIsPendingInvitationsModalOpen(false)}
        pendingInvitations={brokerInvitations.map((inv) => ({
          id: inv.id,
          email: inv.email,
          name: inv.name,
          role: inv.role,
          status: inv.status,
          invited_by: inv.invited_by,
          organization_id: inv.organization_id,
          created_at: inv.created_at,
        }))}
        onResendInvitation={async (invitationId: string) => {
          await resendInvitation(invitationId)
          fetchInvitations()
        }}
      />
    </Stack>
  )
}
