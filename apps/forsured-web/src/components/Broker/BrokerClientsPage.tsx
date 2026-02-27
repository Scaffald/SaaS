import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  TrendingUp,
  AlertTriangle,
  Shield,
  Users,
  Building2,
  HardHat,
  UserPlus,
  Clock,
} from 'lucide-react'
import { Stack, Row, Text, H1, Button, Grid, Card, CardContent, Avatar } from '@scaffald/ui'
import { EmptyState } from '../../ui'
import { useClients } from '../../hooks/useClients'
import { usePolicies } from '../../hooks/usePolicies'
import { useProjects } from '../../hooks/useProjects'
import { useCompliance } from '../../hooks/useCompliance'
import { useClientBrokerCounts } from '../../hooks/useClientBrokerCounts'
import { useAuth } from '../../contexts/AuthContext'
import ClientsTable from './ClientsTable'
import InviteClientsModal from './InviteClientsModal'
import PendingInvitationsModal from './PendingInvitationsModal'
import { DashboardSkeleton } from '../Common/SkeletonLoader'
import type { BrokerClient } from '../../types'
import { getUserOrganizationId } from '../../lib/supabase'
import { getUserInvitations, type RelationshipInvitation } from '../../lib/relationshipInvitations'
import { generateRelationshipCode } from '../../lib/connectionCodes'


type ClientTypeFilter = 'all' | 'manager' | 'subcontractor'

export default function BrokerClientsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<ClientTypeFilter>('all')

  // Pass broker's organizationId to get their connected clients (managers & subcontractors)
  const { clients, loading: clientsLoading } = useClients(organizationId || undefined)
  const { policies, loading: policiesLoading } = usePolicies()
  const { projects, loading: projectsLoading } = useProjects()
  const { complianceData, loading: complianceLoading } = useCompliance()

  // Get client organization IDs for broker count lookup
  const clientOrgIds = useMemo(() => clients.map((c) => c.id), [clients])
  const { brokerCounts, loading: brokerCountsLoading } = useClientBrokerCounts({
    organizationIds: clientOrgIds,
  })

  // Invitation state
  const [brokerCode, setBrokerCode] = useState<string>('')
  const [pendingInvitations, setPendingInvitations] = useState<RelationshipInvitation[]>([])
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isPendingInvitationsModalOpen, setIsPendingInvitationsModalOpen] = useState(false)

  // Fetch organization ID on mount
  useEffect(() => {
    async function fetchOrg() {
      if (user?.id) {
        const orgId = await getUserOrganizationId(user.id)
        setOrganizationId(orgId)
      }
    }
    fetchOrg()
  }, [user?.id])

  // Generate/fetch broker's BKR- code
  useEffect(() => {
    async function initBrokerCode() {
      if (!user?.id) return

      try {
        const code = generateRelationshipCode('BKR')
        setBrokerCode(code)

        const invitations = await getUserInvitations(user.id, 'pending')
        const clientInvites = invitations.filter(
          (inv) =>
            inv.inviter_type === 'broker' &&
            (inv.invitee_type === 'manager' || inv.invitee_type === 'subcontractor')
        )
        setPendingInvitations(clientInvites)
      } catch (error) {
        console.error('[BrokerClientsPage] Error initializing broker code:', error)
      }
    }
    initBrokerCode()
  }, [user?.id])

  const refreshPendingInvitations = async () => {
    if (user?.id) {
      const invitations = await getUserInvitations(user.id, 'pending')
      const clientInvites = invitations.filter(
        (inv) =>
          inv.inviter_type === 'broker' &&
          (inv.invitee_type === 'manager' || inv.invitee_type === 'subcontractor')
      )
      setPendingInvitations(clientInvites)
    }
  }

  // Calculate stats based on active filter
  const getClientStats = () => {
    const filteredByType =
      activeFilter === 'all'
        ? clients
        : activeFilter === 'manager'
          ? clients.filter((c) => c.client_type === 'general_contractor')
          : clients.filter((c) => c.client_type === 'subcontractor')

    const totalClients = filteredByType.length
    const activeClients = filteredByType.filter((c) => c.status === 'active').length
    const highRiskClients = filteredByType.filter((c) => c.risk_level === 'high').length
    const avgComplianceScore =
      filteredByType.reduce((acc, c) => acc + (c.compliance_score ?? 0), 0) / (totalClients || 1)

    // Counts by type (for filter badges)
    const managersCount = clients.filter((c) => c.client_type === 'general_contractor').length
    const contractorsCount = clients.filter((c) => c.client_type === 'subcontractor').length

    // Risk breakdown
    const lowRisk = filteredByType.filter((c) => c.risk_level === 'low').length
    const mediumRisk = filteredByType.filter((c) => c.risk_level === 'medium').length

    return {
      total: clients.length,
      filtered: totalClients,
      active: activeClients,
      highRisk: highRiskClients,
      lowRisk,
      mediumRisk,
      avgCompliance: Math.round(avgComplianceScore),
      managersCount,
      contractorsCount,
    }
  }

  const stats = getClientStats()

  if (
    clientsLoading ||
    policiesLoading ||
    projectsLoading ||
    complianceLoading ||
    brokerCountsLoading
  ) {
    return <DashboardSkeleton />
  }


  if (clients.length === 0) {
    return (
      <>
        <Stack gap={24}>
          <Row alignItems="center" justifyContent="flex-end">
            <Button color="primary" iconStart={UserPlus} onPress={() => setIsInviteModalOpen(true)}>
              Invite Client{pendingInvitations.length > 0 ? ` (${pendingInvitations.length})` : ''}
            </Button>
          </Row>
          <EmptyState
            icon={Users}
            title="No Clients Yet"
            description="Start building your client portfolio by inviting your first client. Send an invitation email or share your broker code, and they'll connect with you once they sign up."
            action={{
              label: 'Invite Client',
              onClick: () => setIsInviteModalOpen(true),
            }}
          />
        </Stack>
        <InviteClientsModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          brokerCode={brokerCode}
          userId={user?.id || ''}
          organizationId={organizationId || ''}
          onInvitationSent={refreshPendingInvitations}
        />
        <PendingInvitationsModal
          isOpen={isPendingInvitationsModalOpen}
          onClose={() => setIsPendingInvitationsModalOpen(false)}
          pendingInvitations={pendingInvitations}
          onInvitationResent={refreshPendingInvitations}
        />
      </>
    )
  }

  return (
    <>
      <Stack gap={24}>
        <Row alignItems="center" justifyContent="flex-end">
          <Button color="primary" iconStart={UserPlus} onPress={() => setIsInviteModalOpen(true)}>
            Invite Client{pendingInvitations.length > 0 ? ` (${pendingInvitations.length})` : ''}
          </Button>
        </Row>

        {/* Stats Overview */}
        <Grid columns={{ base: 1, sm: 2, lg: 3, xl: 6 }} gap={16}>
          {/* Managers Card - Clickable */}
          <Card
            pressable
            onPress={() => setActiveFilter('manager')}
            variant={activeFilter === 'manager' ? 'outlined' : 'elevated'}
            padding="md"
            radius="lg"
            elevation="sm"
            style={
              activeFilter === 'manager'
                ? {
                    borderWidth: 2,
                    borderColor: 'var(--color-orange-9)',
                    boxShadow: '0 0 0 3px var(--color-orange-3), 0 1px 3px rgba(0, 0, 0, 0.08)',
                  }
                : undefined
            }
          >
            <CardContent>
              <Row alignItems="center" justifyContent="space-between">
                <Stack>
                  <Text size="sm" muted>
                    Managers
                  </Text>
                  <Text
                    size="2xl"
                    weight="bold"
                    style={{ color: 'var(--color-purple-10)', marginTop: 4 }}
                  >
                    {stats.managersCount}
                  </Text>
                </Stack>
                <Avatar size={40} color="primary" icon={<Building2 size={20} color="var(--color-purple-10)" />} />
              </Row>
              <Text size="sm" muted style={{ marginTop: 12 }}>
                GCs, Property Managers
              </Text>
            </CardContent>
          </Card>

          {/* Contractors Card - Clickable */}
          <Card
            pressable
            onPress={() => setActiveFilter('subcontractor')}
            variant={activeFilter === 'subcontractor' ? 'outlined' : 'elevated'}
            padding="md"
            radius="lg"
            elevation="sm"
            style={
              activeFilter === 'subcontractor'
                ? {
                    borderWidth: 2,
                    borderColor: 'var(--color-orange-9)',
                    boxShadow: '0 0 0 3px var(--color-orange-3), 0 1px 3px rgba(0, 0, 0, 0.08)',
                  }
                : undefined
            }
          >
            <CardContent>
              <Row alignItems="center" justifyContent="space-between">
                <Stack>
                  <Text size="sm" muted>
                    Contractors
                  </Text>
                  <Text
                    size="2xl"
                    weight="bold"
                    style={{ color: 'var(--color-blue-10)', marginTop: 4 }}
                  >
                    {stats.contractorsCount}
                  </Text>
                </Stack>
                <Avatar size={40} color="info" icon={<HardHat size={20} color="var(--color-blue-10)" />} />
              </Row>
              <Text size="sm" muted style={{ marginTop: 12 }}>
                Subcontractors, Vendors
              </Text>
            </CardContent>
          </Card>

          {/* Avg Compliance Card - Not clickable */}
          <Card variant="elevated" padding="md" radius="lg" elevation="sm">
            <CardContent>
              <Row alignItems="center" justifyContent="space-between">
                <Stack>
                  <Text size="sm" muted>
                    Avg Compliance
                  </Text>
                  <Text
                    size="2xl"
                    weight="bold"
                    style={{ color: 'var(--color-green-10)', marginTop: 4 }}
                  >
                    {stats.avgCompliance}%
                  </Text>
                </Stack>
                <Avatar size={40} color="success" icon={<Shield size={20} color="var(--color-green-10)" />} />
              </Row>
              <Row alignItems="center" gap={4} style={{ marginTop: 12 }}>
                <TrendingUp size={14} style={{ color: 'var(--color-green-10)' }} />
                <Text size="sm" style={{ color: 'var(--color-green-10)' }}>
                  Above target
                </Text>
              </Row>
            </CardContent>
          </Card>

          {/* High Risk Card - Not clickable */}
          <Card variant="elevated" padding="md" radius="lg" elevation="sm">
            <CardContent>
              <Row alignItems="center" justifyContent="space-between">
                <Stack>
                  <Text size="sm" muted>
                    High Risk
                  </Text>
                  <Text
                    size="2xl"
                    weight="bold"
                    style={{ color: 'var(--color-red-10)', marginTop: 4 }}
                  >
                    {stats.highRisk}
                  </Text>
                </Stack>
                <Avatar size={40} color="error" icon={<AlertTriangle size={20} color="var(--color-red-10)" />} />
              </Row>
              <Text size="sm" muted style={{ marginTop: 12 }}>
                Require attention
              </Text>
            </CardContent>
          </Card>

          {/* Active Projects Card - Not clickable */}
          <Card variant="elevated" padding="md" radius="lg" elevation="sm">
            <CardContent>
              <Row alignItems="center" justifyContent="space-between">
                <Stack>
                  <Text size="sm" muted>
                    Active Projects
                  </Text>
                  <Text
                    size="2xl"
                    weight="bold"
                    style={{ color: 'var(--color-blue-10)', marginTop: 4 }}
                  >
                    {projects.filter((p) => p.status === 'active').length}
                  </Text>
                </Stack>
                <Avatar size={40} color="info" icon={<Briefcase size={20} color="var(--color-blue-10)" />} />
              </Row>
              <Text size="sm" muted style={{ marginTop: 12 }}>
                Across all clients
              </Text>
            </CardContent>
          </Card>

          {/* Pending Invitations Card - Clickable if there are invitations */}
          <Card
            pressable={pendingInvitations.length > 0}
            onPress={() => pendingInvitations.length > 0 && setIsPendingInvitationsModalOpen(true)}
            variant="elevated"
            padding="md"
            radius="lg"
            elevation="sm"
            disabled={pendingInvitations.length === 0}
          >
            <CardContent>
              <Row alignItems="center" justifyContent="space-between">
                <Stack>
                  <Text size="sm" muted>
                    Pending Invitations
                  </Text>
                  <Text
                    size="2xl"
                    weight="bold"
                    style={{ color: 'var(--color-orange-10)', marginTop: 4 }}
                  >
                    {pendingInvitations.length}
                  </Text>
                </Stack>
                <Avatar size={40} color="warning" icon={<Clock size={20} color="var(--color-orange-10)" />} />
              </Row>
              <Text size="sm" muted style={{ marginTop: 12 }}>
                {pendingInvitations.length === 0
                  ? 'No pending invites'
                  : pendingInvitations.length === 1
                    ? '1 invitation pending'
                    : `${pendingInvitations.length} invitations pending`}
              </Text>
            </CardContent>
          </Card>
        </Grid>

        {/* Unified Clients Table */}
        <ClientsTable
          clients={clients}
          policies={policies}
          complianceData={complianceData}
          projects={projects}
          brokerCounts={brokerCounts}
          clientTypeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onClientClick={(client: BrokerClient) => {
            navigate(`/broker/clients/${client.id}`)
          }}
        />
      </Stack>
      <InviteClientsModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        brokerCode={brokerCode}
        userId={user?.id || ''}
        organizationId={organizationId || ''}
        onInvitationSent={refreshPendingInvitations}
      />
      <PendingInvitationsModal
        isOpen={isPendingInvitationsModalOpen}
        onClose={() => setIsPendingInvitationsModalOpen(false)}
        pendingInvitations={pendingInvitations}
        onInvitationResent={refreshPendingInvitations}
      />
    </>
  )
}
