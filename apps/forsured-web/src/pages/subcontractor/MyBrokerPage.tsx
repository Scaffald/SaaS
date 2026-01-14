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
import { Stack, Row, Text, Card, Button, Input, Spinner } from '@unicornlove/beyond-ui';
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
        (inv) => inv.invitee_type === 'broker' || inv.inviter_type === 'broker'
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
      const result = await connectByRelationshipCode(connectionCode.trim(), organizationId, userId);

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

  const connectedBrokers = invitations.filter((inv) => inv.status === 'connected');
  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

  return (
    <Stack style={{ gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
      <Stack style={{ gap: 'var(--space-2)' }}>
        <Text
          style={{
            fontSize: 'var(--font-size-8)',
            fontWeight: 700,
            color: 'var(--color-12)',
          }}
        >
          My Broker
        </Text>
        <Text style={{ color: 'var(--color-11)' }}>
          Invite your insurance broker to Forsured or connect using their code
        </Text>
      </Stack>

      {/* Connected Brokers */}
      {connectedBrokers.length > 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-4)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-6)',
          }}
        >
          <Text
            style={{
              fontSize: 'var(--font-size-6)',
              fontWeight: 600,
              color: 'var(--color-12)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Connected Brokers
          </Text>
          <Stack style={{ gap: 'var(--space-3)' }}>
            {connectedBrokers.map((inv) => (
              <Card
                key={inv.id}
                style={{
                  backgroundColor: 'var(--color-green-2)',
                  border: '1px solid var(--color-green-6)',
                  borderRadius: 'var(--radius-3)',
                  padding: 'var(--space-4)',
                }}
              >
                <Row
                  style={{
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <CheckCircle size={20} color="var(--color-green-10)" />
                  <Text
                    style={{
                      fontSize: 'var(--font-size-4)',
                      fontWeight: 600,
                      color: 'var(--color-12)',
                    }}
                  >
                    {inv.inviter_type === 'broker'
                      ? inv.invitee_name
                      : inv.invitee_name || inv.invitee_email}
                  </Text>
                </Row>
                {inv.invitee_company && (
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
                    {inv.invitee_company}
                  </Text>
                )}
                {inv.referral_credit_granted && (
                  <Row
                    style={{
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      marginTop: 'var(--space-2)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 'var(--font-size-2)',
                        color: 'var(--color-green-11)',
                        fontWeight: 500,
                      }}
                    >
                      Referral credit earned
                    </Text>
                  </Row>
                )}
              </Card>
            ))}
          </Stack>
        </Card>
      )}

      {/* Invite Broker */}
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-4)',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-6)',
        }}
      >
        <Row
          style={{
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <Mail size={24} color="var(--color-blue-10)" />
          <Text
            style={{
              fontSize: 'var(--font-size-6)',
              fontWeight: 600,
              color: 'var(--color-12)',
            }}
          >
            Invite Your Broker
          </Text>
        </Row>
        <Text style={{ color: 'var(--color-11)', marginBottom: 'var(--space-4)' }}>
          Enter your broker's information. They can connect using your email or the generated
          connection code.
        </Text>

        <Stack style={{ gap: 'var(--space-4)' }}>
          <Input
            label="Broker Email *"
            type="email"
            value={brokerEmail}
            onChange={(e) => setBrokerEmail(e.target.value)}
            placeholder="broker@example.com"
            disabled={loading}
          />
          <Input
            label="Broker Name *"
            type="text"
            value={brokerName}
            onChange={(e) => setBrokerName(e.target.value)}
            placeholder="John Doe"
            disabled={loading}
          />
          <Input
            label="Broker Company"
            type="text"
            value={brokerCompany}
            onChange={(e) => setBrokerCompany(e.target.value)}
            placeholder="ABC Insurance Agency"
            disabled={loading}
          />
          <Input
            label="Broker Phone (Optional)"
            type="tel"
            value={brokerPhone}
            onChange={(e) => setBrokerPhone(e.target.value)}
            placeholder="(555) 123-4567"
            disabled={loading}
          />

          <Button onPress={handleInviteBroker} disabled={loading || !brokerEmail || !brokerName}>
            {loading ? <Spinner size="sm" /> : 'Send Invitation'}
          </Button>
        </Stack>
      </Card>

      {/* Connect Using Broker's Code */}
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-4)',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-6)',
        }}
      >
        <Row
          style={{
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <Briefcase size={24} color="var(--color-blue-10)" />
          <Text
            style={{
              fontSize: 'var(--font-size-6)',
              fontWeight: 600,
              color: 'var(--color-12)',
            }}
          >
            Connect Using Broker's Code
          </Text>
        </Row>
        <Text style={{ color: 'var(--color-11)', marginBottom: 'var(--space-4)' }}>
          If your broker gave you a connection code, enter it here to connect.
        </Text>

        <Stack style={{ gap: 'var(--space-4)' }}>
          <Input
            label="Connection Code"
            type="text"
            value={connectionCode}
            onChange={(e) => setConnectionCode(e.target.value)}
            placeholder="BKR-XXXXXX"
            disabled={loading}
          />

          <Button onPress={handleConnectByCode} disabled={loading || !connectionCode}>
            {loading ? <Spinner size="sm" /> : 'Connect'}
          </Button>
        </Stack>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-4)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-6)',
          }}
        >
          <Text
            style={{
              fontSize: 'var(--font-size-6)',
              fontWeight: 600,
              color: 'var(--color-12)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Pending Invitations
          </Text>
          <Stack style={{ gap: 'var(--space-3)' }}>
            {pendingInvitations.map((inv) => (
              <Card
                key={inv.id}
                style={{
                  backgroundColor: 'var(--color-yellow-2)',
                  border: '1px solid var(--color-yellow-6)',
                  borderRadius: 'var(--radius-3)',
                  padding: 'var(--space-4)',
                }}
              >
                <Row
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <Stack style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 'var(--font-size-4)',
                        fontWeight: 600,
                        color: 'var(--color-12)',
                      }}
                    >
                      {inv.invitee_name || inv.invitee_email}
                    </Text>
                    {inv.invitee_company && (
                      <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
                        {inv.invitee_company}
                      </Text>
                    )}
                  </Stack>
                  <AlertCircle size={20} color="var(--color-yellow-10)" />
                </Row>

                <Row
                  style={{
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 'var(--font-size-3)',
                      color: 'var(--color-11)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {inv.relationship_code}
                  </Text>
                  <Button size="sm" variant="ghost" onPress={() => copyCode(inv.relationship_code)}>
                    <Copy size={16} />
                  </Button>
                </Row>

                <Text
                  style={{
                    fontSize: 'var(--font-size-2)',
                    color: 'var(--color-10)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  Invited {new Date(inv.invited_at).toLocaleDateString()}
                </Text>
              </Card>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
