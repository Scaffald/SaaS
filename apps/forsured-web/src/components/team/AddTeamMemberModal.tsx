/**
 * AddTeamMemberModal - Modal wrapper for AddTeamMemberForm
 * Team Member Management UI
 * TASK-3: Implement Add Team Member Form with Email Invitation
 *
 * Modal that opens when "Invite Member" button is clicked.
 */

'use client';

import React, { useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Stack, Row, Text, Button, Card, H2 } from '@unicornlove/beyond-ui';
import { AddTeamMemberForm } from './AddTeamMemberForm';
import type { AccessLevel } from './AccessLevelSelector';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; name: string; role: AccessLevel }) => Promise<void>;
  loading?: boolean;
  existingEmails?: string[];
}

export function AddTeamMemberModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  existingEmails = [],
}: AddTeamMemberModalProps) {
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, loading]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-modal-title"
      onClick={handleBackdropClick}
    >
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: 448,
          marginLeft: 16,
          marginRight: 16,
        }}
        onPress={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <Row
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Row style={{ alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'var(--color-blue-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={20} color="var(--color-blue-10)" />
            </div>
            <Stack>
              <H2
                id="add-member-modal-title"
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--color-gray-12)',
                }}
              >
                Invite Team Member
              </H2>
              <Text style={{ fontSize: 14, color: 'var(--color-gray-10)' }}>
                Send an invitation to join your team
              </Text>
            </Stack>
          </Row>

          {/* Close Button */}
          <Button
            onPress={onClose}
            disabled={loading}
            variant="outline"
            size="sm"
            style={{ padding: 4, opacity: loading ? 0.5 : 1 }}
            aria-label="Close modal"
          >
            <X size={20} />
          </Button>
        </Row>

        {/* Form Content */}
        <Stack style={{ padding: 16 }}>
          <AddTeamMemberForm
            onSubmit={onSubmit}
            onCancel={onClose}
            loading={loading}
            existingEmails={existingEmails}
          />
        </Stack>
      </Card>
    </div>
  );
}

export default AddTeamMemberModal;
