import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, AlertTriangle, Shield, Users, Building2, HardHat, UserPlus } from 'lucide-react';
import { Stack, Row, Text, H1, Button } from '@unicornlove/beyond-ui';
import { EmptyState } from '../../ui/EmptyState';
import { useClients } from '../../hooks/useClients';
import { usePolicies } from '../../hooks/usePolicies';
import { useProjects } from '../../hooks/useProjects';
import { useCompliance } from '../../hooks/useCompliance';
import { useClientBrokerCounts } from '../../hooks/useClientBrokerCounts';
import { useAuth } from '../../contexts/AuthContext';
import ClientsTable from './ClientsTable';
import ClientModal from './ClientModal';
import InviteClientsModal from './InviteClientsModal';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import type { BrokerClient } from '../../types';
import { getUserOrganizationId } from '../../lib/supabase';
import {
  getUserInvitations,
  type RelationshipInvitation,
} from '../../lib/relationshipInvitations';
import { generateRelationshipCode } from '../../lib/connectionCodes';

// Orange button styles for visibility
const orangeButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-orange-9)',
  color: 'white',
  border: 'none',
  fontWeight: 600,
};

const orangeOutlineButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: 'var(--color-orange-10)',
  border: '1px solid var(--color-orange-6)',
  fontWeight: 600,
};

type ClientTypeFilter = 'all' | 'manager' | 'subcontractor';

export default function BrokerClientsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ClientTypeFilter>('all');
  
  // Pass broker's organizationId to get their connected clients (managers & subcontractors)
  const { clients, loading: clientsLoading, addClient } = useClients(organizationId || undefined);
  const { policies, loading: policiesLoading } = usePolicies();
  const { projects, loading: projectsLoading } = useProjects();
  const { complianceData, loading: complianceLoading } = useCompliance();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Get client organization IDs for broker count lookup
  const clientOrgIds = useMemo(() => clients.map(c => c.id), [clients]);
  const { brokerCounts, loading: brokerCountsLoading } = useClientBrokerCounts({
    organizationIds: clientOrgIds,
  });

  // Invitation state
  const [brokerCode, setBrokerCode] = useState<string>('');
  const [pendingInvitations, setPendingInvitations] = useState<RelationshipInvitation[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Fetch organization ID on mount
  useEffect(() => {
    async function fetchOrg() {
      if (user?.id) {
        const orgId = await getUserOrganizationId(user.id);
        setOrganizationId(orgId);
      }
    }
    fetchOrg();
  }, [user?.id]);

  // Generate/fetch broker's BKR- code
  useEffect(() => {
    async function initBrokerCode() {
      if (!user?.id) return;

      try {
        const code = generateRelationshipCode('BKR');
        setBrokerCode(code);

        const invitations = await getUserInvitations(user.id, 'pending');
        const clientInvites = invitations.filter(
          inv => inv.inviter_type === 'broker' &&
                 (inv.invitee_type === 'manager' || inv.invitee_type === 'subcontractor')
        );
        setPendingInvitations(clientInvites);
      } catch (error) {
        console.error('[BrokerClientsPage] Error initializing broker code:', error);
      }
    }
    initBrokerCode();
  }, [user?.id]);

  const refreshPendingInvitations = async () => {
    if (user?.id) {
      const invitations = await getUserInvitations(user.id, 'pending');
      const clientInvites = invitations.filter(
        inv => inv.inviter_type === 'broker' &&
               (inv.invitee_type === 'manager' || inv.invitee_type === 'subcontractor')
      );
      setPendingInvitations(clientInvites);
    }
  };

  // Calculate stats based on active filter
  const getClientStats = () => {
    const filteredByType = activeFilter === 'all' 
      ? clients 
      : activeFilter === 'manager'
        ? clients.filter(c => c.client_type === 'general_contractor')
        : clients.filter(c => c.client_type === 'subcontractor');
    
    const totalClients = filteredByType.length;
    const activeClients = filteredByType.filter((c) => c.status === 'active').length;
    const highRiskClients = filteredByType.filter((c) => c.risk_level === 'high').length;
    const avgComplianceScore = filteredByType.reduce((acc, c) => acc + (c.compliance_score ?? 0), 0) / (totalClients || 1);

    // Counts by type (for filter badges)
    const managersCount = clients.filter(c => c.client_type === 'general_contractor').length;
    const contractorsCount = clients.filter(c => c.client_type === 'subcontractor').length;

    // Risk breakdown
    const lowRisk = filteredByType.filter(c => c.risk_level === 'low').length;
    const mediumRisk = filteredByType.filter(c => c.risk_level === 'medium').length;

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
    };
  };

  const stats = getClientStats();

  if (clientsLoading || policiesLoading || projectsLoading || complianceLoading || brokerCountsLoading) {
    return <DashboardSkeleton />;
  }

  const handleSaveClient = async (clientData: Partial<BrokerClient>) => {
    await addClient(clientData as Omit<BrokerClient, 'id' | 'created_at' | 'updated_at'>);
    setIsClientModalOpen(false);
  };

  const statCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    border: '1px solid var(--color-gray-4)',
    flex: 1,
    minWidth: 160,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  };

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    backgroundColor: `var(--color-${color}-3)`,
    padding: 10,
    borderRadius: 8,
  });

  if (clients.length === 0) {
    return (
      <>
        <Stack gap={24}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <H1 style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-text)' }}>Clients</H1>
              <Text muted>
                Manage your client portfolio and monitor compliance
              </Text>
            </Stack>
            <Row gap={12}>
              <Button
                onPress={() => setIsInviteModalOpen(true)}
                style={orangeOutlineButtonStyle}
              >
                <Row alignItems="center" gap={8}>
                  <UserPlus size={16} />
                  <span>Invite Client{pendingInvitations.length > 0 ? ` (${pendingInvitations.length})` : ''}</span>
                </Row>
              </Button>
              <Button
                onPress={() => setIsClientModalOpen(true)}
                style={orangeButtonStyle}
              >
                Add Client
              </Button>
            </Row>
          </Row>
          <EmptyState
            icon={Users}
            title="No Clients Yet"
            description="Start building your client portfolio by inviting or adding your first client. You'll be able to manage their policies, track compliance, and monitor risk."
            action={{
              label: 'Add Client',
              onClick: () => setIsClientModalOpen(true),
            }}
          />
        </Stack>
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSave={handleSaveClient}
        />
        <InviteClientsModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          brokerCode={brokerCode}
          pendingInvitations={pendingInvitations}
          userId={user?.id || ''}
          organizationId={organizationId || ''}
          onInvitationSent={refreshPendingInvitations}
        />
      </>
    );
  }

  return (
    <>
      <Stack gap={24}>
        <Row alignItems="center" justifyContent="space-between">
          <Stack>
            <H1 style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-text)' }}>Clients</H1>
            <Text muted>
              Manage your client portfolio and monitor compliance
            </Text>
          </Stack>
          <Row gap={12}>
            <Button
              onPress={() => setIsInviteModalOpen(true)}
              style={orangeOutlineButtonStyle}
            >
              <Row alignItems="center" gap={8}>
                <UserPlus size={16} />
                <span>Invite Client{pendingInvitations.length > 0 ? ` (${pendingInvitations.length})` : ''}</span>
              </Row>
            </Button>
            <Button
              onPress={() => setIsClientModalOpen(true)}
              style={orangeButtonStyle}
            >
              Add Client
            </Button>
          </Row>
        </Row>

        {/* Stats Overview Row */}
        <Row gap={16} style={{ flexWrap: 'wrap' }}>
          <div 
            style={{
              ...statCardStyle,
              border: activeFilter === 'all' ? '2px solid var(--color-orange-9)' : '1px solid var(--color-gray-4)',
              boxShadow: activeFilter === 'all' ? '0 0 0 3px var(--color-orange-3), 0 1px 3px rgba(0, 0, 0, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
            onClick={() => setActiveFilter('all')}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              if (activeFilter !== 'all') {
                e.currentTarget.style.borderColor = 'var(--color-orange-6)';
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              if (activeFilter !== 'all') {
                e.currentTarget.style.borderColor = 'var(--color-gray-4)';
              }
            }}
          >
            <Row alignItems="center" justifyContent="space-between">
              <Stack>
                <Text size="sm" muted>Total Clients</Text>
                <Text size="2xl" weight="bold" style={{ marginTop: 4 }}>
                  {stats.total}
                </Text>
              </Stack>
              <div style={iconBoxStyle('blue')}>
                <Users size={20} style={{ color: 'var(--color-blue-10)' }} />
              </div>
            </Row>
            <Row gap={12} style={{ marginTop: 12 }}>
              <Row alignItems="center" gap={4}>
                <Building2 size={14} style={{ color: 'var(--color-purple-10)' }} />
                <Text size="sm" style={{ color: 'var(--color-purple-10)' }}>{stats.managersCount} Mgrs</Text>
              </Row>
              <Row alignItems="center" gap={4}>
                <HardHat size={14} style={{ color: 'var(--color-blue-10)' }} />
                <Text size="sm" style={{ color: 'var(--color-blue-10)' }}>{stats.contractorsCount} Subs</Text>
              </Row>
            </Row>
          </div>

          <div 
            style={{
              ...statCardStyle,
              border: activeFilter === 'manager' ? '2px solid var(--color-orange-9)' : '1px solid var(--color-gray-4)',
              boxShadow: activeFilter === 'manager' ? '0 0 0 3px var(--color-orange-3), 0 1px 3px rgba(0, 0, 0, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
            onClick={() => setActiveFilter('manager')}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              if (activeFilter !== 'manager') {
                e.currentTarget.style.borderColor = 'var(--color-orange-6)';
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              if (activeFilter !== 'manager') {
                e.currentTarget.style.borderColor = 'var(--color-gray-4)';
              }
            }}
          >
            <Row alignItems="center" justifyContent="space-between">
              <Stack>
                <Text size="sm" muted>Managers</Text>
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-purple-10)', marginTop: 4 }}>
                  {stats.managersCount}
                </Text>
              </Stack>
              <div style={iconBoxStyle('purple')}>
                <Building2 size={20} style={{ color: 'var(--color-purple-10)' }} />
              </div>
            </Row>
            <Text size="sm" muted style={{ marginTop: 12 }}>
              GCs, Property Managers
            </Text>
          </div>

          <div 
            style={{
              ...statCardStyle,
              border: activeFilter === 'subcontractor' ? '2px solid var(--color-orange-9)' : '1px solid var(--color-gray-4)',
              boxShadow: activeFilter === 'subcontractor' ? '0 0 0 3px var(--color-orange-3), 0 1px 3px rgba(0, 0, 0, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
            onClick={() => setActiveFilter('subcontractor')}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              if (activeFilter !== 'subcontractor') {
                e.currentTarget.style.borderColor = 'var(--color-orange-6)';
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              if (activeFilter !== 'subcontractor') {
                e.currentTarget.style.borderColor = 'var(--color-gray-4)';
              }
            }}
          >
            <Row alignItems="center" justifyContent="space-between">
              <Stack>
                <Text size="sm" muted>Contractors</Text>
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-blue-10)', marginTop: 4 }}>
                  {stats.contractorsCount}
                </Text>
              </Stack>
              <div style={iconBoxStyle('blue')}>
                <HardHat size={20} style={{ color: 'var(--color-blue-10)' }} />
              </div>
            </Row>
            <Text size="sm" muted style={{ marginTop: 12 }}>
              Subcontractors, Vendors
            </Text>
          </div>

          <div style={{ ...statCardStyle, cursor: 'default' }}>
            <Row alignItems="center" justifyContent="space-between">
              <Stack>
                <Text size="sm" muted>Avg Compliance</Text>
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-green-10)', marginTop: 4 }}>
                  {stats.avgCompliance}%
                </Text>
              </Stack>
              <div style={iconBoxStyle('green')}>
                <Shield size={20} style={{ color: 'var(--color-green-10)' }} />
              </div>
            </Row>
            <Row alignItems="center" gap={4} style={{ marginTop: 12 }}>
              <TrendingUp size={14} style={{ color: 'var(--color-green-10)' }} />
              <Text size="sm" style={{ color: 'var(--color-green-10)' }}>Above target</Text>
            </Row>
          </div>

          <div style={{ ...statCardStyle, cursor: 'default' }}>
            <Row alignItems="center" justifyContent="space-between">
              <Stack>
                <Text size="sm" muted>High Risk</Text>
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-red-10)', marginTop: 4 }}>
                  {stats.highRisk}
                </Text>
              </Stack>
              <div style={iconBoxStyle('red')}>
                <AlertTriangle size={20} style={{ color: 'var(--color-red-10)' }} />
              </div>
            </Row>
            <Text size="sm" muted style={{ marginTop: 12 }}>
              Require attention
            </Text>
          </div>

          <div style={{ ...statCardStyle, cursor: 'default' }}>
            <Row alignItems="center" justifyContent="space-between">
              <Stack>
                <Text size="sm" muted>Active Projects</Text>
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-blue-10)', marginTop: 4 }}>
                  {projects.filter((p) => p.status === 'active').length}
                </Text>
              </Stack>
              <div style={iconBoxStyle('blue')}>
                <Briefcase size={20} style={{ color: 'var(--color-blue-10)' }} />
              </div>
            </Row>
            <Text size="sm" muted style={{ marginTop: 12 }}>
              Across all clients
            </Text>
          </div>
        </Row>

        {/* Unified Clients Table */}
        <ClientsTable
          clients={clients}
          policies={policies}
          complianceData={complianceData}
          projects={projects}
          brokerCounts={brokerCounts}
          initialClientTypeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onClientClick={(client: BrokerClient) => {
            navigate(`/broker/clients/${client.id}`);
          }}
        />
      </Stack>
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
      />
      <InviteClientsModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        brokerCode={brokerCode}
        pendingInvitations={pendingInvitations}
        userId={user?.id || ''}
        organizationId={organizationId || ''}
        onInvitationSent={refreshPendingInvitations}
      />
    </>
  );
}
