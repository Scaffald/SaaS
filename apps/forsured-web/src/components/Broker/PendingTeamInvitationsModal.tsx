/**
 * PendingTeamInvitationsModal - Modal for viewing and managing pending team member invitations
 * Similar to PendingInvitationsModal but specifically for broker team member invitations.
 */

import { useState } from 'react';
import { Clock, Mail, Send, Shield, Users } from 'lucide-react';
import { Stack, Row, Text, Card, Button } from '@unicornlove/beyond-ui';
import { SimpleModal } from '../Common/SimpleModal';
import { toast } from 'sonner';

interface TeamInvitation {
  id: string;
  email: string;
  name?: string;
  role: string;
  status: string;
  invited_by: string;
  organization_id?: string;
  created_at: string;
}

interface PendingTeamInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingInvitations: TeamInvitation[];
  onResendInvitation: (invitationId: string) => Promise<void>;
}

export default function PendingTeamInvitationsModal({
  isOpen,
  onClose,
  pendingInvitations,
  onResendInvitation,
}: PendingTeamInvitationsModalProps) {
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set());

  // Check if invitation can be resent (1 day has passed)
  const canResendInvitation = (createdAt: string): boolean => {
    const createdDate = new Date(createdAt);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return createdDate <= oneDayAgo;
  };

  // Format date for display
  const formatInvitationDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  const handleResend = async (invitation: TeamInvitation) => {
    try {
      setResendingIds((prev) => new Set(prev).add(invitation.id));
      await onResendInvitation(invitation.id);
      toast.success('Invitation resent', {
        description: `A new invitation has been sent to ${invitation.email}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend invitation';
      toast.error('Failed to resend invitation', {
        description: errorMessage,
      });
    } finally {
      setResendingIds((prev) => {
        const next = new Set(prev);
        next.delete(invitation.id);
        return next;
      });
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-gray-1, #fafafa)',
    border: '1px solid var(--color-border, #e5e5e5)',
    borderRadius: 8,
    padding: 16,
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pending Invitations (${pendingInvitations.length})`}
      description="View and manage your pending team member invitations"
      icon={<Clock size={20} style={{ color: 'var(--color-yellow-10)' }} />}
      width={560}
      testID="pending-team-invitations-modal"
    >
      {pendingInvitations.length === 0 ? (
        <Stack gap={16} alignItems="center" style={{ padding: '40px 20px' }}>
          <Users size={48} style={{ color: 'var(--color-gray-8)' }} />
          <Text size="md" muted>
            No pending team invitations
          </Text>
        </Stack>
      ) : (
        <Stack gap={12}>
          {pendingInvitations.map((invitation) => {
            const canResend = canResendInvitation(invitation.created_at);
            const isResending = resendingIds.has(invitation.id);
            const displayName = invitation.name || invitation.email.split('@')[0] || 'Unknown';

            return (
              <Card key={invitation.id} style={cardStyle}>
                <Row justifyContent="space-between" alignItems="flex-start">
                  <Stack gap={8} style={{ flex: 1 }}>
                    <Row gap={8} alignItems="center">
                      <Stack
                        alignItems="center"
                        justifyContent="center"
                        style={{
                          width: 36,
                          height: 36,
                          backgroundColor: 'var(--color-yellow-3)',
                          borderRadius: 9999,
                        }}
                      >
                        <Clock size={16} style={{ color: 'var(--color-yellow-10)' }} />
                      </Stack>
                      <Stack gap={2}>
                        <Text size="sm" weight="semibold">
                          {displayName}
                        </Text>
                        <Row gap={4} alignItems="center">
                          <Mail size={12} style={{ color: 'var(--color-text-muted)' }} />
                          <Text size="xs" muted>
                            {invitation.email}
                          </Text>
                        </Row>
                      </Stack>
                    </Row>

                    <Row gap={12} alignItems="center" style={{ marginLeft: 44 }}>
                      <Row gap={4} alignItems="center">
                        <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
                        <Text size="xs" muted>
                          Invited {formatInvitationDate(invitation.created_at)}
                        </Text>
                      </Row>
                      <Text
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 2,
                          paddingBottom: 2,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500,
                          backgroundColor: 'var(--color-yellow-2)',
                          color: 'var(--color-yellow-11)',
                          border: '1px solid var(--color-yellow-6)',
                        }}
                      >
                        Pending
                      </Text>
                    </Row>
                  </Stack>

                  <Stack gap={4} alignItems="flex-end">
                    <Button
                      variant="ghost"
                      color="primary"
                      size="sm"
                      iconStart={Send}
                      onPress={() => handleResend(invitation)}
                      disabled={!canResend || isResending}
                    >
                      {isResending ? 'Resending...' : 'Resend'}
                    </Button>
                    {!canResend && (
                      <Text size="xs" muted style={{ maxWidth: 100, textAlign: 'right' }}>
                        Resend available in 1 day
                      </Text>
                    )}
                  </Stack>
                </Row>
              </Card>
            );
          })}
        </Stack>
      )}
    </SimpleModal>
  );
}
