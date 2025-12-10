/**
 * ActivityLog - Display member activity from audit logs
 * REQ-283: Team Member Management UI
 * TASK-2: Build Member Detail Modal with Access Management
 *
 * Shows chronological list of member actions with timestamps.
 * Displays recent activity (last 50 entries).
 */

'use client';

import React from 'react';

export interface ActivityEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ActivityLogProps {
  activities: ActivityEntry[];
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Get icon for activity type
 */
function getActivityIcon(action: string): React.ReactNode {
  const iconClass = 'w-4 h-4';

  switch (action.toLowerCase()) {
    case 'login':
    case 'logout':
      return (
        <svg className={`${iconClass} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      );
    case 'update':
    case 'edit':
      return (
        <svg className={`${iconClass} text-yellow-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case 'create':
    case 'add':
      return (
        <svg className={`${iconClass} text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    case 'delete':
    case 'remove':
      return (
        <svg className={`${iconClass} text-red-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    default:
      return (
        <svg className={`${iconClass} text-gray-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

export function ActivityLog({
  activities,
  loading = false,
  emptyMessage = 'No recent activity',
}: ActivityLogProps) {
  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Recent Activity</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Recent Activity</h3>
        <div className="text-center py-6 text-gray-500 text-sm">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Recent Activity</h3>
      <div className="space-y-0 max-h-64 overflow-y-auto">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex items-start gap-3 py-2 ${
              index !== activities.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              {getActivityIcon(activity.action)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.description}</p>
              <p className="text-xs text-gray-500">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityLog;
