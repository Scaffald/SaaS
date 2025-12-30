/**
 * ActivityLog - Display member activity from audit logs
 * REQ-283: Team Member Management UI
 * TASK-2: Build Member Detail Modal with Access Management
 *
 * Shows chronological list of member actions with timestamps.
 * Displays recent activity (last 50 entries).
 */

'use client';

import { LogIn, LogOut, Edit, Plus, Trash2, Info } from 'lucide-react';
import { YStack, XStack, Text, SizableText } from '@unicornlove/ui';

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
      return <LogIn size={iconSize} color="var(--blue10)" />;
    case 'logout':
      return <LogOut size={iconSize} color="var(--blue10)" />;
    case 'update':
    case 'edit':
      return <Edit size={iconSize} color="var(--yellow10)" />;
    case 'create':
    case 'add':
      return <Plus size={iconSize} color="var(--green10)" />;
    case 'delete':
    case 'remove':
      return <Trash2 size={iconSize} color="var(--red10)" />;
    default:
      return <Info size={iconSize} color="var(--color10)" />;
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
      <YStack gap="$3">
        <SizableText fontSize="$3" fontWeight="500" color="$color11">
          Recent Activity
        </SizableText>
        <YStack gap="$2">
          {[1, 2, 3, 4, 5].map((i) => (
            <XStack key={i} alignItems="flex-start" gap="$3">
              <YStack
                width={32}
                height={32}
                borderRadius={9999}
                backgroundColor="$color3"
              />
              <YStack flex={1} gap="$1">
                <YStack height={16} backgroundColor="$color3" borderRadius="$2" width="75%" />
                <YStack height={12} backgroundColor="$color3" borderRadius="$2" width="25%" />
              </YStack>
            </XStack>
          ))}
        </YStack>
      </YStack>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <YStack gap="$3">
        <SizableText fontSize="$3" fontWeight="500" color="$color11">
          Recent Activity
        </SizableText>
        <YStack alignItems="center" paddingVertical="$6">
          <SizableText fontSize="$3" color="$color10" style={{ textAlign: 'center' }}>
            {emptyMessage}
          </SizableText>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack gap="$3">
      <SizableText fontSize="$3" fontWeight="500" color="$color11">
        Recent Activity
      </SizableText>
      <YStack gap={0} maxHeight={256} overflow="scroll">
        {activities.map((activity, index) => (
          <XStack
            key={activity.id}
            alignItems="flex-start"
            gap="$3"
            paddingVertical="$2"
            borderBottomWidth={index !== activities.length - 1 ? 1 : 0}
            borderColor="$borderColor"
          >
            {/* Icon */}
            <YStack
              flexShrink={0}
              width={32}
              height={32}
              borderRadius={9999}
              backgroundColor="$color2"
              alignItems="center"
              justifyContent="center"
            >
              {getActivityIcon(activity.action)}
            </YStack>

            {/* Content */}
            <YStack flex={1} minWidth={0}>
              <SizableText fontSize="$3" color="$color12">
                {activity.description}
              </SizableText>
              <SizableText fontSize="$1" color="$color10">
                {formatTimestamp(activity.timestamp)}
              </SizableText>
            </YStack>
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
}

export default ActivityLog;
