/**
 * ProjectNotesTab - Notes/Comments tab for project detail page
 *
 * Allows users to view, add, edit, and delete notes on a project.
 * Uses the comments system under the hood.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  X,
  Edit2,
  Trash2,
  Save,
  Loader2,
  User,
} from 'lucide-react';
import { Stack, Row, Text, Card, H2 } from '@unicornlove/beyond-ui';
import Button from '../Common/Button';
import type { Comment } from '../../types';
import { formatDate } from '../../utils/dateHelpers';

interface ProjectNotesTabProps {
  projectId: string;
  organizationId: string | undefined;
  comments: Comment[];
  currentUserId: string | undefined;
  onCreateComment: (comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>) => Promise<Comment>;
  onUpdateComment: (id: string, updates: Partial<Comment>) => Promise<Comment>;
  onDeleteComment: (id: string) => Promise<void>;
  loading?: boolean;
}

interface NoteModalState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  noteId?: string;
  content: string;
}

/**
 * Note Modal Component
 */
function NoteModal({
  isOpen,
  mode,
  content,
  onContentChange,
  onSave,
  onClose,
  saving,
}: {
  isOpen: boolean;
  mode: 'add' | 'edit';
  content: string;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  if (!isOpen) return null;

  const title = mode === 'add' ? 'Add Note' : 'Edit Note';
  const saveText = mode === 'add' ? 'Add Note' : 'Save Changes';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      tabIndex={-1}
    >
      <div
        role="document"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          width: 560,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <Row
          style={{
            padding: 24,
            borderBottom: '1px solid var(--color-border)',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <H2 id="note-modal-title" style={{ fontSize: 18, fontWeight: 600 }}>
            {title}
          </H2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close modal"
          >
            <X size={20} color="var(--color-text-muted)" />
          </button>
        </Row>

        {/* Modal Content */}
        <div style={{ padding: 24 }}>
          <Stack style={{ gap: 16 }}>
            <Stack style={{ gap: 8 }}>
              <label
                htmlFor="note-content"
                style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}
              >
                Note Content <span style={{ color: 'var(--color-red-10)' }}>*</span>
              </label>
              <textarea
                id="note-content"
                placeholder="Enter your note..."
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--color-text)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: 120,
                }}
              />
              <Text style={{ fontSize: 12, color: 'var(--color-gray-10)' }}>
                {content.length} / 5000 characters
              </Text>
            </Stack>
          </Stack>
        </div>

        {/* Modal Footer */}
        <Row
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border)',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <Button color="gray" onPress={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={onSave}
            disabled={!content.trim() || saving}
            iconStart={saving ? Loader2 : Save}
          >
            {saving ? 'Saving...' : saveText}
          </Button>
        </Row>
      </div>
    </div>
  );
}

/**
 * Delete Confirmation Modal
 */
function DeleteConfirmModal({
  isOpen,
  onConfirm,
  onClose,
  deleting,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  deleting: boolean;
}) {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        role="document"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          width: 400,
          maxWidth: '90vw',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 24 }}>
          <Stack style={{ gap: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
              Delete Note
            </Text>
            <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
              Are you sure you want to delete this note? This action cannot be undone.
            </Text>
          </Stack>
        </div>
        <Row
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border)',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <Button color="gray" onPress={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            onPress={onConfirm}
            disabled={deleting}
            iconStart={deleting ? Loader2 : Trash2}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Row>
      </div>
    </div>
  );
}

/**
 * Note Card Component
 */
function NoteCard({
  comment,
  isOwnNote,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  isOwnNote: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Get user initials for avatar
  const userName = comment.user_name || comment.user_display_name || `User ${comment.user_id.substring(0, 8)}`;
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <Card
      style={{
        padding: 16,
        backgroundColor: 'var(--color-background)',
        borderRadius: 8,
        border: '1px solid var(--color-border)',
        position: 'relative',
      }}
    >
      <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <Row style={{ alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          {/* Avatar with user initials */}
          <div
            style={{
              width: 40,
              height: 40,
              backgroundColor: 'var(--color-blue-9)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              minWidth: 40,
              flex: '0 0 40px',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: 'white', lineHeight: 1 }}>
              {userInitials}
            </span>
          </div>
          
          {/* User info and content */}
          <Stack style={{ flex: 1, minWidth: 0 }}>
            <Row style={{ alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)' }}>
                {userName}
              </Text>
              <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                {formatDate(comment.created_at)}
              </Text>
              {comment.edited_at && (
                <Text style={{ fontSize: 12, color: 'var(--color-9)', fontStyle: 'italic' }}>
                  (edited)
                </Text>
              )}
            </Row>
            
            <Text
              style={{
                fontSize: 14,
                color: 'var(--color-11)',
                whiteSpace: 'pre-wrap',
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              {comment.content}
            </Text>
          </Stack>
        </Row>

        {/* Actions - only show for own notes, more visible */}
        {isOwnNote && (
          <Row style={{ gap: 4, flexShrink: 0 }}>
            <button
              type="button"
              onClick={onEdit}
              style={{
                background: 'var(--color-backgroundHover)',
                border: '1px solid var(--color-border)',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-blue-2)';
                e.currentTarget.style.borderColor = 'var(--color-blue-6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-backgroundHover)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
              title="Edit note"
            >
              <Edit2 size={14} color="var(--color-blue-10)" />
              <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-blue-10)' }}>
                Edit
              </Text>
            </button>
            <button
              type="button"
              onClick={onDelete}
              style={{
                background: 'var(--color-backgroundHover)',
                border: '1px solid var(--color-border)',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-red-2)';
                e.currentTarget.style.borderColor = 'var(--color-red-6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-backgroundHover)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
              title="Delete note"
            >
              <Trash2 size={14} color="var(--color-red-10)" />
              <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-red-10)' }}>
                Delete
              </Text>
            </button>
          </Row>
        )}
      </Row>
    </Card>
  );
}

/**
 * Main ProjectNotesTab Component
 */
export function ProjectNotesTab({
  projectId,
  organizationId,
  comments,
  currentUserId,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  loading = false,
}: ProjectNotesTabProps) {
  const [modalState, setModalState] = useState<NoteModalState>({
    isOpen: false,
    mode: 'add',
    content: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleteState, setDeleteState] = useState<{ isOpen: boolean; noteId: string | null }>({
    isOpen: false,
    noteId: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Open add modal
  const handleOpenAddModal = useCallback(() => {
    setModalState({
      isOpen: true,
      mode: 'add',
      content: '',
    });
  }, []);

  // Open edit modal
  const handleOpenEditModal = useCallback((comment: Comment) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      noteId: comment.id,
      content: comment.content,
    });
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setModalState({
      isOpen: false,
      mode: 'add',
      content: '',
    });
  }, []);

  // Handle content change
  const handleContentChange = useCallback((value: string) => {
    if (value.length <= 5000) {
      setModalState((prev) => ({ ...prev, content: value }));
    }
  }, []);

  // Save note (add or edit)
  const handleSaveNote = useCallback(async () => {
    if (!modalState.content.trim() || !currentUserId || !organizationId) return;

    setSaving(true);
    try {
      if (modalState.mode === 'add') {
        await onCreateComment({
          entity_type: 'project',
          entity_id: projectId,
          user_id: currentUserId,
          organization_id: organizationId,
          content: modalState.content.trim(),
        });
      } else if (modalState.noteId) {
        await onUpdateComment(modalState.noteId, {
          content: modalState.content.trim(),
        });
      }
      handleCloseModal();
    } catch (err) {
      console.error('[ProjectNotesTab] Error saving note:', err);
    } finally {
      setSaving(false);
    }
  }, [
    modalState.mode,
    modalState.noteId,
    modalState.content,
    currentUserId,
    organizationId,
    projectId,
    onCreateComment,
    onUpdateComment,
    handleCloseModal,
  ]);

  // Open delete confirmation
  const handleOpenDeleteConfirm = useCallback((noteId: string) => {
    setDeleteState({ isOpen: true, noteId });
  }, []);

  // Close delete confirmation
  const handleCloseDeleteConfirm = useCallback(() => {
    setDeleteState({ isOpen: false, noteId: null });
  }, []);

  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteState.noteId) return;

    setDeleting(true);
    try {
      await onDeleteComment(deleteState.noteId);
      handleCloseDeleteConfirm();
    } catch (err) {
      console.error('[ProjectNotesTab] Error deleting note:', err);
    } finally {
      setDeleting(false);
    }
  }, [deleteState.noteId, onDeleteComment, handleCloseDeleteConfirm]);

  return (
    <Stack style={{ gap: 16 }}>
      {/* Header with Add Button */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-gray-11)' }}>
          Project Notes ({comments.length})
        </Text>
        <Button
          color="primary"
          size="sm"
          iconStart={Plus}
          onPress={handleOpenAddModal}
          disabled={!currentUserId || !organizationId}
        >
          Add Note
        </Button>
      </Row>

      {/* Notes List */}
      {loading ? (
        <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32 }}>
          <Loader2 size={24} className="animate-spin" color="var(--color-blue-10)" />
          <Text style={{ fontSize: 14, color: 'var(--color-10)', marginTop: 8 }}>
            Loading notes...
          </Text>
        </Stack>
      ) : comments.length > 0 ? (
        <Stack style={{ gap: 12 }}>
          {comments.map((comment) => (
            <NoteCard
              key={comment.id}
              comment={comment}
              isOwnNote={comment.user_id === currentUserId}
              onEdit={() => handleOpenEditModal(comment)}
              onDelete={() => handleOpenDeleteConfirm(comment.id)}
            />
          ))}
        </Stack>
      ) : (
        <Stack
          style={{
            alignItems: 'center',
            paddingTop: 32,
            paddingBottom: 32,
            color: 'var(--color-10)',
          }}
        >
          <MessageSquare size={32} color="var(--color-10)" style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 14, color: 'var(--color-10)' }}>No notes yet</Text>
          <Text style={{ fontSize: 12, color: 'var(--color-9)', marginTop: 4 }}>
            Click &quot;Add Note&quot; to add the first note to this project
          </Text>
        </Stack>
      )}

      {/* Add/Edit Modal */}
      <NoteModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        content={modalState.content}
        onContentChange={handleContentChange}
        onSave={handleSaveNote}
        onClose={handleCloseModal}
        saving={saving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteState.isOpen}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDeleteConfirm}
        deleting={deleting}
      />
    </Stack>
  );
}

export default ProjectNotesTab;
