import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  User,
  Calendar,
  Building,
  Upload,
  Download,
  Edit,
  History,
  AtSign,
  Paperclip,
  Block,
} from 'lucide-react';
import {
  Task,
  User as UserType,
  Comment,
  Attachment,
  StatusHistory,
  EntityType,
} from '../../types';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import Select from './Select';
import { useComments } from '../../hooks/useComments';
import { useAttachments } from '../../hooks/useAttachments';
import { useStatusHistory } from '../../hooks/useStatusHistory';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import COIComparisonViewer from '../Document/COIComparisonViewer';

interface UnifiedTaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  currentUser: UserType;
  availableUsers?: UserType[];
}

export default function UnifiedTaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  currentUser,
  availableUsers = [],
}: UnifiedTaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    'details' | 'comments' | 'attachments' | 'history'
  >('details');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState(
    task.assigned_to_user_id || ''
  );
  const [newDueDate, setNewDueDate] = useState(task.due_date || '');
  const [newPriority, setNewPriority] = useState(task.priority || 'medium');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [showCOIComparison, setShowCOIComparison] = useState(false);

  // Hooks for data fetching
  const {
    comments,
    loading: commentsLoading,
    createComment,
  } = useComments({
    entityType: 'task' as EntityType,
    entityId: task.id,
  });

  const {
    attachments,
    loading: attachmentsLoading,
    createAttachment,
    deleteAttachment,
  } = useAttachments({
    entityType: 'task' as EntityType,
    entityId: task.id,
  });

  const {
    history,
    loading: historyLoading,
    createHistoryEntry,
  } = useStatusHistory({
    entityType: 'task' as EntityType,
    entityId: task.id,
  });

  const { users } = useUsers();
  const allUsers = availableUsers.length > 0 ? availableUsers : users;

  useEffect(() => {
    if (isOpen) {
      setSelectedAssignee(task.assigned_to_user_id || '');
      setNewDueDate(task.due_date || '');
      setNewPriority(task.priority || 'medium');
    }
  }, [isOpen, task]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-error-600 bg-error-50 border-error-200';
      case 'high':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'medium':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'low':
        return 'text-text-tertiary bg-gray-50 border-gray-200';
      default:
        return 'text-text-tertiary bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-primary-100 text-primary-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'blocked':
        return 'bg-error-100 text-error-700';
      case 'completed':
        return 'bg-success-100 text-success-700';
      case 'cancelled':
        return 'bg-text-tertiary text-text-secondary';
      default:
        return 'bg-bg-secondary text-text-secondary';
    }
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate)
      return {
        text: 'No due date',
        color: 'text-text-tertiary',
        isOverdue: false,
      };
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)} days overdue`,
        color: 'text-error-600',
        isOverdue: true,
      };
    if (diffDays === 0)
      return { text: 'Due today', color: 'text-warning-600', isOverdue: false };
    if (diffDays === 1)
      return {
        text: 'Due tomorrow',
        color: 'text-warning-600',
        isOverdue: false,
      };
    return {
      text: `Due in ${diffDays} days`,
      color: 'text-text-secondary',
      isOverdue: false,
    };
  };

  const dueDate = formatDueDate(task.due_date);

  const handleStatusChange = async (
    newStatus: Task['status'],
    reason?: string
  ) => {
    const oldStatus = task.status;

    try {
      await onUpdateTask(task.id, { status: newStatus });

      // Record status change in history
      await createHistoryEntry({
        entity_type: 'task' as EntityType,
        entity_id: task.id,
        old_status: oldStatus as string,
        new_status: newStatus as string,
        changed_by: currentUser.id,
        reason: reason,
      });

      if (newStatus === 'blocked') {
        setShowBlockModal(false);
        setBlockReason('');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleReassign = async () => {
    if (selectedAssignee && selectedAssignee !== task.assigned_to_user_id) {
      try {
        await onUpdateTask(task.id, { assigned_to_user_id: selectedAssignee });
        setShowReassignModal(false);
        setSelectedAssignee('');
      } catch (error) {
        console.error('Failed to reassign task:', error);
      }
    }
  };

  const handleEditTask = async () => {
    try {
      await onUpdateTask(task.id, {
        due_date: newDueDate || undefined,
        priority: newPriority as Task['priority'],
      });
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    // Extract mentions from comment text
    const mentionMatches = commentText.match(/@(\w+)/g);
    const mentions = mentionMatches
      ? (mentionMatches
          .map((m) => m.substring(1))
          .map((username) => {
            const user = allUsers.find((u) =>
              u.name.toLowerCase().includes(username.toLowerCase())
            );
            return user?.id;
          })
          .filter(Boolean) as string[])
      : [];

    try {
      await createComment({
        entity_type: 'task' as EntityType,
        entity_id: task.id,
        user_id: currentUser.id,
        content: commentText,
        mentions: mentions.length > 0 ? mentions : undefined,
      });
      setCommentText('');
      setMentionQuery('');
      setShowMentions(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await createAttachment({
        entity_type: 'task' as EntityType,
        entity_id: task.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: URL.createObjectURL(file), // Mock URL
        uploaded_by: currentUser.id,
      });
    } catch (error) {
      console.error('Failed to upload attachment:', error);
    }

    // Reset input
    event.target.value = '';
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const handleCommentInputChange = (value: string) => {
    setCommentText(value);

    // Check for @ mentions
    const lastAt = value.lastIndexOf('@');
    if (
      lastAt !== -1 &&
      (value.length === lastAt + 1 || value[lastAt + 1] === ' ')
    ) {
      setShowMentions(true);
      setMentionQuery(value.substring(lastAt + 1));
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (user: UserType) => {
    const lastAt = commentText.lastIndexOf('@');
    if (lastAt !== -1) {
      const before = commentText.substring(0, lastAt);
      const after = commentText.substring(lastAt + 1);
      setCommentText(`${before}@${user.name} ${after}`);
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const filteredUsers = mentionQuery
    ? allUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : allUsers.slice(0, 5);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getUserName = (userId: string) => {
    return allUsers.find((u) => u.id === userId)?.name || 'Unknown User';
  };

  if (!task) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-text-primary">
                  {task.title}
                </h2>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded border ${getPriorityColor(task.priority)}`}
                >
                  {task.priority.toUpperCase()}
                </span>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}
                >
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              {task.description && (
                <p className="text-text-secondary">{task.description}</p>
              )}
            </div>
          </div>

          {/* Task Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-bg-secondary rounded-lg">
              <Calendar className="text-text-tertiary" size={20} />
              <div>
                <p className="text-xs text-text-tertiary">Due Date</p>
                <p className={`text-sm font-medium ${dueDate.color}`}>
                  {dueDate.text}
                  {dueDate.isOverdue && <span className="ml-2">⚠️</span>}
                </p>
              </div>
            </div>
            {task.project_id && (
              <div className="flex items-center space-x-3 p-3 bg-bg-secondary rounded-lg">
                <Building className="text-text-tertiary" size={20} />
                <div>
                  <p className="text-xs text-text-tertiary">Project</p>
                  <p className="text-sm font-medium text-text-primary">
                    {task.project_name || 'Project'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Assigned To */}
          {task.assigned_to_user_id && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  Assigned To
                </h3>
                <button
                  onClick={() => setShowReassignModal(true)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Reassign
                </button>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-bg-secondary rounded-lg">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {getUserName(task.assigned_to_user_id)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {getUserName(task.assigned_to_user_id)}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {allUsers.find((u) => u.id === task.assigned_to_user_id)
                      ?.email || ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex space-x-6">
              {['details', 'comments', 'attachments', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'details' && (
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {task.status === 'pending' && (
                      <Button
                        variant="primary"
                        onClick={() => handleStatusChange('in_progress')}
                        leftIcon={Clock}
                        fullWidth
                      >
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        variant="success"
                        onClick={() => handleStatusChange('completed')}
                        leftIcon={CheckCircle}
                        fullWidth
                      >
                        Complete Task
                      </Button>
                    )}
                    {task.status !== 'blocked' &&
                      task.status !== 'completed' && (
                        <Button
                          variant="danger"
                          onClick={() => setShowBlockModal(true)}
                          leftIcon={Block}
                          fullWidth
                        >
                          Block Task
                        </Button>
                      )}
                    <Button
                      variant="secondary"
                      onClick={() => setShowEditModal(true)}
                      leftIcon={Edit}
                      fullWidth
                    >
                      Edit Details
                    </Button>
                  </div>

                  {/* Quick Actions from task */}
                  {task.quick_actions && task.quick_actions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h3 className="text-sm font-semibold text-text-primary mb-3">
                        Additional Actions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {task.quick_actions.map((action) => {
                          if (
                            action === 'open_coi' ||
                            action === 'compare_to_req'
                          ) {
                            return (
                              <Button
                                key={action}
                                variant="outline"
                                onClick={() => setShowCOIComparison(true)}
                                leftIcon={FileText}
                              >
                                {action === 'open_coi'
                                  ? 'Open COI'
                                  : 'Compare To Req'}
                              </Button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Comments
                  </h3>
                  {commentsLoading ? (
                    <div className="text-center py-8 text-text-tertiary">
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-text-tertiary">
                      No comments yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-white">
                              {getUserName(comment.user_id)
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-text-primary">
                                {getUserName(comment.user_id)}
                              </span>
                              <span className="text-xs text-text-tertiary">
                                {formatDate(comment.created_at)}
                              </span>
                              {comment.edited_at && (
                                <span className="text-xs text-text-tertiary">
                                  (edited)
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-text-secondary whitespace-pre-wrap">
                              {comment.content}
                            </p>
                            {comment.mentions &&
                              comment.mentions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {comment.mentions.map((userId) => (
                                    <span
                                      key={userId}
                                      className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded"
                                    >
                                      @{getUserName(userId)}
                                    </span>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Comment */}
                <div className="border-t border-border pt-4">
                  <div className="relative">
                    <Textarea
                      label="Add a comment"
                      value={commentText}
                      onChange={(e) => handleCommentInputChange(e.target.value)}
                      placeholder="Type @ to mention someone..."
                      rows={3}
                      fullWidth
                    />
                    {showMentions && (
                      <div className="absolute z-10 w-full mt-1 bg-bg-primary border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => insertMention(user)}
                            className="w-full px-4 py-2 text-left hover:bg-bg-secondary flex items-center space-x-2"
                          >
                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-white">
                                {user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">
                                {user.name}
                              </p>
                              <p className="text-xs text-text-tertiary">
                                {user.email}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      onClick={handleAddComment}
                      disabled={!commentText.trim()}
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-primary">
                      Attachments
                    </h3>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button variant="secondary" leftIcon={Upload} size="sm">
                        Upload File
                      </Button>
                    </label>
                  </div>
                  {attachmentsLoading ? (
                    <div className="text-center py-8 text-text-tertiary">
                      Loading attachments...
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="text-center py-8 text-text-tertiary">
                      No attachments yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <FileText
                              className="text-text-tertiary"
                              size={20}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-primary">
                                {attachment.file_name}
                              </p>
                              <p className="text-xs text-text-tertiary">
                                {formatFileSize(attachment.file_size)} •{' '}
                                {formatDate(attachment.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {attachment.file_url && (
                              <a
                                href={attachment.file_url}
                                download={attachment.file_name}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                              >
                                <Download size={16} />
                              </a>
                            )}
                            <button
                              onClick={() =>
                                handleDeleteAttachment(attachment.id)
                              }
                              className="p-2 text-error-600 hover:bg-error-50 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary">
                  Status History
                </h3>
                {historyLoading ? (
                  <div className="text-center py-8 text-text-tertiary">
                    Loading history...
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary">
                    No history yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex space-x-3 p-3 bg-bg-secondary rounded-lg"
                      >
                        <History
                          className="text-text-tertiary mt-0.5"
                          size={16}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-text-primary">
                              {getUserName(entry.changed_by)}
                            </span>
                            <span className="text-xs text-text-tertiary">
                              changed status
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-bg-tertiary rounded">
                              {entry.old_status}
                            </span>
                            <span className="text-xs text-text-tertiary">
                              →
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${getStatusColor(entry.new_status)}`}
                            >
                              {entry.new_status}
                            </span>
                          </div>
                          {entry.reason && (
                            <p className="text-xs text-text-secondary mt-1">
                              Reason: {entry.reason}
                            </p>
                          )}
                          <p className="text-xs text-text-tertiary mt-1">
                            {formatDate(entry.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Reassign Modal */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reassign Task"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Select Assignee"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            options={allUsers.map((user) => ({
              value: user.id,
              label: `${user.name} (${user.email})`,
            }))}
            fullWidth
          />
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowReassignModal(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReassign} fullWidth>
              Reassign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Block Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => {
          setShowBlockModal(false);
          setBlockReason('');
        }}
        title="Block Task"
        size="sm"
      >
        <div className="space-y-4">
          <Textarea
            label="Reason for blocking"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Enter the reason why this task is blocked..."
            rows={4}
            fullWidth
            required
          />
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowBlockModal(false);
                setBlockReason('');
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleStatusChange('blocked', blockReason)}
              disabled={!blockReason.trim()}
              fullWidth
            >
              Block Task
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task Details"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Due Date"
            type="datetime-local"
            value={
              newDueDate ? new Date(newDueDate).toISOString().slice(0, 16) : ''
            }
            onChange={(e) => {
              const value = e.target.value;
              setNewDueDate(value ? new Date(value).toISOString() : '');
            }}
            fullWidth
          />
          <Select
            label="Priority"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            fullWidth
          />
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditTask} fullWidth>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* COI Comparison Viewer */}
      {task.document_link && (
        <COIComparisonViewer
          documentId={task.document_link} // Using document_link as document ID for now
          projectId={task.project_id}
          documentName={task.title}
          documentUrl={task.document_link}
          isOpen={showCOIComparison}
          onClose={() => setShowCOIComparison(false)}
          onApprove={() => {
            console.log('Document approved');
            // Could update task status here
          }}
          onRequestChanges={(comments) => {
            console.log('Request changes:', comments);
            // Could create a comment or task here
          }}
          onOverride={(reason) => {
            console.log('Override with reason:', reason);
            // Could update task/document status here
          }}
        />
      )}
    </>
  );
}
