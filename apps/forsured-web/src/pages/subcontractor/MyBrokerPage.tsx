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
import { YStack, XStack, Text, Card, Button as UIButton, Input, Spinner } from '@unicornlove/ui';
import { Mail, Phone, Building2, Copy, CheckCircle, AlertCircle, Briefcase } from 'lucide-react';
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
import Button from '../../components/Common/Button';

export default function MyBrokerPage() {
  const { user } = useAuth();
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<RelationshipInvitation[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Invite form state
  const [brokerEmail, setBrokerEmail] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [brokerCompany, setBrokerCompany] = useState('');
  const [brokerPhone, setBrokerPhone] = useState('');

  // Connect form state
  const [connectionCode, setConnectionCode] = useState('');

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

  // Fetch invitations
  const fetchInvitations = useCallback(async () => {
    if (!userId) return;

    try {
      const userInvitations = await getUserInvitations(userId);
      // Filter for broker invitations
      const brokerInvitations = userInvitations.filter(
        inv => inv.invitee_type === 'broker' || inv.inviter_type === 'broker'
      );
      setInvitations(brokerInvitations);
    } catch (error) {
      console.error('[MyBrokerPage] Error fetching invitations:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleInviteBroker = async () => {
    if (!userId || !organizationId) {
      toast.error('Unable to send invitation. Please ensure you are logged in.');
      return;
    }

    if (!brokerEmail.trim()) {
      toast.error('Broker email is required');
      return;
    }

    if (!brokerName.trim()) {
      toast.error('Broker name is required');
      return;
    }

    setLoading(true);

    try {
      const invitation = await createRelationshipInvitation({
        inviterOrgId: organizationId,
        inviterUserId: userId,
        inviterType: 'subcontractor',
        inviteeEmail: brokerEmail.trim(),
        inviteeName: brokerName.trim(),
        inviteeCompany: brokerCompany.trim(),
        inviteePhone: brokerPhone.trim(),
        inviteeType: 'broker',
        connectionMethod: 'both',
      });

      toast.success('Broker invitation sent!', {
        description: `Your broker can connect using code ${invitation.relationship_code} or via email.`,
      });

      // Reset form
      setBrokerEmail('');
      setBrokerName('');
      setBrokerCompany('');
      setBrokerPhone('');

      // Refresh invitations
      await fetchInvitations();
    } catch (error) {
      console.error('[MyBrokerPage] Error inviting broker:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectByCode = async () => {
    if (!userId || !organizationId) {
      toast.error('Unable to connect. Please ensure you are logged in.');
      return;
    }

    if (!connectionCode.trim()) {
      toast.error('Connection code is required');
      return;
    }

    setLoading(true);

    try {
      const result = await connectByRelationshipCode(
        connectionCode.trim(),
        organizationId,
        userId
      );

      if (result.success) {
        toast.success('Connected to broker successfully!');
        setConnectionCode('');
        await fetchInvitations();
      } else {
        toast.error(result.error || 'Failed to connect using code');
      }
    } catch (error) {
      console.error('[MyBrokerPage] Error connecting by code:', error);
      toast.error('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const connectedBrokers = invitations.filter(inv => inv.status === 'connected');
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  return (
    <YStack gap="$6" padding="$6">
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="700" color="$color12">
          My Broker
        </Text>
        <Text color="$color11">
          Invite your insurance broker to Forsured or connect using their code
        </Text>
      </YStack>

      {/* Connected Brokers */}
      {connectedBrokers.length > 0 && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          padding="$6"
        >
          <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
            Connected Brokers
          </Text>
          <YStack gap="$3">
            {connectedBrokers.map(inv => (
              <Card
                key={inv.id}
                backgroundColor="$green2"
                borderColor="$green6"
                borderWidth={1}
                borderRadius="$3"
                padding="$4"
              >
                <XStack alignItems="center" gap="$2" marginBottom="$2">
                  <CheckCircle size={20} color="var(--green10)" />
                  <Text fontSize="$4" fontWeight="600" color="$color12">
                    {inv.inviter_type === 'broker' ? inv.invitee_name : inv.invitee_name || inv.invitee_email}
                  </Text>
                </XStack>
                {inv.invitee_company && (
                  <Text fontSize="$3" color="$color11">
                    {inv.invitee_company}
                  </Text>
                )}
                {inv.referral_credit_granted && (
                  <XStack alignItems="center" gap="$2" marginTop="$2">
                    <Text fontSize="$2" color="$green11" fontWeight="500">
                      ✓ Referral credit earned
                    </Text>
                  </XStack>
                )}
              </Card>
            ))}
          </YStack>
        </Card>
      )}

      {/* Invite Broker */}
      <Card
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        padding="$6"
      >
        <XStack alignItems="center" gap="$3" marginBottom="$4">
          <Mail size={24} color="var(--blue10)" />
          <Text fontSize="$6" fontWeight="600" color="$color12">
            Invite Your Broker
          </Text>
        </XStack>
        <Text color="$color11" marginBottom="$4">
          Enter your broker's information. They can connect using your email or the generated connection code.
        </Text>

        <YStack gap="$4">
          <Input
            label="Broker Email *"
            type="email"
            value={brokerEmail}
            onChangeText={setBrokerEmail}
            placeholder="broker@example.com"
            disabled={loading}
          />
          <Input
            label="Broker Name *"
            type="text"
            value={brokerName}
            onChangeText={setBrokerName}
            placeholder="John Doe"
            disabled={loading}
          />
          <Input
            label="Broker Company"
            type="text"
            value={brokerCompany}
            onChangeText={setBrokerCompany}
            placeholder="ABC Insurance Agency"
            disabled={loading}
          />
          <Input
            label="Broker Phone (Optional)"
            type="tel"
            value={brokerPhone}
            onChangeText={setBrokerPhone}
            placeholder="(555) 123-4567"
            disabled={loading}
          />

          <UIButton
            onPress={handleInviteBroker}
            disabled={loading || !brokerEmail || !brokerName}
          >
            {loading ? <Spinner size="small" /> : 'Send Invitation'}
          </UIButton>
        </YStack>
      </Card>

      {/* Connect Using Broker's Code */}
      <Card
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        padding="$6"
      >
        <XStack alignItems="center" gap="$3" marginBottom="$4">
          <Briefcase size={24} color="var(--blue10)" />
          <Text fontSize="$6" fontWeight="600" color="$color12">
            Connect Using Broker's Code
          </Text>
        </XStack>
        <Text color="$color11" marginBottom="$4">
          If your broker gave you a connection code, enter it here to connect.
        </Text>

        <YStack gap="$4">
          <Input
            label="Connection Code"
            type="text"
            value={connectionCode}
            onChangeText={setConnectionCode}
            placeholder="BKR-XXXXXX"
            disabled={loading}
          />

          <UIButton
            onPress={handleConnectByCode}
            disabled={loading || !connectionCode}
          >
            {loading ? <Spinner size="small" /> : 'Connect'}
          </UIButton>
        </YStack>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          padding="$6"
        >
          <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
            Pending Invitations
          </Text>
          <YStack gap="$3">
            {pendingInvitations.map(inv => (
              <Card
                key={inv.id}
                backgroundColor="$yellow2"
                borderColor="$yellow6"
                borderWidth={1}
                borderRadius="$3"
                padding="$4"
              >
                <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                  <YStack flex={1}>
                    <Text fontSize="$4" fontWeight="600" color="$color12">
                      {inv.invitee_name || inv.invitee_email}
                    </Text>
                    {inv.invitee_company && (
                      <Text fontSize="$3" color="$color11">
                        {inv.invitee_company}
                      </Text>
                    )}
                  </YStack>
                  <AlertCircle size={20} color="var(--yellow10)" />
                </XStack>
                
                <XStack alignItems="center" gap="$2" marginTop="$2">
                  <Text fontSize="$3" color="$color11" fontFamily="$mono">
                    {inv.relationship_code}
                  </Text>
                  <UIButton
                    size="small"
                    variant="ghost"
                    onPress={() => copyCode(inv.relationship_code)}
                  >
                    <Copy size={16} />
                  </UIButton>
                </XStack>
                
                <Text fontSize="$2" color="$color10" marginTop="$2">
                  Invited {new Date(inv.invited_at).toLocaleDateString()}
                </Text>
              </Card>
            ))}
          </YStack>
        </Card>
      )}
    </YStack>
  );
}

