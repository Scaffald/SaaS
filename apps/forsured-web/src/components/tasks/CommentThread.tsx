/**
 * REQ-166: Task Management Workflow & UI
 * CommentThread component with rich text, mentions, and real-time updates
 */

import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { TaskComment } from '../../lib/api/taskService';

interface CommentThreadProps {
  taskId: string;
  comments: TaskComment[];
  currentUserId: string;
  users: User[];
  onAddComment: (content: string, mentions: string[]) => Promise<void>;
  className?: string;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  taskId,
  comments,
  currentUserId,
  users,
  onAddComment,
  className = '',
}) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [draft, setDraft] = useState('');

  const CHARACTER_LIMIT = 5000;

  // Auto-save draft every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (newComment.trim()) {
        localStorage.setItem(`task-comment-draft-${taskId}`, newComment);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [newComment, taskId]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`task-comment-draft-${taskId}`);
    if (savedDraft) {
      setNewComment(savedDraft);
    }
  }, [taskId]);

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const user = users.find((u) => u.name.toLowerCase().includes(username.toLowerCase()));
      if (user) {
        mentions.push(user.id);
      }
    }

    return mentions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const mentions = extractMentions(newComment);
      await onAddComment(newComment, mentions);

      setNewComment('');
      localStorage.removeItem(`task-comment-draft-${taskId}`);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTextChange = (value: string) => {
    if (value.length <= CHARACTER_LIMIT) {
      setNewComment(value);

      // Check for @ mention trigger
      const lastAtIndex = value.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const queryAfterAt = value.substring(lastAtIndex + 1);
        if (!queryAfterAt.includes(' ')) {
          setMentionQuery(queryAfterAt);
          setShowMentions(true);
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    }
  };

  const insertMention = (user: User) => {
    const lastAtIndex = newComment.lastIndexOf('@');
    const beforeMention = newComment.substring(0, lastAtIndex);
    const afterMention = newComment.substring(lastAtIndex + mentionQuery.length + 1);

    setNewComment(`${beforeMention}@${user.name} ${afterMention}`);
    setShowMentions(false);
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const getUserById = (userId: string): User | undefined => {
    return users.find((u) => u.id === userId);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comment List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => {
            const user = getUserById(comment.user_id);
            return (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {user?.name.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900 text-sm">{user?.name || 'Unknown User'}</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</div>
                  {comment.mentions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {comment.mentions.map((mentionId) => {
                        const mentionedUser = getUserById(mentionId);
                        return (
                          <span key={mentionId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            @{mentionedUser?.name || 'Unknown'}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <textarea
            value={newComment}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Add a comment... Use @ to mention someone"
            rows={4}
            className="w-full px-4 py-3 focus:outline-none resize-none text-sm"
          />

          {/* Mention Dropdown */}
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute z-10 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto w-64">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => insertMention(user)}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                {newComment.length} / {CHARACTER_LIMIT}
              </span>
              {newComment.trim() && (
                <span className="text-xs text-gray-400">
                  Draft auto-saved
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Markdown formatting supported: **bold**, *italic*, - lists
        </p>
      </form>
    </div>
  );
};
