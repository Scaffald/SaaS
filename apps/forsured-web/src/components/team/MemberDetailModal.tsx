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

import React, { useState, useCallback, useEffect } from 'react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 font-medium text-lg">
                  {getInitials(member.name)}
                </span>
              </div>
            )}

            {/* Name and Email */}
            <div>
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                {member.name}
              </h2>
              <p className="text-sm text-gray-500">{member.email}</p>
              {member.company && (
                <p className="text-xs text-gray-400 mt-0.5">{member.company}</p>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
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
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Member Since
              </label>
              <p className="text-sm text-gray-600">
                {new Date(member.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Activity Log */}
          <ActivityLog activities={activities} loading={activitiesLoading} />

          {/* Remove Member Section */}
          {onRemove && (
            <div className="pt-4 border-t border-gray-200">
              {!showRemoveConfirm ? (
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove from team
                </button>
              ) : (
                <div className="space-y-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    Are you sure you want to remove <strong>{member.name}</strong> from the
                    team? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRemove}
                      disabled={removeLoading}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {removeLoading ? 'Removing...' : 'Yes, Remove'}
                    </button>
                    <button
                      onClick={() => setShowRemoveConfirm(false)}
                      disabled={removeLoading}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemberDetailModal;
