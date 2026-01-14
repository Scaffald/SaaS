import { useState, useEffect } from 'react';
import {
  Mail,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
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
    <Stack style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <Stack>
        <H1
          style={{
            fontSize: 'var(--font-size-10)',
            fontWeight: 700,
            color: 'var(--color-12)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          My Insurance Broker
        </H1>
        <Text
          style={{
            color: 'var(--color-11)',
            fontSize: 'var(--font-size-6)',
            marginTop: 'var(--space-1)',
          }}
        >
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
            borderRadius: 'var(--radius-4)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-5)',
          }}
        >
          <Stack style={{ gap: 'var(--space-4)' }}>
            <H3
              style={{
                fontSize: 'var(--font-size-5)',
                fontWeight: 600,
                color: 'var(--color-12)',
              }}
            >
              Your Brokers ({connectedBrokers.length})
            </H3>

            <Stack style={{ gap: 'var(--space-3)' }}>
              {connectedBrokers.map((broker) => (
                <Card
                  key={broker.id}
                  style={{
                    backgroundColor: 'var(--color-green-2)',
                    border: '1px solid var(--color-green-6)',
                    borderRadius: 'var(--radius-3)',
                    padding: 'var(--space-4)',
                  }}
                >
                  <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Stack style={{ gap: 'var(--space-2)', flex: 1 }}>
                      <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                        <CheckCircle size={18} color="var(--color-green-10)" />
                        <Text
                          style={{
                            fontSize: 'var(--font-size-4)',
                            fontWeight: 600,
                            color: 'var(--color-12)',
                          }}
                        >
                          {broker.name}
                        </Text>
                      </Row>
                      {broker.company && (
                        <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
                          {broker.company}
                        </Text>
                      )}
                      <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
                        {broker.email}
                      </Text>
                      {broker.phone && (
                        <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
                          {broker.phone}
                        </Text>
                      )}
                    </Stack>
                    <Row
                      style={{
                        gap: 'var(--space-2)',
                        alignItems: 'center',
                        backgroundColor: 'var(--color-green-3)',
                        paddingLeft: 'var(--space-2)',
                        paddingRight: 'var(--space-2)',
                        paddingTop: 'var(--space-1)',
                        paddingBottom: 'var(--space-1)',
                        borderRadius: 'var(--radius-2)',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 'var(--font-size-1)',
                          fontWeight: 600,
                          color: 'var(--color-green-11)',
                        }}
                      >
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

      {/* Invite Options - Always shown (multiple brokers supported) */}
      {/* Connect by Code */}
          <Card
            style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-4)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-5)',
            }}
          >
            <Stack style={{ gap: 'var(--space-4)' }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack style={{ gap: 'var(--space-1)' }}>
                  <H3
                    style={{
                      fontSize: 'var(--font-size-5)',
                      fontWeight: 600,
                      color: 'var(--color-12)',
                    }}
                  >
                    Connect with Broker Code
                  </H3>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
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
                <form onSubmit={handleConnectByCode}>
                  <Stack
                    style={{
                      gap: 'var(--space-3)',
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: 'var(--space-4)',
                    }}
                  >
                    <Stack style={{ gap: 'var(--space-2)' }}>
                      <Text
                        style={{
                          fontSize: 'var(--font-size-2)',
                          fontWeight: 500,
                          color: 'var(--color-11)',
                        }}
                      >
                        Broker Code (BKR-XXXXXX)
                      </Text>
                      <Input
                        placeholder="BKR-123456"
                        value={brokerCode}
                        onChange={(e) => setBrokerCode(e.target.value.toUpperCase())}
                        disabled={connectingByCode}
                      />
                    </Stack>

                    <Button
                      color="primary"
                      disabled={connectingByCode || !brokerCode.trim()}
                      loading={connectingByCode}
                      iconStart={CheckCircle}
                      onPress={handleConnectByCode}
                    >
                      {connectingByCode ? 'Connecting...' : 'Connect with Broker'}
                    </Button>
                  </Stack>
                </form>
              )}
            </Stack>
          </Card>

          {/* Invite Broker */}
          <Card
            style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-4)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-5)',
            }}
          >
            <Stack style={{ gap: 'var(--space-4)' }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack style={{ gap: 'var(--space-1)' }}>
                  <H3
                    style={{
                      fontSize: 'var(--font-size-5)',
                      fontWeight: 600,
                      color: 'var(--color-12)',
                    }}
                  >
                    Invite Your Broker
                  </H3>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
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
                <form onSubmit={handleSendInvitation}>
                  <Stack
                    style={{
                      gap: 'var(--space-3)',
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: 'var(--space-4)',
                    }}
                  >
                    <Stack style={{ gap: 'var(--space-2)' }}>
                      <Text
                        style={{
                          fontSize: 'var(--font-size-2)',
                          fontWeight: 500,
                          color: 'var(--color-11)',
                        }}
                      >
                        Broker Email *
                      </Text>
                      <Input
                        placeholder="broker@example.com"
                        value={inviteFormData.email}
                        onChange={(e) =>
                          setInviteFormData({ ...inviteFormData, email: e.target.value })
                        }
                        disabled={sendingInvite}
                      />
                    </Stack>

                    <Stack style={{ gap: 'var(--space-2)' }}>
                      <Text
                        style={{
                          fontSize: 'var(--font-size-2)',
                          fontWeight: 500,
                          color: 'var(--color-11)',
                        }}
                      >
                        Broker Name *
                      </Text>
                      <Input
                        placeholder="John Smith"
                        value={inviteFormData.name}
                        onChange={(e) =>
                          setInviteFormData({ ...inviteFormData, name: e.target.value })
                        }
                        disabled={sendingInvite}
                      />
                    </Stack>

                    <Row style={{ gap: 'var(--space-3)' }}>
                      <Stack style={{ gap: 'var(--space-2)', flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 'var(--font-size-2)',
                            fontWeight: 500,
                            color: 'var(--color-11)',
                          }}
                        >
                          Company (Optional)
                        </Text>
                        <Input
                          placeholder="ABC Insurance"
                          value={inviteFormData.company}
                          onChange={(e) =>
                            setInviteFormData({ ...inviteFormData, company: e.target.value })
                          }
                          disabled={sendingInvite}
                        />
                      </Stack>

                      <Stack style={{ gap: 'var(--space-2)', flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 'var(--font-size-2)',
                            fontWeight: 500,
                            color: 'var(--color-11)',
                          }}
                        >
                          Phone (Optional)
                        </Text>
                        <Input
                          placeholder="(555) 123-4567"
                          value={inviteFormData.phone}
                          onChange={(e) =>
                            setInviteFormData({ ...inviteFormData, phone: e.target.value })
                          }
                          disabled={sendingInvite}
                        />
                      </Stack>
                    </Row>

                    <Button
                      color="primary"
                      disabled={sendingInvite || !inviteFormData.email || !inviteFormData.name}
                      loading={sendingInvite}
                      iconStart={Mail}
                      onPress={handleSendInvitation}
                    >
                      {sendingInvite ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </Stack>
                </form>
              )}
            </Stack>
          </Card>

      {/* Manager Code - For Contractors */}
      <Card
        style={{
          backgroundColor: 'var(--color-blue-2)',
          borderRadius: 'var(--radius-4)',
          border: '1px solid var(--color-blue-6)',
          padding: 'var(--space-5)',
        }}
      >
        <Stack style={{ gap: 'var(--space-3)' }}>
          <Stack style={{ gap: 'var(--space-1)' }}>
            <H3
              style={{
                fontSize: 'var(--font-size-5)',
                fontWeight: 600,
                color: 'var(--color-blue-11)',
              }}
            >
              Your Manager Code
            </H3>
            <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-blue-10)' }}>
              Share this code with contractors to add them to your projects
            </Text>
          </Stack>

          <Row style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
            <Card
              style={{
                backgroundColor: 'white',
                border: '1px solid var(--color-blue-6)',
                borderRadius: 'var(--radius-3)',
                padding: 'var(--space-3)',
                flex: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 'var(--font-size-5)',
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
            borderRadius: 'var(--radius-4)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-5)',
          }}
        >
          <Stack style={{ gap: 'var(--space-3)' }}>
            <H3
              style={{
                fontSize: 'var(--font-size-5)',
                fontWeight: 600,
                color: 'var(--color-12)',
              }}
            >
              Pending Broker Invitations ({pendingInvitations.length})
            </H3>
            <Stack style={{ gap: 'var(--space-2)' }}>
              {pendingInvitations.map((inv) => {
                const metadata = inv.metadata as Record<string, unknown>;
                return (
                  <Card
                    key={inv.id}
                    style={{
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-3)',
                      padding: 'var(--space-3)',
                    }}
                  >
                    <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack style={{ gap: 'var(--space-1)', flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 'var(--font-size-3)',
                            fontWeight: 600,
                            color: 'var(--color-12)',
                          }}
                        >
                          {(metadata?.name as string) || inv.invitee_email}
                        </Text>
                        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-11)' }}>
                          {inv.invitee_email}
                        </Text>
                        {metadata?.company && (
                          <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>
                            {metadata.company as string}
                          </Text>
                        )}
                      </Stack>
                      <Row style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
                        <Clock size={14} color="var(--color-orange-10)" />
                        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-orange-10)' }}>
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
          borderRadius: 'var(--radius-4)',
          border: '1px solid var(--color-gray-6)',
          padding: 'var(--space-4)',
        }}
      >
        <Stack style={{ gap: 'var(--space-2)' }}>
          <Row style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
            <AlertCircle size={16} color="var(--color-11)" />
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                fontWeight: 600,
                color: 'var(--color-12)',
              }}
            >
              About Broker Connections
            </Text>
          </Row>
          <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-11)' }}>
            You can connect with multiple insurance brokers if needed. Once connected, your brokers 
            will be able to manage your insurance policies and compliance requirements.
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
}
