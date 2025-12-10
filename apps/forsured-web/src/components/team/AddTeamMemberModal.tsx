/**
 * AddTeamMemberModal - Modal wrapper for AddTeamMemberForm
 * REQ-283: Team Member Management UI
 * TASK-3: Implement Add Team Member Form with Email Invitation
 *
 * Modal that opens when "Invite Member" button is clicked.
 */

'use client';

import React, { useEffect } from 'react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <div>
              <h2
                id="add-member-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                Invite Team Member
              </h2>
              <p className="text-sm text-gray-500">
                Send an invitation to join your team
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-50"
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

        {/* Form Content */}
        <div className="p-4">
          <AddTeamMemberForm
            onSubmit={onSubmit}
            onCancel={onClose}
            loading={loading}
            existingEmails={existingEmails}
          />
        </div>
      </div>
    </div>
  );
}

export default AddTeamMemberModal;
