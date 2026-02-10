/**
 * MemberDetailModal - Modal for viewing and managing team member details
 * Team Member Management UI
 * TASK-2: Build Member Detail Modal with Access Management
 *
 * Displays when clicking a team member card, allowing:
 * - View member details
 * - Edit access levels
 * - View activity log
 * - Remove member
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Stack, Row, Text, Button, Card, H2 } from '@unicornlove/beyond-ui';
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
      aria-labelledby="modal-title"
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
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
        onPress={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div style={{ overflow: 'auto' }}>
          {/* Header */}
          <Row
            style={{
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: 16,
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <Row style={{ alignItems: 'center', gap: 16 }}>
              {/* Avatar */}
              {member.avatar ? (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-gray-3)',
                  }}
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-gray-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-gray-11)' }}>
                    {getInitials(member.name)}
                  </Text>
                </div>
              )}

              {/* Name and Email */}
              <Stack>
                <H2 id="modal-title" style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-gray-12)' }}>
                  {member.name}
                </H2>
                <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>
                  {member.email}
                </Text>
                {member.company && (
                  <Text style={{ fontSize: 12, color: 'var(--color-gray-10)', marginTop: 2 }}>
                    {member.company}
                  </Text>
                )}
              </Stack>
            </Row>

            {/* Close Button */}
            <Button
              onPress={onClose}
              variant="outline"
              size="sm"
              style={{ padding: 4 }}
              aria-label="Close modal"
            >
              <X size={20} />
            </Button>
          </Row>

          {/* Content */}
          <Stack style={{ padding: 16, gap: 24 }}>
            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: 'var(--color-red-2)',
                  border: '1px solid var(--color-red-6)',
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: 'var(--color-red-11)' }}>
                  {error}
                </Text>
              </div>
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
              <Stack style={{ gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
                  Member Since
                </Text>
                <Text style={{ fontSize: 14, color: 'var(--color-gray-10)' }}>
                  {new Date(member.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </Stack>
            )}

            {/* Activity Log */}
            <ActivityLog activities={activities} loading={activitiesLoading} />

            {/* Remove Member Section */}
            {onRemove && (
              <Stack style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                {!showRemoveConfirm ? (
                  <Button
                    onPress={() => setShowRemoveConfirm(true)}
                    variant="outline"
                    size="sm"
                    style={{ color: 'var(--color-red-10)' }}
                  >
                    Remove from team
                  </Button>
                ) : (
                  <Stack
                    style={{
                      gap: 12,
                      padding: 12,
                      backgroundColor: 'var(--color-red-2)',
                      border: '1px solid var(--color-red-6)',
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: 'var(--color-red-11)' }}>
                      Are you sure you want to remove <Text style={{ fontWeight: 600 }}>{member.name}</Text> from the
                      team? This action cannot be undone.
                    </Text>
                    <Row style={{ gap: 8 }}>
                      <Button
                        onPress={handleRemove}
                        disabled={removeLoading}
                        style={{
                          backgroundColor: 'var(--color-red-10)',
                          color: 'white',
                          opacity: removeLoading ? 0.5 : 1,
                        }}
                        size="sm"
                      >
                        {removeLoading ? 'Removing...' : 'Yes, Remove'}
                      </Button>
                      <Button
                        onPress={() => setShowRemoveConfirm(false)}
                        disabled={removeLoading}
                        variant="outline"
                        size="sm"
                        style={{ opacity: removeLoading ? 0.5 : 1 }}
                      >
                        Cancel
                      </Button>
                    </Row>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        </div>
      </Card>
    </div>
  );
}

export default MemberDetailModal;
