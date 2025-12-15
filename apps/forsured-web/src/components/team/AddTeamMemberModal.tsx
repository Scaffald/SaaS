/**
 * AddTeamMemberModal - Modal wrapper for AddTeamMemberForm
 * REQ-283: Team Member Management UI
 * TASK-3: Implement Add Team Member Form with Email Invitation
 *
 * Modal that opens when "Invite Member" button is clicked.
 */

'use client';

import { useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import { YStack, XStack, Text, Button, Card, H2, SizableText } from '@unicornlove/ui';
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
    <YStack
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={50}
      alignItems="center"
      justifyContent="center"
      backgroundColor="rgba(0,0,0,0.5)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-modal-title"
      onClick={handleBackdropClick}
    >
      <Card
        backgroundColor="$background"
        borderRadius="$4"
        elevation={4}
        width="100%"
        maxWidth={448}
        marginHorizontal="$4"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          padding="$4"
          borderBottomWidth={1}
          borderColor="$borderColor"
        >
          <XStack alignItems="center" gap="$3">
            <YStack
              width={40}
              height={40}
              borderRadius={9999}
              backgroundColor="$blue2"
              alignItems="center"
              justifyContent="center"
            >
              <UserPlus size={20} color="var(--blue10)" />
            </YStack>
            <YStack>
              <H2
                id="add-member-modal-title"
                fontSize="$6"
                fontWeight="600"
                color="$color12"
              >
                Invite Team Member
              </H2>
              <SizableText fontSize="$3" color="$color10">
                Send an invitation to join your team
              </SizableText>
            </YStack>
          </XStack>

          {/* Close Button */}
          <Button
            onPress={onClose}
            disabled={loading}
            variant="outlined"
            size="$2"
            padding="$1"
            opacity={loading ? 0.5 : 1}
            aria-label="Close modal"
          >
            <X size={20} />
          </Button>
        </XStack>

        {/* Form Content */}
        <YStack padding="$4">
          <AddTeamMemberForm
            onSubmit={onSubmit}
            onCancel={onClose}
            loading={loading}
            existingEmails={existingEmails}
          />
        </YStack>
      </Card>
    </YStack>
  );
}

export default AddTeamMemberModal;
