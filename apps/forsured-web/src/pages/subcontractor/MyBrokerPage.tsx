/**
 * My Broker Page - Subcontractor View
 *
 * Allows subcontractors to:
 * - Invite their broker to Forsured
 * - Connect using broker's relationship code
 * - View current broker connections
 * - See referral credits earned
 */

import { useState, useEffect, useCallback } from 'react';
import { Stack, Row, Text, Card, Button, Input, Spinner, H1, H3 } from '@scaffald/ui';
import { Mail, Copy, Clock, CheckCircle, AlertCircle, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'sonner';
import {
  createRelationshipInvitation,
  connectByRelationshipCode,
  getUserInvitations,
  type RelationshipInvitation,
} from '../../lib/relationshipInvitations';
import { getUserOrganizationId } from '../../lib/supabase';
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
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<RelationshipInvitation[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [connectedBrokers, setConnectedBrokers] = useState<BrokerInfo[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<RelationshipInvitation[]>([]);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    name: '',
    company: '',
    phone: '',
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  // Connect form state
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [brokerCode, setBrokerCode] = useState('');
  const [connectingByCode, setConnectingByCode] = useState(false);

  // Manual broker creation state
  const [showManualBrokerModal, setShowManualBrokerModal] = useState(false);

  const userId = currentUser?.id ?? user?.id ?? null;

  // Fetch organization ID
  useEffect(() => {
    async function fetchOrganization() {
      if (!userId) return;

      try {
        const orgId = await getUserOrganizationId(userId);
        setOrganizationId(orgId);
      } catch (error) {
        console.error('[MyBrokerPage] Error fetching organization:', error);
      }
    }

    fetchOrganization();
  }, [userId]);

  // Fetch invitations and connected brokers
  const fetchInvitations = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const userInvitations = await getUserInvitations(userId);
      // Filter for broker invitations
      const brokerInvitations = userInvitations.filter(
        (inv) => inv.invitee_type === 'broker' || inv.inviter_type === 'broker'
      );
      setInvitations(brokerInvitations);

      // Extract connected brokers
      const connected = brokerInvitations
        .filter((inv) => inv.status === 'connected')
        .map((inv) => {
          const metadata = inv.metadata as Record<string, unknown>;
          return {
            id: inv.id,
            name: inv.invitee_name || inv.invitee_email,
            company: inv.invitee_company || '',
            email: inv.invitee_email,
            phone: (metadata?.phone as string) || undefined,
            status: 'connected' as const,
          };
        });
      setConnectedBrokers(connected);

      // Extract pending invitations
      const pending = brokerInvitations.filter((inv) => inv.status === 'pending');
      setPendingInvitations(pending);
    } catch (error) {
      console.error('[MyBrokerPage] Error fetching invitations:', error);
      toast.error('Failed to load broker information');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleSendInvitation = async () => {
    if (!userId || !organizationId) {
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
        inviterUserId: userId,
        inviterType: 'subcontractor',
        inviteeEmail: inviteFormData.email.trim(),
        inviteeName: inviteFormData.name.trim(),
        inviteeCompany: inviteFormData.company.trim(),
        inviteePhone: inviteFormData.phone.trim(),
        inviteeType: 'broker',
        connectionMethod: 'both',
      });

      toast.success('Broker invitation sent!', {
        description: `${inviteFormData.name} can connect using your broker code`,
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

  const handleConnectByCode = async () => {
    if (!userId || !organizationId) {
      toast.error('Unable to connect. Please ensure you are logged in.');
      return;
    }

    if (!brokerCode.trim()) {
      toast.error('Please enter a broker code');
      return;
    }

    setConnectingByCode(true);

    try {
      const result = await connectByRelationshipCode(brokerCode.trim(), organizationId, userId);

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
