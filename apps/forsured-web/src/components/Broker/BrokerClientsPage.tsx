import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, AlertTriangle, Shield, Users, Mail, Copy, Clock, Loader2 } from 'lucide-react';
import { YStack, XStack, Text, H1, H2, H3, Card, Input, Button as TamaguiButton } from '@unicornlove/ui';
import { EmptyState } from '@unicornlove/ui';
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
        // Generate BKR- code
        const code = generateRelationshipCode('BKR');
        setBrokerCode(code);

        // Fetch pending invitations
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

  // Handle invitation submit
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

      // Reset form
      setInviteFormData({
        email: '',
        name: '',
        company: '',
        phone: '',
      });

      // Refresh pending invitations
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

  // Copy broker code to clipboard
  const copyBrokerCode = () => {
    if (!brokerCode) return;

    navigator.clipboard.writeText(brokerCode);
    toast.success('Broker code copied to clipboard');
  };

  const getClientStats = () => {
    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === 'active').length;
    const highRiskClients = clients.filter(
      (c) => c.risk_level === 'high'
    ).length;
    const avgComplianceScore =
      clients.reduce((acc, c) => acc + c.compliance_score, 0) /
      (totalClients || 1);

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

  // Show empty state when no clients exist
  if (clients.length === 0) {
    return (
      <>
        <YStack gap="$6">
          <YStack>
            <H1 fontSize="$8" fontWeight="bold" color="$color12">Clients</H1>
            <Text color="$color11">
              Manage your client portfolio and monitor compliance
            </Text>
          </YStack>
          <EmptyState
            icon={Users}
            title="No Clients Yet"
            description="Start building your client portfolio by adding your first client. You'll be able to manage their policies, track compliance, and monitor risk."
            action={{
              label: 'Add Client',
              onClick: () => setIsClientModalOpen(true),
            }}
          />
        </YStack>
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
      <YStack gap="$6">
        <YStack>
          <H1 fontSize="$8" fontWeight="bold" color="$color12">Clients</H1>
          <Text color="$color11">
            Manage your client portfolio and monitor compliance
          </Text>
        </YStack>

        {/* Client Invitation Section */}
        <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" elevation={1}>
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack gap="$1">
                <H3 fontSize="$5" fontWeight="600" color="$color12">
                  Invite Clients
                </H3>
                <Text fontSize="$3" color="$color11">
                  Invite managers or contractors to connect as your clients
                </Text>
              </YStack>
              <TamaguiButton
                size="$3"
                variant="outlined"
                onPress={() => setShowInviteSection(!showInviteSection)}
              >
                {showInviteSection ? 'Hide' : 'Show Invitations'}
              </TamaguiButton>
            </XStack>

            {showInviteSection && (
              <YStack gap="$4" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
                {/* Broker Code Display */}
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="500" color="$color11">
                    Your Broker Code
                  </Text>
                  <XStack gap="$2" alignItems="center">
                    <Card
                      backgroundColor="$blue2"
                      borderColor="$blue6"
                      borderWidth={1}
                      borderRadius="$3"
                      padding="$3"
                      flex={1}
                    >
                      <Text
                        fontSize="$5"
                        fontWeight="700"
                        color="$blue11"
                        fontFamily="$mono"
                        textAlign="center"
                      >
                        {brokerCode || 'Loading...'}
                      </Text>
                    </Card>
                    <TamaguiButton
                      size="$3"
                      icon={<Copy size={16} />}
                      onPress={copyBrokerCode}
                      disabled={!brokerCode}
                    >
                      Copy
                    </TamaguiButton>
                  </XStack>
                  <Text fontSize="$2" color="$color10">
                    Share this code with clients so they can connect with you
                  </Text>
                </YStack>

                {/* Invitation Form */}
                <YStack gap="$3" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
                  <Text fontSize="$4" fontWeight="600" color="$color12">
                    Send Invitation Email
                  </Text>
                  <form onSubmit={handleSendInvitation}>
                    <YStack gap="$3">
                      {/* Client Type Selector */}
                      <YStack gap="$2">
                        <Text fontSize="$2" fontWeight="500" color="$color11">
                          Client Type *
                        </Text>
                        <XStack gap="$2">
                          <TamaguiButton
                            size="$3"
                            variant={inviteClientType === 'manager' ? 'outlined' : 'outlined'}
                            backgroundColor={inviteClientType === 'manager' ? '$blue9' : '$background'}
                            color={inviteClientType === 'manager' ? 'white' : '$color11'}
                            onPress={() => setInviteClientType('manager')}
                          >
                            Manager/GC
                          </TamaguiButton>
                          <TamaguiButton
                            size="$3"
                            variant={inviteClientType === 'subcontractor' ? 'outlined' : 'outlined'}
                            backgroundColor={inviteClientType === 'subcontractor' ? '$blue9' : '$background'}
                            color={inviteClientType === 'subcontractor' ? 'white' : '$color11'}
                            onPress={() => setInviteClientType('subcontractor')}
                          >
                            Contractor
                          </TamaguiButton>
                        </XStack>
                      </YStack>

                      <YStack gap="$2">
                        <Text fontSize="$2" fontWeight="500" color="$color11">
                          Client Email *
                        </Text>
                        <Input
                          placeholder="client@example.com"
                          value={inviteFormData.email}
                          onChangeText={(text: string) =>
                            setInviteFormData({ ...inviteFormData, email: text })
                          }
                          disabled={sendingInvite}
                        />
                      </YStack>

                      <YStack gap="$2">
                        <Text fontSize="$2" fontWeight="500" color="$color11">
                          Client Name *
                        </Text>
                        <Input
                          placeholder="John Doe"
                          value={inviteFormData.name}
                          onChangeText={(text: string) =>
                            setInviteFormData({ ...inviteFormData, name: text })
                          }
                          disabled={sendingInvite}
                        />
                      </YStack>

                      <XStack gap="$3">
                        <YStack gap="$2" flex={1}>
                          <Text fontSize="$2" fontWeight="500" color="$color11">
                            Company (Optional)
                          </Text>
                          <Input
                            placeholder="Acme Construction"
                            value={inviteFormData.company}
                            onChangeText={(text: string) =>
                              setInviteFormData({ ...inviteFormData, company: text })
                            }
                            disabled={sendingInvite}
                          />
                        </YStack>

                        <YStack gap="$2" flex={1}>
                          <Text fontSize="$2" fontWeight="500" color="$color11">
                            Phone (Optional)
                          </Text>
                          <Input
                            placeholder="(555) 123-4567"
                            value={inviteFormData.phone}
                            onChangeText={(text: string) =>
                              setInviteFormData({ ...inviteFormData, phone: text })
                            }
                            disabled={sendingInvite}
                          />
                        </YStack>
                      </XStack>

                      <TamaguiButton
                        size="$3"
                        backgroundColor="$blue9"
                        color="white"
                        icon={sendingInvite ? <Loader2 size={16} /> : <Mail size={16} />}
                        disabled={sendingInvite || !inviteFormData.email || !inviteFormData.name}
                        onPress={handleSendInvitation}
                      >
                        {sendingInvite ? 'Sending...' : 'Send Invitation'}
                      </TamaguiButton>
                    </YStack>
                  </form>
                </YStack>

                {/* Pending Invitations */}
                {pendingInvitations.length > 0 && (
                  <YStack gap="$3" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
                    <Text fontSize="$4" fontWeight="600" color="$color12">
                      Pending Invitations ({pendingInvitations.length})
                    </Text>
                    <YStack gap="$2">
                      {pendingInvitations.map(inv => (
                        <Card
                          key={inv.id}
                          backgroundColor="$background"
                          borderColor="$borderColor"
                          borderWidth={1}
                          borderRadius="$3"
                          padding="$3"
                        >
                          <XStack justifyContent="space-between" alignItems="center">
                            <YStack gap="$1" flex={1}>
                              <XStack gap="$2" alignItems="center">
                                <Text fontSize="$3" fontWeight="600" color="$color12">
                                  {inv.metadata?.name || inv.invitee_email}
                                </Text>
                                <Text fontSize="$2" color="$color10" backgroundColor="$gray3" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                                  {inv.invitee_type === 'manager' ? 'Manager' : 'Contractor'}
                                </Text>
                              </XStack>
                              <Text fontSize="$2" color="$color11">
                                {inv.invitee_email}
                              </Text>
                              {inv.metadata?.company && (
                                <Text fontSize="$2" color="$color10">
                                  {inv.metadata.company}
                                </Text>
                              )}
                            </YStack>
                            <XStack gap="$2" alignItems="center">
                              <Clock size={14} color="$orange10" />
                              <Text fontSize="$2" color="$orange10">
                                Pending
                              </Text>
                            </XStack>
                          </XStack>
                        </Card>
                      ))}
                    </YStack>
                  </YStack>
                )}
              </YStack>
            )}
          </YStack>
        </Card>

      <XStack
        flexDirection="column"
        $gtMd={{ flexDirection: 'row' }}
        gap="$6"
        flexWrap="wrap"
      >
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="20%"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Total Clients</Text>
              <Text fontSize="$9" fontWeight="bold" color="$color12" mt="$1">
                {stats.total}
              </Text>
            </YStack>
            <YStack backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Briefcase color="$blue10" size={24} />
            </YStack>
          </XStack>
          <Text mt="$3" fontSize="$3" color="$color11">
            {stats.active} active accounts
          </Text>
        </Card>

        <Card
          backgroundColor="$background"
          borderRadius="$4"
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="20%"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Avg Compliance</Text>
              <Text fontSize="$9" fontWeight="bold" color="$green10" mt="$1">
                {stats.avgCompliance}%
              </Text>
            </YStack>
            <YStack backgroundColor="$green3" padding="$3" borderRadius="$4">
              <Shield color="$green10" size={24} />
            </YStack>
          </XStack>
          <XStack mt="$3" fontSize="$3" color="$green10" alignItems="center">
            <TrendingUp size={14} mr="$1" color="$green10" />
            <Text fontSize="$3" color="$green10">Above target</Text>
          </XStack>
        </Card>

        <Card
          backgroundColor="$background"
          borderRadius="$4"
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="20%"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">High Risk</Text>
              <Text fontSize="$9" fontWeight="bold" color="$red10" mt="$1">
                {stats.highRisk}
              </Text>
            </YStack>
            <YStack backgroundColor="$red3" padding="$3" borderRadius="$4">
              <AlertTriangle color="$red10" size={24} />
            </YStack>
          </XStack>
          <Text mt="$3" fontSize="$3" color="$color11">
            Require attention
          </Text>
        </Card>

        <Card
          backgroundColor="$background"
          borderRadius="$4"
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="20%"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Active Projects</Text>
              <Text fontSize="$9" fontWeight="bold" color="$blue10" mt="$1">
                {projects.filter((p) => p.status === 'active').length}
              </Text>
            </YStack>
            <YStack backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Briefcase color="$blue10" size={24} />
            </YStack>
          </XStack>
          <Text mt="$3" fontSize="$3" color="$color11">
            Across all clients
          </Text>
        </Card>
      </XStack>

      <Card
        backgroundColor="$background"
        borderRadius="$4"
        elevation={1}
        borderWidth={1}
        borderColor="$borderColor"
        padding="$6"
      >
        <H2 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
          Client Overview
        </H2>
        <XStack
          flexDirection="column"
          $gtMd={{ flexDirection: 'row' }}
          gap="$6"
          flexWrap="wrap"
        >
          <YStack flex={1} minWidth="30%">
            <Text fontSize="$3" color="$color11" mb="$2">By Type</Text>
            <YStack gap="$2">
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$color12">
                  General Contractors
                </Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {
                    clients.filter(
                      (c) => c.client_type === 'general_contractor'
                    ).length
                  }
                </Text>
              </XStack>
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$color12">
                  Subcontractors
                </Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {
                    clients.filter((c) => c.client_type === 'subcontractor')
                      .length
                  }
                </Text>
              </XStack>
            </YStack>
          </YStack>

          <YStack flex={1} minWidth="30%">
            <Text fontSize="$3" color="$color11" mb="$2">By Risk Level</Text>
            <YStack gap="$2">
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$green10">Low Risk</Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {clients.filter((c) => c.risk_level === 'low').length}
                </Text>
              </XStack>
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$yellow10">Medium Risk</Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {clients.filter((c) => c.risk_level === 'medium').length}
                </Text>
              </XStack>
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$red10">High Risk</Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {clients.filter((c) => c.risk_level === 'high').length}
                </Text>
              </XStack>
            </YStack>
          </YStack>

          <YStack flex={1} minWidth="30%">
            <Text fontSize="$3" color="$color11" mb="$2">Active Policies</Text>
            <YStack gap="$2">
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$color12">Total Active</Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {policies.filter((p) => p.status === 'active').length}
                </Text>
              </XStack>
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$yellow10">Expiring Soon</Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {policies.filter((p) => p.status === 'expiring').length}
                </Text>
              </XStack>
            </YStack>
          </YStack>
        </XStack>
      </Card>

      <ClientsTable
        clients={clients}
        policies={policies}
        gcOnly={true}
        complianceData={complianceData}
        projects={projects}
        onClientClick={(client: BrokerClient) => {
          // Navigate to unified client profile page
          navigate(`/broker/clients/${client.id}`);
        }}
      />
      </YStack>
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
      />
    </>
  );
}
