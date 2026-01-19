import { useState } from 'react';
import { X, Clock, Building2, HardHat, RefreshCw, Loader2 } from 'lucide-react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
import { toast } from 'sonner';
import {
  resendRelationshipInvitation,
  type RelationshipInvitation,
} from '../../lib/relationshipInvitations';
import { emailService } from '../../services/emailService';
import { useAuth } from '../../contexts/AuthContext';

// Orange button styles with explicit colors for visibility
const resendButtonStyle: React.CSSProperties = {
  backgroundColor: '#ea580c', // Tailwind orange-600
  color: 'white',
  border: 'none',
  fontWeight: 600,
};

interface PendingInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingInvitations: RelationshipInvitation[];
  onInvitationResent: () => void;
}

export default function PendingInvitationsModal({
  isOpen,
  onClose,
  pendingInvitations,
  onInvitationResent,
}: PendingInvitationsModalProps) {
  const { user } = useAuth();
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const isInvitationOld = (invitation: RelationshipInvitation): boolean => {
    const invitedAt = new Date(invitation.invited_at);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return invitedAt < oneDayAgo;
  };

  const handleResend = async (invitation: RelationshipInvitation) => {
    if (!user?.id) {
      toast.error('Unable to resend invitation. Please ensure you are logged in.');
      return;
    }

    setResendingIds((prev) => new Set(prev).add(invitation.id));

    try {
      // Update the invitation in the database
      const updated = await resendRelationshipInvitation(invitation.id, user.id);

      // Send the email
      await emailService.sendRelationshipInvitation({
        email: invitation.invitee_email,
        inviteeName: invitation.invitee_name,
        inviterName: user.name || user.email || 'Your Broker',
        inviterType: invitation.inviter_type,
        inviteeType: invitation.invitee_type,
        relationshipCode: invitation.relationship_code,
      });

      toast.success('Invitation resent!', {
        description: `A new invitation email has been sent to ${invitation.invitee_email}`,
      });

      onInvitationResent();
    } catch (error) {
      console.error('[PendingInvitationsModal] Error resending invitation:', error);
      toast.error('Failed to resend invitation. Please try again.');
    } finally {
      setResendingIds((prev) => {
        const next = new Set(prev);
        next.delete(invitation.id);
        return next;
      });
    }
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
          maxWidth: 600,
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
              Pending Invitations ({pendingInvitations.length})
            </Text>
            <Text size="sm" muted>
              View and manage your pending client invitations
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
          {pendingInvitations.length === 0 ? (
            <Stack gap={16} alignItems="center" style={{ padding: '40px 20px' }}>
              <Clock size={48} style={{ color: 'var(--color-gray-8)' }} />
              <Text size="md" muted>
                No pending invitations
              </Text>
            </Stack>
          ) : (
            <Stack gap={12}>
              {pendingInvitations.map((inv) => {
                const isOld = isInvitationOld(inv);
                const isResending = resendingIds.has(inv.id);
                const invitedDate = new Date(inv.invited_at);
                const daysOld = Math.floor(
                  (Date.now() - invitedDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <Card
                    key={inv.id}
                    style={{
                      backgroundColor: 'var(--color-gray-1)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <Row justifyContent="space-between" alignItems="flex-start">
                      <Stack gap={8} style={{ flex: 1 }}>
                        <Row gap={8} alignItems="center">
                          <Text size="sm" weight="semibold">
                            {inv.metadata?.name || inv.invitee_name || inv.invitee_email}
                          </Text>
                          <span
                            style={{
                              fontSize: 12,
                              padding: '2px 8px',
                              borderRadius: 4,
                              backgroundColor:
                                inv.invitee_type === 'manager'
                                  ? 'var(--color-purple-2)'
                                  : 'var(--color-blue-2)',
                              color:
                                inv.invitee_type === 'manager'
                                  ? 'var(--color-purple-11)'
                                  : 'var(--color-blue-11)',
                            }}
                          >
                            {inv.invitee_type === 'manager' ? (
                              <>
                                <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                                Manager
                              </>
                            ) : (
                              <>
                                <HardHat size={12} style={{ display: 'inline', marginRight: 4 }} />
                                Contractor
                              </>
                            )}
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
                        <Row gap={8} alignItems="center">
                          <Clock size={12} style={{ color: 'var(--color-orange-10)' }} />
                          <Text size="xs" style={{ color: 'var(--color-orange-10)' }}>
                            Sent {daysOld === 0 ? 'today' : `${daysOld} day${daysOld > 1 ? 's' : ''} ago`}
                          </Text>
                        </Row>
                      </Stack>
                      {isOld && (
                        <button
                          type="button"
                          onClick={() => handleResend(inv)}
                          disabled={isResending}
                          style={{
                            ...resendButtonStyle,
                            padding: '10px 16px',
                            borderRadius: 8,
                            cursor: isResending ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            fontSize: 14,
                            opacity: isResending ? 0.6 : 1,
                            minWidth: 100,
                          }}
                          onMouseEnter={(e) => {
                            if (!isResending) {
                              e.currentTarget.style.backgroundColor = '#c2410c';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isResending) {
                              e.currentTarget.style.backgroundColor = '#ea580c';
                            }
                          }}
                        >
                          {isResending ? (
                            <>
                              <Loader2 size={16} className="animate-spin" style={{ color: 'white' }} />
                              Resending...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={16} style={{ color: 'white' }} />
                              Resend
                            </>
                          )}
                        </button>
                      )}
                    </Row>
                  </Card>
                );
              })}
            </Stack>
          )}
        </div>
      </div>
    </div>
  );
}
