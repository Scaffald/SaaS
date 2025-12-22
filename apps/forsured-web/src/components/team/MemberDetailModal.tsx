/**
 * MemberDetailModal - Modal for viewing and managing team member details
 * REQ-283: Team Member Management UI
 * TASK-2: Build Member Detail Modal with Access Management
 *
 * Displays when clicking a team member card, allowing:
 * - View member details
 * - Edit access levels
 * - View activity log
 * - Remove member
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { YStack, XStack, Text, Button, Card, H2, SizableText } from '@unicornlove/ui';
import { X } from 'lucide-react';
import { AccessLevelSelector, type AccessLevel } from './AccessLevelSelector';
import { ActivityLog, type ActivityEntry } from './ActivityLog';
import type { TeamMember } from './TeamMemberCard';

interface MemberDetailModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRole?: (memberId: string, role: AccessLevel) => Promise<void>;
  onRemove?: (memberId: string) => Promise<void>;
  activities?: ActivityEntry[];
  activitiesLoading?: boolean;
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function MemberDetailModal({
  member,
  isOpen,
  onClose,
  onUpdateRole,
  onRemove,
  activities = [],
  activitiesLoading = false,
}: MemberDetailModalProps) {
  const [currentRole, setCurrentRole] = useState<AccessLevel>(member?.role || 'user');
  const [roleLoading, setRoleLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync current role when member changes
  useEffect(() => {
    if (member) {
      setCurrentRole(member.role);
    }
  }, [member]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowRemoveConfirm(false);
      setError(null);
    }
  }, [isOpen]);

  // Handle role change
  const handleRoleChange = useCallback(
    async (newRole: AccessLevel) => {
      if (!member || !onUpdateRole) return;

      setRoleLoading(true);
      setError(null);

      // Optimistic update
      const previousRole = currentRole;
      setCurrentRole(newRole);

      try {
        await onUpdateRole(member.id, newRole);
      } catch (err) {
        // Revert on error
        setCurrentRole(previousRole);
        setError(err instanceof Error ? err.message : 'Failed to update role');
      } finally {
        setRoleLoading(false);
      }
    },
    [member, onUpdateRole, currentRole]
  );

  // Handle remove
  const handleRemove = useCallback(async () => {
    if (!member || !onRemove) return;

    setRemoveLoading(true);
    setError(null);

    try {
      await onRemove(member.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemoveLoading(false);
      setShowRemoveConfirm(false);
    }
  }, [member, onRemove, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !member) return null;

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
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
    >
      <Card
        backgroundColor="$background"
        borderRadius="$4"
        elevation={4}
        width="100%"
        maxWidth={448}
        marginHorizontal="$4"
        maxHeight="90vh"
        overflow="hidden"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <YStack overflow="scroll">
          {/* Header */}
          <XStack
            alignItems="flex-start"
            justifyContent="space-between"
            padding="$4"
            borderBottomWidth={1}
            borderColor="$borderColor"
          >
            <XStack alignItems="center" gap="$4">
              {/* Avatar */}
              {member.avatar ? (
                <YStack
                  width={56}
                  height={56}
                  borderRadius={9999}
                  overflow="hidden"
                  backgroundColor="$color3"
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </YStack>
              ) : (
                <YStack
                  width={56}
                  height={56}
                  borderRadius={9999}
                  backgroundColor="$color3"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="$6" fontWeight="500" color="$color11">
                    {getInitials(member.name)}
                  </Text>
                </YStack>
              )}

              {/* Name and Email */}
              <YStack>
                <H2 id="modal-title" fontSize="$6" fontWeight="600" color="$color12">
                  {member.name}
                </H2>
                <SizableText fontSize="$3" color="$color11">
                  {member.email}
                </SizableText>
                {member.company && (
                  <SizableText fontSize="$1" color="$color10" mt="$0.5">
                    {member.company}
                  </SizableText>
                )}
              </YStack>
            </XStack>

            {/* Close Button */}
            <Button
              onPress={onClose}
              variant="outlined"
              size="$2"
              padding="$1"
              aria-label="Close modal"
            >
              <X size={20} />
            </Button>
          </XStack>

          {/* Content */}
          <YStack padding="$4" gap="$6">
            {/* Error Message */}
            {error && (
              <YStack
                padding="$3"
                backgroundColor="$red2"
                borderWidth={1}
                borderColor="$red6"
                borderRadius="$4"
              >
                <SizableText fontSize="$3" color="$red11">
                  {error}
                </SizableText>
              </YStack>
            )}

            {/* Access Level Section */}
            {onUpdateRole && (
              <AccessLevelSelector
                value={currentRole}
                onChange={handleRoleChange}
                loading={roleLoading}
              />
            )}

            {/* Member Since */}
            {member.createdAt && (
              <YStack gap="$1">
                <SizableText fontSize="$3" fontWeight="500" color="$color11">
                  Member Since
                </SizableText>
                <SizableText fontSize="$3" color="$color10">
                  {new Date(member.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </SizableText>
              </YStack>
            )}

            {/* Activity Log */}
            <ActivityLog activities={activities} loading={activitiesLoading} />

            {/* Remove Member Section */}
            {onRemove && (
              <YStack paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                {!showRemoveConfirm ? (
                  <Button
                    onPress={() => setShowRemoveConfirm(true)}
                    variant="outlined"
                    size="$2"
                    color="$red10"
                  >
                    Remove from team
                  </Button>
                ) : (
                  <YStack
                    gap="$3"
                    padding="$3"
                    backgroundColor="$red2"
                    borderWidth={1}
                    borderColor="$red6"
                    borderRadius="$4"
                  >
                    <SizableText fontSize="$3" color="$red11">
                      Are you sure you want to remove <Text fontWeight="600">{member.name}</Text> from the
                      team? This action cannot be undone.
                    </SizableText>
                    <XStack gap="$2">
                      <Button
                        onPress={handleRemove}
                        disabled={removeLoading}
                        backgroundColor="$red10"
                        color="white"
                        size="$2"
                        opacity={removeLoading ? 0.5 : 1}
                      >
                        {removeLoading ? 'Removing...' : 'Yes, Remove'}
                      </Button>
                      <Button
                        onPress={() => setShowRemoveConfirm(false)}
                        disabled={removeLoading}
                        variant="outlined"
                        size="$2"
                        opacity={removeLoading ? 0.5 : 1}
                      >
                        Cancel
                      </Button>
                    </XStack>
                  </YStack>
                )}
              </YStack>
            )}
          </YStack>
        </YStack>
      </Card>
    </YStack>
  );
}

export default MemberDetailModal;
