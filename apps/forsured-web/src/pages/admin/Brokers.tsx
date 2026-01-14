// src/pages/admin/Brokers.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Mail, RefreshCcw, Send, Plus } from 'lucide-react';
import { Stack, Row, Text, Button, H1, Card, Spinner } from '@unicornlove/beyond-ui';
import { EmptyState } from '../../ui/EmptyState';
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
      <Stack style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
          <Spinner size="large" />
          <Text>Loading invitations...</Text>
        </Row>
      </Stack>
    );
  }

  if (error) {
    return (
      <Card style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-4)', backgroundColor: 'var(--color-red-4)' }}>
        <Text style={{ color: 'var(--color-red-11)' }}>Error: {error}</Text>
        <Button onPress={fetchInvitations} variant="ghost" style={{ marginTop: 'var(--space-2)', padding: 0 }}>
          <Text style={{ color: 'var(--color-blue-10)', textDecoration: 'underline' }}>Try again</Text>
        </Button>
      </Card>
    );
  }

  return (
    <Stack>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <H1 style={{ fontSize: 'var(--font-size-8)', fontWeight: 700 }}>Broker Invitations</H1>
        <Row style={{ gap: 'var(--space-3)' }}>
          <Button
            onClick={fetchInvitations}
            disabled={isLoading}
            variant="outline"
            style={{ paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', borderRadius: 'var(--radius-4)', opacity: isLoading ? 0.5 : 1 }}
          >
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
              {isLoading ? <Spinner size="small" /> : <RefreshCcw size={16} />}
              <span>Refresh</span>
            </Row>
          </Button>
          <Button
            color="primary"
            iconStart={Plus}
            onPress={() => setShowInvitationForm(true)}
          >
            Create Invitation
          </Button>
        </Row>
      </Row>

      {showInvitationForm && (
        <InvitationForm
          onSubmit={handleCreateInvitation}
          onCancel={() => setShowInvitationForm(false)}
          isLoading={isSubmitting}
        />
      )}

      <Card style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-4)', backgroundColor: 'var(--color-background)', marginBottom: 'var(--space-6)' }}>
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
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Code</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Expires</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Usage</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Text style={{ fontFamily: 'monospace' }}>{inv.code}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Text>{inv.email || 'Any'}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Text>{new Date(inv.expires_at).toLocaleDateString()}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Text>{inv.use_count}/{inv.max_uses}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Row
                      style={{
                        paddingLeft: 'var(--space-2)',
                        paddingRight: 'var(--space-2)',
                        paddingTop: 'var(--space-1)',
                        paddingBottom: 'var(--space-1)',
                        borderRadius: 'var(--radius-2)',
                        display: 'inline-flex',
                        backgroundColor:
                          inv.status === 'active'
                            ? 'var(--color-green-4)'
                            : inv.status === 'used'
                              ? 'var(--color-blue-4)'
                              : inv.status === 'expired'
                                ? 'var(--color-background-hover)'
                                : 'var(--color-red-4)'
                      }}
                    >
                      <Text style={{ fontSize: 'var(--font-size-1)', textTransform: 'capitalize', color:
                        inv.status === 'active'
                          ? 'var(--color-green-11)'
                          : inv.status === 'used'
                            ? 'var(--color-blue-11)'
                            : inv.status === 'expired'
                              ? 'var(--color-11)'
                              : 'var(--color-red-11)'
                      }}>
                        {inv.status}
                      </Text>
                    </Row>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Text>{new Date(inv.created_at).toLocaleDateString()}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    {inv.status === 'active' && (
                      <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                        {inv.email && (
                          <Button
                            onClick={() => handleResendInvitation(inv.id)}
                            disabled={actionInProgress === inv.id}
                            variant="ghost"
                            style={{ padding: 'var(--space-1)', opacity: actionInProgress === inv.id ? 0.5 : 1 }}
                          >
                            {actionInProgress === inv.id ? (
                              <Spinner size="small" />
                            ) : (
                              <Mail size={16} color="var(--color-blue-10)" />
                            )}
                          </Button>
                        )}
                        <Button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          disabled={actionInProgress === inv.id}
                          variant="ghost"
                          style={{ padding: 'var(--space-1)', opacity: actionInProgress === inv.id ? 0.5 : 1 }}
                        >
                          {actionInProgress === inv.id ? (
                            <Spinner size="small" />
                          ) : (
                            <Trash2 size={16} color="var(--color-red-10)" />
                          )}
                        </Button>
                      </Row>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Stack>
  );
}

export default AdminBrokers;
