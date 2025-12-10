/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { X, Calendar, User, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Task } from '../../types';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Textarea from '../Common/Textarea';
import Select from '../Common/Select';
import { formatDate } from '../../utils/dateHelpers';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  availableUsers?: Array<{ id: string; name: string; role: string }>;
}

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  availableUsers = [],
}: TaskDetailModalProps) {
  const [comment, setComment] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState(
    task?.assigned_to_user_id || ''
  );
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  if (!task) return null;

  const handleReassign = () => {
    if (selectedAssignee && selectedAssignee !== task.assigned_to_user_id) {
      onUpdateTask(task.id, { assigned_to_user_id: selectedAssignee });
      onClose();
    }
  };

  const handleComplete = () => {
    onUpdateTask(task.id, {
      status: 'completed' as any,
      metadata: {
        ...task.metadata,
        completion_note: completionNote,
        completed_at: new Date().toISOString(),
      },
    });
    setShowCompletionForm(false);
    setCompletionNote('');
    onClose();
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      const comments = task.metadata?.comments || [];
      onUpdateTask(task.id, {
        metadata: {
          ...task.metadata,
          comments: [
            ...comments,
            {
              id: Date.now().toString(),
              text: comment,
              author: 'Current User',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });
      setComment('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-error-600 bg-error-50';
      case 'high':
        return 'text-warning-600 bg-warning-50';
      default:
        return 'text-primary-600 bg-primary-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success-600 bg-success-50';
      case 'in_progress':
        return 'text-primary-600 bg-primary-50';
      case 'pending':
        return 'text-text-secondary bg-gray-50';
      default:
        return 'text-text-secondary bg-gray-50';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {task.title}
            </h2>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}
              >
                {task.priority}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}
              >
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {task.description && (
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-2">
              Description
            </h3>
            <p className="text-sm text-text-secondary">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {task.due_date && (
            <div>
              <h3 className="text-xs font-medium text-text-tertiary mb-1">
                Due Date
              </h3>
              <div className="flex items-center text-sm text-text-primary">
                <Calendar size={14} className="mr-2" />
                {formatDate(task.due_date)}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-medium text-text-tertiary mb-1">
              Task Type
            </h3>
            <p className="text-sm text-text-primary capitalize">
              {task.task_type || 'General'}
            </p>
          </div>
        </div>

        {task.status !== 'completed' && (
          <>
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-2">
                Reassign Task
              </h3>
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="flex-1"
                  options={[
                    { value: '', label: 'Select assignee' },
                    ...availableUsers.map((user) => ({
                      value: user.id,
                      label: `${user.name} (${user.role})`,
                    })),
                  ]}
                />
                <Button
                  onClick={handleReassign}
                  disabled={
                    !selectedAssignee ||
                    selectedAssignee === task.assigned_to_user_id
                  }
                  size="sm"
                >
                  Reassign
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-text-primary mb-2">
                Mark as Complete
              </h3>
              {!showCompletionForm ? (
                <Button
                  onClick={() => setShowCompletionForm(true)}
                  variant="secondary"
                  icon={CheckCircle2}
                  className="w-full"
                >
                  Complete Task
                </Button>
              ) : (
                <div className="space-y-3 p-4 bg-success-50 border border-success-200 rounded-lg">
                  <Textarea
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder="Add completion notes (optional)"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleComplete}
                      variant="primary"
                      className="flex-1"
                    >
                      Confirm Complete
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCompletionForm(false);
                        setCompletionNote('');
                      }}
                      variant="ghost"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div>
          <h3 className="text-sm font-medium text-text-primary mb-2 flex items-center">
            <MessageSquare size={16} className="mr-2" />
            Comments
          </h3>

          <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
            {task.metadata?.comments?.length > 0 ? (
              task.metadata.comments.map((comment: unknown) => (
                <div
                  key={comment.id}
                  className="p-3 bg-bg-secondary rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-text-primary">
                      {comment.author}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {formatDate(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{comment.text}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-tertiary italic">
                No comments yet
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={handleAddComment}
              disabled={!comment.trim()}
              size="sm"
            >
              Add
            </Button>
          </div>
        </div>

        {task.metadata?.completion_note && (
          <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
            <h3 className="text-sm font-medium text-success-700 mb-2">
              Completion Notes
            </h3>
            <p className="text-sm text-text-secondary">
              {task.metadata.completion_note}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
