// src/pages/admin/Brokers.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Mail, RefreshCcw, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading invitations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
        <button onClick={fetchInvitations} className="mt-2 text-blue-500 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-brokers-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Broker Invitations</h1>
        <div className="flex space-x-3">
          <button
            onClick={fetchInvitations}
            disabled={isLoading}
            className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCcw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowInvitationForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Invitation
          </button>
        </div>
      </div>

      {showInvitationForm && (
        <InvitationForm
          onSubmit={handleCreateInvitation}
          onCancel={() => setShowInvitationForm(false)}
          isLoading={isSubmitting}
        />
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No invitations yet. Create one to invite brokers to the platform.
          </div>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Code</th>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Expires</th>
                <th className="py-2 px-4 border-b text-left">Usage</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Created</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2 px-4 border-b font-mono">{inv.code}</td>
                  <td className="py-2 px-4 border-b">{inv.email || 'Any'}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {inv.use_count}/{inv.max_uses}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs capitalize ${
                        inv.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : inv.status === 'used'
                            ? 'bg-blue-100 text-blue-700'
                            : inv.status === 'expired'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {inv.status === 'active' && (
                      <div className="flex items-center space-x-2">
                        {inv.email && (
                          <button
                            onClick={() => handleResendInvitation(inv.id)}
                            disabled={actionInProgress === inv.id}
                            className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                            title="Resend email"
                          >
                            {actionInProgress === inv.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Mail size={16} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          disabled={actionInProgress === inv.id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Revoke invitation"
                        >
                          {actionInProgress === inv.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminBrokers;
