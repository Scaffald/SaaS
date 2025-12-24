import { useState, useEffect } from 'react';
import {
  Mail,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserPlus,
} from 'lucide-react';
import {
  YStack,
  XStack,
  Text,
  H1,
  H3,
  Card,
  Input,
  Button as TamaguiButton,
  Spinner,
} from '@unicornlove/ui';
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
  const [broker, setBroker] = useState<BrokerInfo | null>(null);
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

        // Check for existing broker relationship
        const { data: brokerRelationships, error: brokerError } = await forsured(
          'relationship_invitations'
        )
          .select('*')
          .eq('inviter_org_id', organizationId)
          .eq('inviter_type', 'manager')
          .eq('invitee_type', 'broker')
          .in('status', ['connected', 'pending'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (brokerError) throw brokerError;

        if (brokerRelationships && brokerRelationships.length > 0) {
          const relationship = brokerRelationships[0];
          const metadata = relationship.metadata as Record<string, unknown>;
          
          setBroker({
            id: relationship.id,
            name: metadata?.name as string || 'Unknown',
            company: metadata?.company as string || '',
            email: relationship.invitee_email,
            phone: metadata?.phone as string || undefined,
            status: relationship.status === 'connected' ? 'connected' : 'pending',
          });
        }

        // Fetch pending broker invitations
        const invitations = await getUserInvitations(user.id, 'pending');
        const brokerInvites = invitations.filter(
          inv => inv.inviter_type === 'manager' && inv.invitee_type === 'broker'
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
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !organizationId) {
      toast.error('Unable to send invitation. Please ensure you are logged in.');
      return;
    }

    if (!inviteFormData.email || !inviteFormData.name) {
      toast.error('Broker email and name are required');
      return;
    }

    if (broker?.status === 'connected') {
      toast.error('You already have a connected broker');
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
  const handleConnectByCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !organizationId) {
      toast.error('Unable to connect. Please ensure you are logged in.');
      return;
    }

    if (!brokerCode.trim()) {
      toast.error('Please enter a broker code');
      return;
    }

    if (broker?.status === 'connected') {
      toast.error('You already have a connected broker');
      return;
    }

    setConnectingByCode(true);

    try {
      const result = await connectByRelationshipCode(
        brokerCode.trim(),
        organizationId,
        user.id
      );

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
      <YStack alignItems="center" justifyContent="center" height="100%" padding="$6">
        <Spinner size="large" color="$blue10" />
        <Text mt="$4" color="$color11">
          Loading broker information...
        </Text>
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      {/* Header */}
      <YStack>
        <H1 fontSize="$10" fontWeight="700" color="$color12" fontFamily="$heading">
          My Insurance Broker
        </H1>
        <Text color="$color11" fontSize="$6" mt="$1">
          {broker ? 'Manage your insurance broker relationship' : 'Connect with your insurance broker'}
        </Text>
      </YStack>

      {/* Current Broker */}
      {broker && (
        <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" elevation={1}>
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <H3 fontSize="$5" fontWeight="600" color="$color12">
                Your Broker
              </H3>
              {broker.status === 'connected' ? (
                <XStack gap="$2" alignItems="center" backgroundColor="$green2" paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3">
                  <CheckCircle size={16} color="$green10" />
                  <Text fontSize="$2" fontWeight="600" color="$green10">
                    Connected
                  </Text>
                </XStack>
              ) : (
                <XStack gap="$2" alignItems="center" backgroundColor="$orange2" paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3">
                  <Clock size={16} color="$orange10" />
                  <Text fontSize="$2" fontWeight="600" color="$orange10">
                    Pending
                  </Text>
                </XStack>
              )}
            </XStack>

            <YStack gap="$3">
              <YStack gap="$1">
                <Text fontSize="$2" fontWeight="500" color="$color11">
                  Broker Name
                </Text>
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  {broker.name}
                </Text>
              </YStack>

              {broker.company && (
                <YStack gap="$1">
                  <Text fontSize="$2" fontWeight="500" color="$color11">
                    Company
                  </Text>
                  <Text fontSize="$4" color="$color12">
                    {broker.company}
                  </Text>
                </YStack>
              )}

              <YStack gap="$1">
                <Text fontSize="$2" fontWeight="500" color="$color11">
                  Email
                </Text>
                <Text fontSize="$4" color="$color12">
                  {broker.email}
                </Text>
              </YStack>

              {broker.phone && (
                <YStack gap="$1">
                  <Text fontSize="$2" fontWeight="500" color="$color11">
                    Phone
                  </Text>
                  <Text fontSize="$4" color="$color12">
                    {broker.phone}
                  </Text>
                </YStack>
              )}
            </YStack>

            {broker.status === 'pending' && (
              <Card backgroundColor="$blue2" borderColor="$blue6" borderWidth={1} borderRadius="$3" padding="$3">
                <Text fontSize="$2" color="$blue11">
                  Your broker invitation is pending. They will be able to see your information once they accept.
                </Text>
              </Card>
            )}
          </YStack>
        </Card>
      )}

      {/* No Broker - Invite Options */}
      {!broker && (
        <>
          {/* Connect by Code */}
          <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" elevation={1}>
            <YStack gap="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <YStack gap="$1">
                  <H3 fontSize="$5" fontWeight="600" color="$color12">
                    Connect with Broker Code
                  </H3>
                  <Text fontSize="$3" color="$color11">
                    If your broker has given you a code, enter it here
                  </Text>
                </YStack>
                <TamaguiButton
                  size="$3"
                  variant="outlined"
                  onPress={() => setShowCodeEntry(!showCodeEntry)}
                >
                  {showCodeEntry ? 'Hide' : 'Enter Code'}
                </TamaguiButton>
              </XStack>

              {showCodeEntry && (
                <form onSubmit={handleConnectByCode}>
                  <YStack gap="$3" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
                    <YStack gap="$2">
                      <Text fontSize="$2" fontWeight="500" color="$color11">
                        Broker Code (BKR-XXXXXX)
                      </Text>
                      <Input
                        placeholder="BKR-123456"
                        value={brokerCode}
                        onChangeText={(text: string) => setBrokerCode(text.toUpperCase())}
                        disabled={connectingByCode}
                        autoCapitalize="characters"
                      />
                    </YStack>

                    <TamaguiButton
                      size="$3"
                      backgroundColor="$blue9"
                      color="white"
                      icon={connectingByCode ? <Loader2 size={16} /> : <CheckCircle size={16} />}
                      disabled={connectingByCode || !brokerCode.trim()}
                      onPress={handleConnectByCode}
                    >
                      {connectingByCode ? 'Connecting...' : 'Connect with Broker'}
                    </TamaguiButton>
                  </YStack>
                </form>
              )}
            </YStack>
          </Card>

          {/* Invite Broker */}
          <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" elevation={1}>
            <YStack gap="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <YStack gap="$1">
                  <H3 fontSize="$5" fontWeight="600" color="$color12">
                    Invite Your Broker
                  </H3>
                  <Text fontSize="$3" color="$color11">
                    Send an email invitation to your insurance broker
                  </Text>
                </YStack>
                <TamaguiButton
                  size="$3"
                  variant="outlined"
                  icon={<UserPlus size={16} />}
                  onPress={() => setShowInviteForm(!showInviteForm)}
                >
                  {showInviteForm ? 'Cancel' : 'Invite Broker'}
                </TamaguiButton>
              </XStack>

              {showInviteForm && (
                <form onSubmit={handleSendInvitation}>
                  <YStack gap="$3" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
                    <YStack gap="$2">
                      <Text fontSize="$2" fontWeight="500" color="$color11">
                        Broker Email *
                      </Text>
                      <Input
                        placeholder="broker@example.com"
                        value={inviteFormData.email}
                        onChangeText={(text: string) =>
                          setInviteFormData({ ...inviteFormData, email: text })
                        }
                        disabled={sendingInvite}
                      />
                    </YStack>

                    <YStack gap="$2">
                      <Text fontSize="$2" fontWeight="500" color="$color11">
                        Broker Name *
                      </Text>
                      <Input
                        placeholder="John Smith"
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
                          placeholder="ABC Insurance"
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
              )}
            </YStack>
          </Card>
        </>
      )}

      {/* Manager Code - For Contractors */}
      <Card backgroundColor="$blue2" borderRadius="$4" borderWidth={1} borderColor="$blue6" padding="$5" elevation={1}>
        <YStack gap="$3">
          <YStack gap="$1">
            <H3 fontSize="$5" fontWeight="600" color="$blue11">
              Your Manager Code
            </H3>
            <Text fontSize="$3" color="$blue10">
              Share this code with contractors to add them to your projects
            </Text>
          </YStack>

          <XStack gap="$2" alignItems="center">
            <Card
              backgroundColor="white"
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
                {managerCode || 'Loading...'}
              </Text>
            </Card>
            <TamaguiButton
              size="$3"
              icon={<Copy size={16} />}
              backgroundColor="$blue9"
              color="white"
              onPress={copyManagerCode}
              disabled={!managerCode}
            >
              Copy
            </TamaguiButton>
          </XStack>
        </YStack>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" elevation={1}>
          <YStack gap="$3">
            <H3 fontSize="$5" fontWeight="600" color="$color12">
              Pending Broker Invitations ({pendingInvitations.length})
            </H3>
            <YStack gap="$2">
              {pendingInvitations.map(inv => {
                const metadata = inv.metadata as Record<string, unknown>;
                return (
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
                        <Text fontSize="$3" fontWeight="600" color="$color12">
                          {metadata?.name || inv.invitee_email}
                        </Text>
                        <Text fontSize="$2" color="$color11">
                          {inv.invitee_email}
                        </Text>
                        {metadata?.company && (
                          <Text fontSize="$2" color="$color10">
                            {metadata.company}
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
                );
              })}
            </YStack>
          </YStack>
        </Card>
      )}

      {/* Help Text */}
      <Card backgroundColor="$gray2" borderRadius="$4" borderWidth={1} borderColor="$gray6" padding="$4">
        <YStack gap="$2">
          <XStack gap="$2" alignItems="center">
            <AlertCircle size={16} color="$color11" />
            <Text fontSize="$3" fontWeight="600" color="$color12">
              About Broker Connections
            </Text>
          </XStack>
          <Text fontSize="$2" color="$color11">
            You can only have one insurance broker. Once connected, your broker will be able to manage your insurance policies and compliance requirements.
          </Text>
        </YStack>
      </Card>
    </YStack>
  );
}

