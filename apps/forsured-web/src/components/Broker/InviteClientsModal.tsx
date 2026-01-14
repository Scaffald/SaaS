import { useState } from 'react';
import { X, Mail, Copy, Clock, Loader2, Building2, HardHat } from 'lucide-react';
import { Stack, Row, Text, Card, Input, Button } from '@unicornlove/beyond-ui';
import { toast } from 'sonner';
import {
  createRelationshipInvitation,
  type RelationshipInvitation,
} from '../../lib/relationshipInvitations';

interface InviteClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokerCode: string;
  pendingInvitations: RelationshipInvitation[];
  userId: string;
  organizationId: string;
  onInvitationSent: () => void;
}

// Orange button styles for visibility
const orangeButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-orange-9)',
  color: 'white',
  border: 'none',
  fontWeight: 600,
};

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
  fontWeight: 600,
  borderRadius: 8,
  border: 'none',
  backgroundColor: isSelected ? 'var(--color-orange-9)' : 'var(--color-gray-3)',
  color: isSelected ? 'white' : 'var(--color-text-muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export default function InviteClientsModal({
  isOpen,
  onClose,
  brokerCode,
  pendingInvitations,
  userId,
  organizationId,
  onInvitationSent,
}: InviteClientsModalProps) {
  const [inviteClientType, setInviteClientType] = useState<'manager' | 'subcontractor'>('manager');
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    name: '',
    company: '',
    phone: '',
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  if (!isOpen) return null;

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !organizationId) {
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
        inviterUserId: userId,
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

      onInvitationSent();
    } catch (error) {
      console.error('[InviteClientsModal] Error sending invitation:', error);
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack gap={4}>
            <Text size="lg" weight="bold" style={{ color: 'var(--color-text)' }}>
              Invite Clients
            </Text>
            <Text size="sm" muted>
              Invite managers or contractors to connect as your clients
            </Text>
          </Stack>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          <Stack gap={24}>
            {/* Broker Code Display */}
            <Stack gap={8}>
              <Text size="sm" weight="medium" muted>
                Your Broker Code
              </Text>
              <Row gap={8} alignItems="center">
                <Card
                  style={{
                    backgroundColor: 'var(--color-orange-2)',
                    border: '1px solid var(--color-orange-6)',
                    borderRadius: 8,
                    padding: 12,
                    flex: 1,
                  }}
                >
                  <Text
                    size="lg"
                    weight="bold"
                    style={{ color: 'var(--color-orange-11)', fontFamily: 'monospace', textAlign: 'center' }}
                  >
                    {brokerCode || 'Loading...'}
                  </Text>
                </Card>
                <Button
                  onPress={copyBrokerCode}
                  disabled={!brokerCode}
                  iconStart={Copy}
                  style={orangeButtonStyle}
                >
                  Copy
                </Button>
              </Row>
              <Text size="xs" muted>
                Share this code with clients so they can connect with you
              </Text>
            </Stack>

            {/* Invitation Form */}
            <Stack gap={12} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
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
                        <Building2 size={16} />
                        Manager
                      </button>
                      <button
                        type="button"
                        onClick={() => setInviteClientType('subcontractor')}
                        style={clientTypeButtonStyle(inviteClientType === 'subcontractor')}
                      >
                        <HardHat size={16} />
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
                      ...orangeButtonStyle,
                      opacity: sendingInvite || !inviteFormData.email || !inviteFormData.name ? 0.5 : 1,
                    }}
                  >
                    <Row alignItems="center" gap={8}>
                      {sendingInvite ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                      <span>{sendingInvite ? 'Sending...' : 'Send Invitation'}</span>
                    </Row>
                  </Button>
                </Stack>
              </form>
            </Stack>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <Stack gap={12} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
                <Text size="md" weight="semibold">
                  Pending Invitations ({pendingInvitations.length})
                </Text>
                <Stack gap={8}>
                  {pendingInvitations.map(inv => (
                    <Card
                      key={inv.id}
                      style={{
                        backgroundColor: 'var(--color-gray-1)',
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
                                backgroundColor: inv.invitee_type === 'manager' ? 'var(--color-purple-2)' : 'var(--color-blue-2)',
                                color: inv.invitee_type === 'manager' ? 'var(--color-purple-11)' : 'var(--color-blue-11)',
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
        </div>
      </div>
    </div>
  );
}
