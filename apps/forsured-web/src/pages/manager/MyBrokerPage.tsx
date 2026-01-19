import { useState, useEffect } from 'react';
import {
  Mail,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Users,
} from 'lucide-react';
import { Stack, Row, Text, H1, H3, Card, Input, Button, Spinner } from '@unicornlove/beyond-ui';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { toast } from 'sonner';
import { getUserOrganizationId } from '../../lib/supabase';
import {
  createRelationshipInvitation,
  getUserInvitations,
  connectByRelationshipCode,
  type RelationshipInvitation,
} from '../../lib/relationshipInvitations';
import { generateRelationshipCode } from '../../lib/connectionCodes';
import { ManualUserCreateModal } from '../../components/ManualUsers/ManualUserCreateModal';

interface BrokerInfo {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  status: 'connected' | 'pending';
}

export default function MyBrokerPage() {
  const { user } = useAuth();
  const { forsured } = useDatabase();
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [connectedBrokers, setConnectedBrokers] = useState<BrokerInfo[]>([]);
  const [managerCode, setManagerCode] = useState<string>('');
  const [pendingInvitations, setPendingInvitations] = useState<RelationshipInvitation[]>([]);

  // Invitation form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    name: '',
    company: '',
    phone: '',
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  // Code entry state
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [brokerCode, setBrokerCode] = useState('');
  const [connectingByCode, setConnectingByCode] = useState(false);

  // Manual broker creation state
  const [showManualBrokerModal, setShowManualBrokerModal] = useState(false);

  // Fetch organization ID
  useEffect(() => {
    async function fetchOrg() {
      if (user?.id) {
        const orgId = await getUserOrganizationId(user.id);
        setOrganizationId(orgId);
      }
    }
    fetchOrg();
  }, [user?.id]);

  // Generate manager code and fetch broker relationship
  useEffect(() => {
    async function initData() {
      if (!user?.id || !organizationId) return;

      setLoading(true);
      try {
        // Generate MGR- code (for managers to share with contractors)
        const code = generateRelationshipCode('MGR');
        setManagerCode(code);

        // Check for existing broker relationships (supports multiple brokers)
        const { data: brokerRelationships, error: brokerError } = await forsured(
          'relationship_invitations'
        )
          .select('*')
          .eq('inviter_org_id', organizationId)
          .eq('inviter_type', 'manager')
          .eq('invitee_type', 'broker')
          .eq('status', 'connected')
          .order('created_at', { ascending: false });

        if (brokerError) throw brokerError;

        if (brokerRelationships && brokerRelationships.length > 0) {
          const brokers = brokerRelationships.map((relationship) => {
            const metadata = relationship.metadata as Record<string, unknown>;
            return {
              id: relationship.id,
              name: (metadata?.name as string) || 'Unknown',
              company: (metadata?.company as string) || '',
              email: relationship.invitee_email,
              phone: (metadata?.phone as string) || undefined,
              status: 'connected' as const,
            };
          });
          setConnectedBrokers(brokers);
        }

        // Fetch pending broker invitations
        const invitations = await getUserInvitations(user.id, 'pending');
        const brokerInvites = invitations.filter(
          (inv) => inv.inviter_type === 'manager' && inv.invitee_type === 'broker'
        );
        setPendingInvitations(brokerInvites);
      } catch (error) {
        console.error('[MyBrokerPage] Error initializing data:', error);
        toast.error('Failed to load broker information');
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, [user?.id, organizationId, forsured]);

  // Handle invitation submit
  const handleSendInvitation = async () => {
    if (!user?.id || !organizationId) {
      toast.error('Unable to send invitation. Please ensure you are logged in.');
      return;
    }

    if (!inviteFormData.email || !inviteFormData.name) {
      toast.error('Broker email and name are required');
      return;
    }

    setSendingInvite(true);

    try {
      const invitation = await createRelationshipInvitation({
        inviterOrgId: organizationId,
        inviterUserId: user.id,
        inviterType: 'manager',
        inviteeEmail: inviteFormData.email.trim(),
        inviteeName: inviteFormData.name.trim(),
        inviteeCompany: inviteFormData.company.trim(),
        inviteePhone: inviteFormData.phone.trim(),
        inviteeType: 'broker',
        connectionMethod: 'both',
      });

      toast.success('Broker invitation sent!', {
        description: `${inviteFormData.name} can connect using your manager code`,
      });

      // Reset form
      setInviteFormData({
        email: '',
        name: '',
        company: '',
        phone: '',
      });
      setShowInviteForm(false);

      // Update pending invitations
      setPendingInvitations([...pendingInvitations, invitation]);
    } catch (error) {
      console.error('[MyBrokerPage] Error sending invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  // Handle code entry
  const handleConnectByCode = async () => {
    if (!user?.id || !organizationId) {
      toast.error('Unable to connect. Please ensure you are logged in.');
      return;
    }

    if (!brokerCode.trim()) {
      toast.error('Please enter a broker code');
      return;
    }

    setConnectingByCode(true);

    try {
      const result = await connectByRelationshipCode(brokerCode.trim(), organizationId, user.id);

      if (result.success) {
        toast.success('Connected to broker successfully!');
        setBrokerCode('');
        setShowCodeEntry(false);

        // Reload page to show new broker
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to connect. Please check the code and try again.');
      }
    } catch (error) {
      console.error('[MyBrokerPage] Error connecting by code:', error);
      toast.error('Failed to connect. Please try again.');
    } finally {
      setConnectingByCode(false);
    }
  };

  // Copy manager code
  const copyManagerCode = () => {
    if (!managerCode) return;

    navigator.clipboard.writeText(managerCode);
    toast.success('Manager code copied to clipboard');
  };

  if (loading) {
    return (
      <Stack
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 'var(--space-6)',
        }}
      >
        <Spinner size="lg" />
        <Text style={{ marginTop: 'var(--space-4)', color: 'var(--color-11)' }}>
          Loading broker information...
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={24} style={{ padding: 24 }}>
      {/* Header */}
      <Stack gap={8}>
        <H1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-gray-12)' }}>
          My Insurance Broker
        </H1>
        <Text size="lg" style={{ color: 'var(--color-gray-11)' }}>
          {connectedBrokers.length > 0 
            ? 'Manage your insurance broker relationships' 
            : 'Connect with your insurance brokers'}
        </Text>
      </Stack>

      {/* Connected Brokers */}
      {connectedBrokers.length > 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 24,
          }}
        >
          <Stack gap={16}>
            <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Your Brokers ({connectedBrokers.length})
            </H3>

            <Stack gap={12}>
              {connectedBrokers.map((broker) => (
                <Card
                  key={broker.id}
                  style={{
                    backgroundColor: 'var(--color-green-2)',
                    border: '1px solid var(--color-green-6)',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <Row justifyContent="space-between" alignItems="flex-start">
                    <Stack gap={8} style={{ flex: 1 }}>
                      <Row alignItems="center" gap={8}>
                        <CheckCircle size={18} color="var(--color-green-10)" />
                        <Text size="md" weight="semibold" style={{ color: 'var(--color-gray-12)' }}>
                          {broker.name}
                        </Text>
                      </Row>
                      {broker.company && (
                        <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                          {broker.company}
                        </Text>
                      )}
                      <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                        {broker.email}
                      </Text>
                      {broker.phone && (
                        <Text size="sm" style={{ color: 'var(--color-gray-10)' }}>
                          {broker.phone}
                        </Text>
                      )}
                    </Stack>
                    <Row
                      style={{
                        gap: 8,
                        alignItems: 'center',
                        backgroundColor: 'var(--color-green-3)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Text size="xs" weight="semibold" style={{ color: 'var(--color-green-11)' }}>
                        Connected
                      </Text>
                    </Row>
                  </Row>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Card>
      )}

      {/* Connect by Code */}
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          padding: 24,
        }}
      >
        <Stack gap={16}>
          <Row justifyContent="space-between" alignItems="center">
            <Stack gap={4}>
              <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-gray-12)' }}>
                Connect with Broker Code
              </H3>
              <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                If your broker has given you a code, enter it here
              </Text>
            </Stack>
            <Button
              size="sm"
              variant="outline"
              onPress={() => setShowCodeEntry(!showCodeEntry)}
            >
              {showCodeEntry ? 'Hide' : 'Enter Code'}
            </Button>
          </Row>

          {showCodeEntry && (
            <Stack
              gap={12}
              style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: 16,
              }}
            >
              <Input
                label="Broker Code (BKR-XXXXXX)"
                placeholder="BKR-123456"
                value={brokerCode}
                onChangeText={(text) => setBrokerCode(text.toUpperCase())}
                disabled={connectingByCode}
              />

              <Button
                variant="filled"
                color="primary"
                disabled={connectingByCode || !brokerCode.trim()}
                loading={connectingByCode}
                iconStart={CheckCircle}
                onPress={handleConnectByCode}
              >
                {connectingByCode ? 'Connecting...' : 'Connect with Broker'}
              </Button>
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Invite Broker */}
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          padding: 24,
        }}
      >
        <Stack gap={16}>
          <Row justifyContent="space-between" alignItems="center">
            <Stack gap={4}>
              <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-gray-12)' }}>
                Invite Your Broker
              </H3>
              <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                Send an email invitation to your insurance broker
              </Text>
            </Stack>
            <Button
              size="sm"
              variant="outline"
              iconStart={UserPlus}
              onPress={() => setShowInviteForm(!showInviteForm)}
            >
              {showInviteForm ? 'Cancel' : 'Invite Broker'}
            </Button>
          </Row>

          {showInviteForm && (
            <Stack
              gap={12}
              style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: 16,
              }}
            >
              <Input
                label="Broker Email"
                required
                placeholder="broker@example.com"
                value={inviteFormData.email}
                onChangeText={(text) =>
                  setInviteFormData({ ...inviteFormData, email: text })
                }
                disabled={sendingInvite}
              />

              <Input
                label="Broker Name"
                required
                placeholder="John Smith"
                value={inviteFormData.name}
                onChangeText={(text) =>
                  setInviteFormData({ ...inviteFormData, name: text })
                }
                disabled={sendingInvite}
              />

              <Row gap={12}>
                <Stack gap={8} style={{ flex: 1 }}>
                  <Input
                    label="Company (Optional)"
                    placeholder="ABC Insurance"
                    value={inviteFormData.company}
                    onChangeText={(text) =>
                      setInviteFormData({ ...inviteFormData, company: text })
                    }
                    disabled={sendingInvite}
                  />
                </Stack>

                <Stack gap={8} style={{ flex: 1 }}>
                  <Input
                    label="Phone (Optional)"
                    placeholder="(555) 123-4567"
                    value={inviteFormData.phone}
                    onChangeText={(text) =>
                      setInviteFormData({ ...inviteFormData, phone: text })
                    }
                    disabled={sendingInvite}
                  />
                </Stack>
              </Row>

              <Button
                variant="filled"
                color="primary"
                disabled={sendingInvite || !inviteFormData.email || !inviteFormData.name}
                loading={sendingInvite}
                iconStart={Mail}
                onPress={handleSendInvitation}
              >
                {sendingInvite ? 'Sending...' : 'Send Invitation'}
              </Button>
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Add Broker Manually */}
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          padding: 24,
        }}
      >
        <Stack gap={16}>
          <Row justifyContent="space-between" alignItems="center">
            <Stack gap={4}>
              <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-gray-12)' }}>
                Add Broker Manually
              </H3>
              <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                Add a broker as a placeholder without sending an email
              </Text>
            </Stack>
            <Button
              size="sm"
              variant="outline"
              iconStart={Users}
              onPress={() => setShowManualBrokerModal(true)}
            >
              Add Manually
            </Button>
          </Row>
          <Text size="xs" style={{ color: 'var(--color-gray-10)' }}>
            Manually added brokers are private to you. If they register later with the same email,
            their accounts will be merged automatically.
          </Text>
        </Stack>
      </Card>

      {/* Manager Code - For Contractors */}
      <Card
        style={{
          backgroundColor: 'var(--color-blue-2)',
          borderRadius: 12,
          border: '1px solid var(--color-blue-6)',
          padding: 24,
        }}
      >
        <Stack gap={12}>
          <Stack gap={4}>
            <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-blue-11)' }}>
              Your Manager Code
            </H3>
            <Text size="sm" style={{ color: 'var(--color-blue-10)' }}>
              Share this code with contractors to add them to your projects
            </Text>
          </Stack>

          <Row gap={8} alignItems="center">
            <Card
              style={{
                backgroundColor: 'white',
                border: '1px solid var(--color-blue-6)',
                borderRadius: 8,
                padding: 12,
                flex: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--color-blue-11)',
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'center',
                }}
              >
                {managerCode || 'Loading...'}
              </Text>
            </Card>
            <Button
              variant="filled"
              color="primary"
              onPress={copyManagerCode}
              disabled={!managerCode}
              iconStart={Copy}
            >
              Copy
            </Button>
          </Row>
        </Stack>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 24,
          }}
        >
          <Stack gap={12}>
            <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Pending Broker Invitations ({pendingInvitations.length})
            </H3>
            <Stack gap={8}>
              {pendingInvitations.map((inv) => {
                const metadata = inv.metadata as Record<string, unknown>;
                return (
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
                        <Text size="sm" weight="semibold" style={{ color: 'var(--color-gray-12)' }}>
                          {(metadata?.name as string) || inv.invitee_email}
                        </Text>
                        <Text size="xs" style={{ color: 'var(--color-gray-11)' }}>
                          {inv.invitee_email}
                        </Text>
                        {metadata?.company && (
                          <Text size="xs" style={{ color: 'var(--color-gray-10)' }}>
                            {metadata.company as string}
                          </Text>
                        )}
                      </Stack>
                      <Row gap={8} alignItems="center">
                        <Clock size={14} color="var(--color-orange-10)" />
                        <Text size="xs" style={{ color: 'var(--color-orange-10)' }}>
                          Pending
                        </Text>
                      </Row>
                    </Row>
                  </Card>
                );
              })}
            </Stack>
          </Stack>
        </Card>
      )}

      {/* Help Text */}
      <Card
        style={{
          backgroundColor: 'var(--color-gray-2)',
          borderRadius: 12,
          border: '1px solid var(--color-gray-6)',
          padding: 16,
        }}
      >
        <Stack gap={8}>
          <Row gap={8} alignItems="center">
            <AlertCircle size={16} color="var(--color-gray-11)" />
            <Text size="sm" weight="semibold" style={{ color: 'var(--color-gray-12)' }}>
              About Broker Connections
            </Text>
          </Row>
          <Text size="xs" style={{ color: 'var(--color-gray-11)' }}>
            You can connect with multiple insurance brokers if needed. Once connected, your brokers
            will be able to manage your insurance policies and compliance requirements.
          </Text>
        </Stack>
      </Card>

      {/* Manual Broker Creation Modal */}
      {organizationId && (
        <ManualUserCreateModal
          isOpen={showManualBrokerModal}
          onClose={() => setShowManualBrokerModal(false)}
          role="broker"
          organizationId={organizationId}
          onSuccess={() => {
            // Reload page to show new broker (if any changes)
            window.location.reload();
          }}
        />
      )}
    </Stack>
  );
}
