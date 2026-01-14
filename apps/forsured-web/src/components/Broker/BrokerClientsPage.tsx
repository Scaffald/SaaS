import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, AlertTriangle, Shield, Users, Mail, Copy, Clock, Loader2 } from 'lucide-react';
import { Stack, Row, Text, H1, H2, H3, Card, Input, Button } from '@unicornlove/beyond-ui';
import { EmptyState } from '../../ui/EmptyState';
import { useClients } from '../../hooks/useClients';
import { usePolicies } from '../../hooks/usePolicies';
import { useProjects } from '../../hooks/useProjects';
import { useCompliance } from '../../hooks/useCompliance';
import { useAuth } from '../../contexts/AuthContext';
import ClientsTable from './ClientsTable';
import ClientModal from './ClientModal';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import { BrokerClient } from '../../types';
import { toast } from 'sonner';
import { getUserOrganizationId } from '../../lib/supabase';
import {
  createRelationshipInvitation,
  getUserInvitations,
  type RelationshipInvitation,
} from '../../lib/relationshipInvitations';
import { generateRelationshipCode } from '../../lib/connectionCodes';

export default function BrokerClientsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clients, loading: clientsLoading, addClient } = useClients();
  const { policies, loading: policiesLoading } = usePolicies();
  const { projects, loading: projectsLoading } = useProjects();
  const { complianceData, loading: complianceLoading } = useCompliance();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Invitation state
  const [brokerCode, setBrokerCode] = useState<string>('');
  const [pendingInvitations, setPendingInvitations] = useState<RelationshipInvitation[]>([]);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [inviteClientType, setInviteClientType] = useState<'manager' | 'subcontractor'>('manager');
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    name: '',
    company: '',
    phone: '',
  });
  const [sendingInvite, setSendingInvite] = useState(false);

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

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !organizationId) {
      toast.error('Unable to send invitation. Please ensure you are logged in.');
      return;
    }

    if (!inviteFormData.email || !inviteFormData.name) {
      toast.error('Client email and name are required');
      return;
    }

    setSendingInvite(true);

    try {
      const invitation = await createRelationshipInvitation({
        inviterOrgId: organizationId,
        inviterUserId: user.id,
        inviterType: 'broker',
        inviteeEmail: inviteFormData.email.trim(),
        inviteeName: inviteFormData.name.trim(),
        inviteeCompany: inviteFormData.company.trim(),
        inviteePhone: inviteFormData.phone.trim(),
        inviteeType: inviteClientType,
        connectionMethod: 'both',
      });

      toast.success('Client invitation sent!', {
        description: `${inviteFormData.name} can connect using code ${invitation.relationship_code}`,
      });

      setInviteFormData({
        email: '',
        name: '',
        company: '',
        phone: '',
      });

      if (user?.id) {
        const invitations = await getUserInvitations(user.id, 'pending');
        const clientInvites = invitations.filter(
          inv => inv.inviter_type === 'broker' &&
                 (inv.invitee_type === 'manager' || inv.invitee_type === 'subcontractor')
        );
        setPendingInvitations(clientInvites);
      }
    } catch (error) {
      console.error('[BrokerClientsPage] Error sending invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  const copyBrokerCode = () => {
    if (!brokerCode) return;
    navigator.clipboard.writeText(brokerCode);
    toast.success('Broker code copied to clipboard');
  };

  const getClientStats = () => {
    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === 'active').length;
    const highRiskClients = clients.filter((c) => c.risk_level === 'high').length;
    const avgComplianceScore = clients.reduce((acc, c) => acc + c.compliance_score, 0) / (totalClients || 1);

    return {
      total: totalClients,
      active: activeClients,
      highRisk: highRiskClients,
      avgCompliance: Math.round(avgComplianceScore),
    };
  };

  const stats = getClientStats();

  if (clientsLoading || policiesLoading || projectsLoading || complianceLoading) {
    return <DashboardSkeleton />;
  }

  const handleSaveClient = async (clientData: Partial<BrokerClient>) => {
    await addClient(clientData as Omit<BrokerClient, 'id' | 'created_at' | 'updated_at'>);
    setIsClientModalOpen(false);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background)',
    borderRadius: 12,
    padding: 24,
    border: '1px solid var(--color-border)',
    flex: 1,
    minWidth: '20%',
  };

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    backgroundColor: `var(--color-${color}-3)`,
    padding: 12,
    borderRadius: 8,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    backgroundColor: 'var(--color-background)',
    fontSize: 14,
  };

  const clientTypeButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    backgroundColor: isSelected ? 'var(--color-blue-9)' : 'var(--color-background)',
    color: isSelected ? 'white' : 'var(--color-text-muted)',
    cursor: 'pointer',
  });

  if (clients.length === 0) {
    return (
      <>
        <Stack gap={24}>
          <Stack>
            <H1 style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-text)' }}>Clients</H1>
            <Text muted>
              Manage your client portfolio and monitor compliance
            </Text>
          </Stack>
          <EmptyState
            icon={Users}
            title="No Clients Yet"
            description="Start building your client portfolio by adding your first client. You'll be able to manage their policies, track compliance, and monitor risk."
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
      </>
    );
  }

  return (
    <>
      <Stack gap={24}>
        <Stack>
          <H1 style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-text)' }}>Clients</H1>
          <Text muted>
            Manage your client portfolio and monitor compliance
          </Text>
        </Stack>

        {/* Client Invitation Section */}
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 20,
          }}
        >
          <Stack gap={16}>
            <Row justifyContent="space-between" alignItems="center">
              <Stack gap={4}>
                <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)' }}>
                  Invite Clients
                </H3>
                <Text size="sm" muted>
                  Invite managers or contractors to connect as your clients
                </Text>
              </Stack>
              <Button
                variant="outlined"
                onPress={() => setShowInviteSection(!showInviteSection)}
              >
                {showInviteSection ? 'Hide' : 'Show Invitations'}
              </Button>
            </Row>

            {showInviteSection && (
              <Stack gap={16} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                {/* Broker Code Display */}
                <Stack gap={8}>
                  <Text size="sm" weight="medium" muted>
                    Your Broker Code
                  </Text>
                  <Row gap={8} alignItems="center">
                    <Card
                      style={{
                        backgroundColor: 'var(--color-blue-2)',
                        border: '1px solid var(--color-blue-6)',
                        borderRadius: 8,
                        padding: 12,
                        flex: 1,
                      }}
                    >
                      <Text
                        size="lg"
                        weight="bold"
                        style={{ color: 'var(--color-blue-11)', fontFamily: 'monospace', textAlign: 'center' }}
                      >
                        {brokerCode || 'Loading...'}
                      </Text>
                    </Card>
                    <Button
                      onPress={copyBrokerCode}
                      disabled={!brokerCode}
                      iconStart={Copy}
                    >
                      Copy
                    </Button>
                  </Row>
                  <Text size="xs" muted>
                    Share this code with clients so they can connect with you
                  </Text>
                </Stack>

                {/* Invitation Form */}
                <Stack gap={12} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <Text size="md" weight="semibold">
                    Send Invitation Email
                  </Text>
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
                            Manager/GC
                          </button>
                          <button
                            type="button"
                            onClick={() => setInviteClientType('subcontractor')}
                            style={clientTypeButtonStyle(inviteClientType === 'subcontractor')}
                          >
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
                          onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
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
                          onChange={(e) => setInviteFormData({ ...inviteFormData, name: e.target.value })}
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
                            onChange={(e) => setInviteFormData({ ...inviteFormData, company: e.target.value })}
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
                            onChange={(e) => setInviteFormData({ ...inviteFormData, phone: e.target.value })}
                            disabled={sendingInvite}
                            style={inputStyle}
                          />
                        </Stack>
                      </Row>

                      <Button
                        type="submit"
                        disabled={sendingInvite || !inviteFormData.email || !inviteFormData.name}
                        style={{
                          backgroundColor: 'var(--color-blue-9)',
                          opacity: sendingInvite || !inviteFormData.email || !inviteFormData.name ? 0.5 : 1,
                        }}
                      >
                        <Row alignItems="center" gap={8}>
                          {sendingInvite ? <Loader2 size={16} /> : <Mail size={16} />}
                          <span style={{ color: 'white' }}>{sendingInvite ? 'Sending...' : 'Send Invitation'}</span>
                        </Row>
                      </Button>
                    </Stack>
                  </form>
                </Stack>

                {/* Pending Invitations */}
                {pendingInvitations.length > 0 && (
                  <Stack gap={12} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                    <Text size="md" weight="semibold">
                      Pending Invitations ({pendingInvitations.length})
                    </Text>
                    <Stack gap={8}>
                      {pendingInvitations.map(inv => (
                        <Card
                          key={inv.id}
                          style={{
                            backgroundColor: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          <Row justifyContent="space-between" alignItems="center">
                            <Stack gap={4} style={{ flex: 1 }}>
                              <Row gap={8} alignItems="center">
                                <Text size="sm" weight="semibold">
                                  {inv.metadata?.name || inv.invitee_email}
                                </Text>
                                <span
                                  style={{
                                    fontSize: 12,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    backgroundColor: 'var(--color-gray-3)',
                                    color: 'var(--color-text-muted)',
                                  }}
                                >
                                  {inv.invitee_type === 'manager' ? 'Manager' : 'Contractor'}
                                </span>
                              </Row>
                              <Text size="xs" muted>
                                {inv.invitee_email}
                              </Text>
                              {inv.metadata?.company && (
                                <Text size="xs" muted>
                                  {inv.metadata.company}
                                </Text>
                              )}
                            </Stack>
                            <Row gap={8} alignItems="center">
                              <Clock size={14} style={{ color: 'var(--color-orange-10)' }} />
                              <Text size="xs" style={{ color: 'var(--color-orange-10)' }}>
                                Pending
                              </Text>
                            </Row>
                          </Row>
                        </Card>
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        </Card>

        <Row gap={24} style={{ flexWrap: 'wrap' }}>
          <Card style={cardStyle}>
            <Row alignItems="center" justifyContent="space-between">
              <Stack>
                <Text size="sm" muted>Total Clients</Text>
                <Text size="2xl" weight="bold" style={{ marginTop: 4 }}>
                  {stats.total}
                </Text>
              </Stack>
              <div style={iconBoxStyle('blue')}>
                <Briefcase size={24} style={{ color: 'var(--color-blue-10)' }} />
              </div>
            </Row>
            <Text size="sm" muted style={{ marginTop: 12 }}>
              {stats.active} active accounts
            </Text>
          </Card>

          <Card style={cardStyle}>
            <Row alignItems="center" justifyContent="space-between">
              <Stack>
                <Text size="sm" muted>Avg Compliance</Text>
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-green-10)', marginTop: 4 }}>
                  {stats.avgCompliance}%
                </Text>
              </Stack>
              <div style={iconBoxStyle('green')}>
                <Shield size={24} style={{ color: 'var(--color-green-10)' }} />
              </div>
            </Row>
            <Row alignItems="center" gap={4} style={{ marginTop: 12 }}>
              <TrendingUp size={14} style={{ color: 'var(--color-green-10)' }} />
              <Text size="sm" style={{ color: 'var(--color-green-10)' }}>Above target</Text>
            </Row>
          </Card>

          <Card style={cardStyle}>
            <Row alignItems="center" justifyContent="space-between">
              <Stack>
                <Text size="sm" muted>High Risk</Text>
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-red-10)', marginTop: 4 }}>
                  {stats.highRisk}
                </Text>
              </Stack>
              <div style={iconBoxStyle('red')}>
                <AlertTriangle size={24} style={{ color: 'var(--color-red-10)' }} />
              </div>
            </Row>
            <Text size="sm" muted style={{ marginTop: 12 }}>
              Require attention
            </Text>
          </Card>

          <Card style={cardStyle}>
            <Row alignItems="center" justifyContent="space-between">
              <Stack>
                <Text size="sm" muted>Active Projects</Text>
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-blue-10)', marginTop: 4 }}>
                  {projects.filter((p) => p.status === 'active').length}
                </Text>
              </Stack>
              <div style={iconBoxStyle('blue')}>
                <Briefcase size={24} style={{ color: 'var(--color-blue-10)' }} />
              </div>
            </Row>
            <Text size="sm" muted style={{ marginTop: 12 }}>
              Across all clients
            </Text>
          </Card>
        </Row>

        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 24,
          }}
        >
          <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>
            Client Overview
          </H2>
          <Row gap={24} style={{ flexWrap: 'wrap' }}>
            <Stack style={{ flex: 1, minWidth: '30%' }}>
              <Text size="sm" muted style={{ marginBottom: 8 }}>By Type</Text>
              <Stack gap={8}>
                <Row alignItems="center" justifyContent="space-between">
                  <Text size="sm">General Contractors</Text>
                  <Text size="sm" weight="semibold">
                    {clients.filter((c) => c.client_type === 'general_contractor').length}
                  </Text>
                </Row>
                <Row alignItems="center" justifyContent="space-between">
                  <Text size="sm">Subcontractors</Text>
                  <Text size="sm" weight="semibold">
                    {clients.filter((c) => c.client_type === 'subcontractor').length}
                  </Text>
                </Row>
              </Stack>
            </Stack>

            <Stack style={{ flex: 1, minWidth: '30%' }}>
              <Text size="sm" muted style={{ marginBottom: 8 }}>By Risk Level</Text>
              <Stack gap={8}>
                <Row alignItems="center" justifyContent="space-between">
                  <Text size="sm" style={{ color: 'var(--color-green-10)' }}>Low Risk</Text>
                  <Text size="sm" weight="semibold">
                    {clients.filter((c) => c.risk_level === 'low').length}
                  </Text>
                </Row>
                <Row alignItems="center" justifyContent="space-between">
                  <Text size="sm" style={{ color: 'var(--color-yellow-10)' }}>Medium Risk</Text>
                  <Text size="sm" weight="semibold">
                    {clients.filter((c) => c.risk_level === 'medium').length}
                  </Text>
                </Row>
                <Row alignItems="center" justifyContent="space-between">
                  <Text size="sm" style={{ color: 'var(--color-red-10)' }}>High Risk</Text>
                  <Text size="sm" weight="semibold">
                    {clients.filter((c) => c.risk_level === 'high').length}
                  </Text>
                </Row>
              </Stack>
            </Stack>

            <Stack style={{ flex: 1, minWidth: '30%' }}>
              <Text size="sm" muted style={{ marginBottom: 8 }}>Active Policies</Text>
              <Stack gap={8}>
                <Row alignItems="center" justifyContent="space-between">
                  <Text size="sm">Total Active</Text>
                  <Text size="sm" weight="semibold">
                    {policies.filter((p) => p.status === 'active').length}
                  </Text>
                </Row>
                <Row alignItems="center" justifyContent="space-between">
                  <Text size="sm" style={{ color: 'var(--color-yellow-10)' }}>Expiring Soon</Text>
                  <Text size="sm" weight="semibold">
                    {policies.filter((p) => p.status === 'expiring').length}
                  </Text>
                </Row>
              </Stack>
            </Stack>
          </Row>
        </Card>

        <ClientsTable
          clients={clients}
          policies={policies}
          gcOnly={true}
          complianceData={complianceData}
          projects={projects}
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
    </>
  );
}
