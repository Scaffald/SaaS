/**
 * ActivityLog - Display member activity from audit logs
 * Team Member Management UI
 * TASK-2: Build Member Detail Modal with Access Management
 *
 * Shows chronological list of member actions with timestamps.
 * Displays recent activity (last 50 entries).
 */

'use client';

import React from 'react';
import { LogIn, LogOut, Edit, Plus, Trash2, Info } from 'lucide-react';
import { Stack, Row, Text } from '@scaffald/ui';

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
  const iconSize = 16;

  switch (action.toLowerCase()) {
    case 'login':
      return <LogIn size={iconSize} color="var(--color-blue-10)" />;
    case 'logout':
      return <LogOut size={iconSize} color="var(--color-blue-10)" />;
    case 'update':
    case 'edit':
      return <Edit size={iconSize} color="var(--color-yellow-10)" />;
    case 'create':
    case 'add':
      return <Plus size={iconSize} color="var(--color-green-10)" />;
    case 'delete':
    case 'remove':
      return <Trash2 size={iconSize} color="var(--color-red-10)" />;
    default:
      return <Info size={iconSize} color="var(--color-gray-10)" />;
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
      <Stack style={{ gap: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
          Recent Activity
        </Text>
        <Stack style={{ gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Row key={i} style={{ alignItems: 'flex-start', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-gray-3)',
                }}
              />
              <Stack style={{ flex: 1, gap: 4 }}>
                <div style={{ height: 16, backgroundColor: 'var(--color-gray-3)', borderRadius: 4, width: '75%' }} />
                <div style={{ height: 12, backgroundColor: 'var(--color-gray-3)', borderRadius: 4, width: '25%' }} />
              </Stack>
            </Row>
          ))}
        </Stack>
      </Stack>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <Stack style={{ gap: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
          Recent Activity
        </Text>
        <Stack style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 24 }}>
          <Text style={{ fontSize: 14, color: 'var(--color-gray-10)', textAlign: 'center' }}>
            {emptyMessage}
          </Text>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 12 }}>
      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
        Recent Activity
      </Text>
      <Stack style={{ gap: 0, maxHeight: 256, overflow: 'auto' }}>
        {activities.map((activity, index) => (
          <Row
            key={activity.id}
            style={{
              alignItems: 'flex-start',
              gap: 12,
              paddingTop: 8,
              paddingBottom: 8,
              borderBottom: index !== activities.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            {/* Icon */}
            <div
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'var(--color-gray-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getActivityIcon(activity.action)}
            </div>

            {/* Content */}
            <Stack style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, color: 'var(--color-gray-12)' }}>
                {activity.description}
              </Text>
              <Text style={{ fontSize: 12, color: 'var(--color-gray-10)' }}>
                {formatTimestamp(activity.timestamp)}
              </Text>
            </Stack>
          </Row>
        ))}
      </Stack>
    </Stack>
  );
}

export default ActivityLog;
