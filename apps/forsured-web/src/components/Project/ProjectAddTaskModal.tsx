/**
 * ProjectAddTaskModal - Modal for adding tasks to a project
 *
 * Allows project participants to create tasks assigned to other
 * project participants. Simplified version of the broker TaskModal.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Save, Loader2, Calendar, User, AlertTriangle } from 'lucide-react';
import { Stack, Row, Text, H2, Input } from '@scaffald/ui';
import Textarea from '../Common/Textarea';
import Button from '../Common/Button';
import type { Task, TaskStatus, TaskPriority, ProjectParticipant } from '../../types';

interface ProjectAddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task>;
  projectId: string;
  projectName?: string;
  organizationId?: string;
  participants: ProjectParticipant[];
  currentUserId?: string;
}

interface FormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  assigned_to_user_id: string;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'var(--color-green10)' },
  { value: 'medium', label: 'Medium', color: 'var(--color-blue10)' },
  { value: 'high', label: 'High', color: 'var(--color-orange10)' },
  { value: 'urgent', label: 'Urgent', color: 'var(--color-red10)' },
];

export function ProjectAddTaskModal({
  isOpen,
  onClose,
  onSave,
  projectId,
  projectName,
  organizationId,
  participants,
  currentUserId,
}: ProjectAddTaskModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    assigned_to_user_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        assigned_to_user_id: '',
      });
      setError(null);
    }
  }, [isOpen]);

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (error) setError(null);
    },
    [error]
  );

  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!currentUserId) {
      setError('You must be logged in to create a task');
      return;
    }

    if (!organizationId) {
      setError('Organization ID is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Build task data - cast to include organization_id which is required by DB
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date || undefined,
        assigned_to_user_id: formData.assigned_to_user_id || undefined,
        project_id: projectId,
        created_by_user_id: currentUserId,
        project_name: projectName,
        organization_id: organizationId,
      } as Omit<Task, 'id' | 'created_at' | 'updated_at'> & { organization_id?: string };

      await onSave(taskData as Omit<Task, 'id' | 'created_at' | 'updated_at'>);
      onClose();
    } catch (err) {
      console.error('[ProjectAddTaskModal] Error saving task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSaving(false);
    }
  }, [formData, projectId, projectName, currentUserId, organizationId, onSave, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

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
      aria-labelledby="add-task-modal-title"
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
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <Row
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 24,
            borderBottom: '1px solid var(--color-4)',
          }}
        >
          <H2 id="add-task-modal-title" style={{ margin: 0 }}>
            Add Task
          </H2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color="var(--color-11)" />
          </button>
        </Row>

        {/* Body */}
        <Stack style={{ padding: 24, gap: 20, overflowY: 'auto', flex: 1 }}>
          {/* Project Info */}
          {projectName && (
            <Row
              style={{
                padding: 12,
                backgroundColor: 'var(--color-2)',
                borderRadius: 8,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                Project:
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                {projectName}
              </Text>
            </Row>
          )}

          {/* Error Message */}
          {error && (
            <Row
              style={{
                padding: 12,
                backgroundColor: 'var(--color-red2)',
                borderRadius: 8,
                gap: 8,
                alignItems: 'center',
              }}
            >
              <AlertTriangle size={16} color="var(--color-red10)" />
              <Text style={{ fontSize: 14, color: 'var(--color-red11)' }}>
                {error}
              </Text>
            </Row>
          )}

          {/* Title */}
          <Stack style={{ gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
              Task Title *
            </Text>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title..."
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--color-6)',
                fontSize: 14,
              }}
            />
          </Stack>

          {/* Description */}
          <Stack style={{ gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
              Description
            </Text>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter task description..."
              rows={3}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--color-6)',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </Stack>

          {/* Priority & Due Date Row */}
          <Row style={{ gap: 16 }}>
            {/* Priority */}
            <Stack style={{ gap: 6, flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                Priority
              </Text>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--color-6)',
                  fontSize: 14,
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Stack>

            {/* Due Date */}
            <Stack style={{ gap: 6, flex: 1 }}>
              <Row style={{ gap: 4, alignItems: 'center' }}>
                <Calendar size={14} color="var(--color-11)" />
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                  Due Date
                </Text>
              </Row>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--color-6)',
                  fontSize: 14,
                  backgroundColor: '#ffffff',
                }}
              />
            </Stack>
          </Row>

          {/* Assigned To */}
          <Stack style={{ gap: 6 }}>
            <Row style={{ gap: 4, alignItems: 'center' }}>
              <User size={14} color="var(--color-11)" />
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                Assign To
              </Text>
            </Row>
            <select
              value={formData.assigned_to_user_id}
              onChange={(e) => handleInputChange('assigned_to_user_id', e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--color-6)',
                fontSize: 14,
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <option value="">Unassigned</option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.user_id || participant.id}>
                  {participant.user_id === currentUserId
                    ? `Me (${participant.role})`
                    : `${participant.role} - ${participant.user_id?.slice(0, 8) || participant.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
            {participants.length === 0 && (
              <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                No participants found. Add participants to the project first.
              </Text>
            )}
          </Stack>
        </Stack>

        {/* Footer */}
        <Row
          style={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            padding: 24,
            borderTop: '1px solid var(--color-4)',
            backgroundColor: 'var(--color-1)',
          }}
        >
          <Button color="gray" onPress={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            disabled={!formData.title.trim() || saving || !currentUserId || !organizationId}
            iconStart={saving ? Loader2 : Save}
          >
            {saving ? 'Creating...' : 'Create Task'}
          </Button>
        </Row>
      </div>
    </div>
  );
}

export default ProjectAddTaskModal;
