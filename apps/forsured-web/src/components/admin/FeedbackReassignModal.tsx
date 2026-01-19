/**
 * FeedbackReassignModal - Modal for reassigning feedback to another admin
 */

import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { Stack, Row, Text, Button, SearchSelect } from '@unicornlove/beyond-ui';
import { toast } from 'sonner';
import { trpc } from '../../lib/trpc';

interface FeedbackReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbackId: string;
  currentAssigneeId?: string | null;
  onSuccess: () => void;
}

export function FeedbackReassignModal({
  isOpen,
  onClose,
  feedbackId,
  currentAssigneeId,
  onSuccess,
}: FeedbackReassignModalProps) {
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [reassigning, setReassigning] = useState(false);

  // Fetch admin users
  const { data: adminUsers, isLoading: loadingAdmins } = trpc.feedback.admin.getAdminUsers.useQuery(
    undefined,
    { enabled: isOpen }
  );

  // Reassign mutation
  const reassignMutation = trpc.feedback.admin.reassign.useMutation();

  // Handle reassign
  const handleReassign = async () => {
    if (!selectedAdminId) {
      toast.error('Please select an admin to reassign to');
      return;
    }

    setReassigning(true);
    try {
      await reassignMutation.mutateAsync({
        feedbackId,
        assignToUserId: selectedAdminId,
      });

      toast.success('Feedback reassigned', {
        description: 'The admin will be notified by email.',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to reassign:', error);
      toast.error('Failed to reassign feedback');
    } finally {
      setReassigning(false);
    }
  };

  // Filter out current assignee from options
  const availableAdmins = (adminUsers || []).filter((admin) => admin.id !== currentAssigneeId);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Reassign feedback"
      onClick={(e) => {
        if (e.target === e.currentTarget && !reassigning) {
          onClose();
        }
      }}
    >
      <Stack
        style={{
          width: 400,
          maxWidth: '90%',
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <Row
          style={{
            padding: 16,
            borderBottom: '1px solid var(--color-border)',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <UserPlus size={20} color="var(--color-blue-9)" />
            <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Reassign Feedback
            </Text>
          </Row>
          <Button
            onPress={onClose}
            variant="ghost"
            disabled={reassigning}
            style={{ padding: 4 }}
          >
            <X size={20} color="var(--color-gray-10)" />
          </Button>
        </Row>

        {/* Content */}
        <Stack style={{ padding: 16, gap: 16 }}>
          <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>
            Select an admin to reassign this feedback item to. They will receive an email notification.
          </Text>

          {loadingAdmins ? (
            <Stack style={{ alignItems: 'center', padding: 16 }}>
              <Text style={{ color: 'var(--color-gray-9)' }}>Loading admins...</Text>
            </Stack>
          ) : availableAdmins.length === 0 ? (
            <Stack style={{ alignItems: 'center', padding: 16 }}>
              <Text style={{ color: 'var(--color-gray-9)' }}>No other admins available</Text>
            </Stack>
          ) : (
            <SearchSelect
              value={selectedAdminId}
              onChange={setSelectedAdminId}
              placeholder="Select an admin..."
              searchable={false}
              options={availableAdmins.map((admin) => ({
                value: admin.id,
                label: `${admin.name || 'Unknown'} (${admin.email || 'no email'})`,
              }))}
            />
          )}
        </Stack>

        {/* Actions */}
        <Row
          style={{
            padding: 16,
            borderTop: '1px solid var(--color-border)',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <Button onPress={onClose} variant="ghost" disabled={reassigning}>
            Cancel
          </Button>
          <Button
            onPress={handleReassign}
            variant="default"
            disabled={reassigning || !selectedAdminId}
          >
            {reassigning ? (
              <Row style={{ alignItems: 'center', gap: 6 }}>
                <Loader2 size={16} className="animate-spin" />
                <Text>Reassigning...</Text>
              </Row>
            ) : (
              'Reassign'
            )}
          </Button>
        </Row>
      </Stack>
    </div>
  );
}

export default FeedbackReassignModal;
