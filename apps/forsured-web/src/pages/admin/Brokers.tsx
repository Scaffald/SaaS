// src/pages/admin/Brokers.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Mail, RefreshCcw, Send } from 'lucide-react';
import { YStack, XStack, Text, Button, H1, H3, Card, Spinner } from '@unicornlove/ui';
import { EmptyState } from '@unicornlove/ui';
import { useAuth } from '../../contexts/AuthContext';
import { logAdminAction, AUDIT_ACTIONS } from '../../services/auditLogService';
import InvitationForm from '../../components/admin/InvitationForm';
import {
  listInvitations,
  createInvitation,
  revokeInvitation,
  Invitation,
} from '../../lib/invitations';

type InvitationStatus = 'active' | 'used' | 'expired' | 'revoked';

interface DisplayInvitation extends Invitation {
  status: InvitationStatus;
}

function getInvitationStatus(inv: Invitation): InvitationStatus {
  if (inv.use_count >= inv.max_uses) return 'used';
  if (new Date(inv.expires_at) < new Date()) return 'expired';
  // Revoked is when max_uses was set to 0 or current use_count
  if (inv.max_uses === 0) return 'revoked';
  return 'active';
}

function AdminBrokers() {
  const { user, profile } = useAuth();
  const [invitations, setInvitations] = useState<DisplayInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvitationForm, setShowInvitationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listInvitations();
      const withStatus = data.map((inv) => ({
        ...inv,
        status: getInvitationStatus(inv),
      }));
      setInvitations(withStatus);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invitations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleCreateInvitation = async (data: {
    email: string;
    expiresAt: string;
    maxUses: number;
  }) => {
    if (!profile?.id) {
      alert('User profile not found');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate expiry days from the date
      const expiresDate = new Date(data.expiresAt);
      const now = new Date();
      const diffTime = expiresDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const newInvitation = await createInvitation({
        email: data.email || undefined,
        maxUses: data.maxUses,
        expiresInDays: diffDays > 0 ? diffDays : 30,
        createdBy: profile.id,
      });

      // Log the action
      await logAdminAction({
        admin_user_id: user?.id || profile.id,
        action: AUDIT_ACTIONS.INVITATION_CREATED,
        target_type: 'broker_invitation',
        target_id: newInvitation.id,
        new_value: newInvitation,
      });

      setInvitations((prev) => [
        { ...newInvitation, status: 'active' as InvitationStatus },
        ...prev,
      ]);
      setShowInvitationForm(false);
    } catch (err) {
      console.error('Failed to create invitation:', err);
      alert(err instanceof Error ? err.message : 'Failed to create invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    setActionInProgress(id);
    try {
      await revokeInvitation(id);

      // Log the action
      await logAdminAction({
        admin_user_id: user?.id || profile?.id || '',
        action: AUDIT_ACTIONS.INVITATION_REVOKED,
        target_type: 'broker_invitation',
        target_id: id,
      });

      setInvitations((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: 'revoked' as InvitationStatus } : inv))
      );
    } catch (err) {
      console.error('Failed to revoke invitation:', err);
      alert(err instanceof Error ? err.message : 'Failed to revoke invitation');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResendInvitation = async (id: string) => {
    const invitation = invitations.find((inv) => inv.id === id);
    if (!invitation?.email) {
      alert('No email associated with this invitation');
      return;
    }

    setActionInProgress(id);
    try {
      // Log the action (actual email sending would be a backend function)
      await logAdminAction({
        admin_user_id: user?.id || profile?.id || '',
        action: AUDIT_ACTIONS.INVITATION_RESENT,
        target_type: 'broker_invitation',
        target_id: id,
      });

      alert(`Invitation email would be resent to ${invitation.email}`);
    } catch (err) {
      console.error('Failed to resend invitation:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  if (isLoading && invitations.length === 0) {
    return (
      <YStack alignItems="center" justifyContent="center" paddingVertical="$12">
        <XStack alignItems="center" gap="$2">
          <Spinner size="large" color="$blue10" />
          <Text>Loading invitations...</Text>
        </XStack>
      </YStack>
    );
  }

  if (error) {
    return (
      <Card padding="$6" borderRadius="$4" backgroundColor="$red4">
        <Text color="$red11">Error: {error}</Text>
        <Button onPress={fetchInvitations} marginTop="$2" backgroundColor="transparent" padding={0}>
          <Text color="$blue10" textDecorationLine="underline">Try again</Text>
        </Button>
      </Card>
    );
  }

  return (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <H1 fontSize="$8" fontWeight="700">Broker Invitations</H1>
        <XStack gap="$3">
          <Button
            onPress={fetchInvitations}
            disabled={isLoading}
            icon={isLoading ? <Spinner size="small" /> : <RefreshCcw size={16} />}
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderWidth={1}
            borderRadius="$4"
            hoverStyle={{ backgroundColor: "$backgroundHover" }}
            opacity={isLoading ? 0.5 : 1}
          >
            Refresh
          </Button>
          <Button
            onPress={() => setShowInvitationForm(true)}
            paddingHorizontal="$4"
            paddingVertical="$2"
            backgroundColor="$blue10"
            color="white"
            borderRadius="$4"
            hoverStyle={{ backgroundColor: "$blue11" }}
          >
            Create Invitation
          </Button>
        </XStack>
      </XStack>

      {showInvitationForm && (
        <InvitationForm
          onSubmit={handleCreateInvitation}
          onCancel={() => setShowInvitationForm(false)}
          isLoading={isSubmitting}
        />
      )}

      <Card padding="$6" borderRadius="$4" elevation={1} backgroundColor="$background" marginBottom="$6">
        {invitations.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No broker invitations yet"
            description="Create your first invitation to start onboarding insurance brokers to the platform."
            action={{
              label: "Create Invitation",
              onClick: () => setShowInvitationForm(true),
            }}
          />
        ) : (
          <table style={{ width: '100%', minWidth: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Code</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Expires</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Usage</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text fontFamily="$mono">{inv.code}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text>{inv.email || 'Any'}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text>{new Date(inv.expires_at).toLocaleDateString()}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text>{inv.use_count}/{inv.max_uses}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <XStack
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      backgroundColor={
                        inv.status === 'active'
                          ? '$green4'
                          : inv.status === 'used'
                            ? '$blue4'
                            : inv.status === 'expired'
                              ? '$backgroundHover'
                              : '$red4'
                      }
                    >
                      <Text fontSize="$1" textTransform="capitalize" color={
                        inv.status === 'active'
                          ? '$green11'
                          : inv.status === 'used'
                            ? '$blue11'
                            : inv.status === 'expired'
                              ? '$color11'
                              : '$red11'
                      }>
                        {inv.status}
                      </Text>
                    </XStack>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text>{new Date(inv.created_at).toLocaleDateString()}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    {inv.status === 'active' && (
                      <XStack alignItems="center" gap="$2">
                        {inv.email && (
                          <Button
                            onPress={() => handleResendInvitation(inv.id)}
                            disabled={actionInProgress === inv.id}
                            backgroundColor="transparent"
                            padding="$1"
                            hoverStyle={{ backgroundColor: "$backgroundHover" }}
                            opacity={actionInProgress === inv.id ? 0.5 : 1}
                          >
                            {actionInProgress === inv.id ? (
                              <Spinner size="small" color="$blue10" />
                            ) : (
                              <Mail size={16} color="$blue10" />
                            )}
                          </Button>
                        )}
                        <Button
                          onPress={() => handleRevokeInvitation(inv.id)}
                          disabled={actionInProgress === inv.id}
                          backgroundColor="transparent"
                          padding="$1"
                          hoverStyle={{ backgroundColor: "$backgroundHover" }}
                          opacity={actionInProgress === inv.id ? 0.5 : 1}
                        >
                          {actionInProgress === inv.id ? (
                            <Spinner size="small" color="$red10" />
                          ) : (
                            <Trash2 size={16} color="$red10" />
                          )}
                        </Button>
                      </XStack>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </YStack>
  );
}

export default AdminBrokers;
