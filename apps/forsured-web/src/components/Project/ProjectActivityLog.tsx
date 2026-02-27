/**
 * ProjectActivityLog - Display project activity from audit logs
 *
 * Shows chronological list of project actions with timestamps, user info,
 * and change details. Supports pagination for large activity histories.
 */

'use client';

import { useCallback } from 'react';
import {
  LogIn,
  LogOut,
  Edit,
  Plus,
  Trash2,
  Info,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Calculator,
  RefreshCw,
  User,
  Shield,
  Settings,
  Download,
} from 'lucide-react';
import { Stack, Row, Text, Card } from '@scaffald/ui';
import Button from '../Common/Button';
import type { ProjectActivityEntry } from '../../hooks/useProjectActivityLog';

interface ProjectActivityLogProps {
  activities: ProjectActivityEntry[];
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  emptyMessage?: string;
}

/**
 * Format timestamp for display with relative and absolute time
 */
function formatTimestamp(timestamp: string): { relative: string; absolute: string } {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relative: string;
  if (diffMins < 1) {
    relative = 'Just now';
  } else if (diffMins < 60) {
    relative = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    relative = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    relative = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    relative = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  const absolute = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return { relative, absolute };
}

/**
 * Get icon and color for activity type
 */
function getActivityStyle(action: string, category: string): { icon: React.ReactNode; color: string; bgColor: string } {
  const iconSize = 16;

  // Category-based icons
  if (category === 'authentication') {
    if (action.includes('login')) {
      return {
        icon: <LogIn size={iconSize} />,
        color: 'var(--color-blue-10)',
        bgColor: 'var(--color-blue-3)',
      };
    }
    if (action.includes('logout')) {
      return {
        icon: <LogOut size={iconSize} />,
        color: 'var(--color-gray-10)',
        bgColor: 'var(--color-gray-3)',
      };
    }
  }

  if (category === 'compliance') {
    if (action.includes('approved')) {
      return {
        icon: <CheckCircle size={iconSize} />,
        color: 'var(--color-green-10)',
        bgColor: 'var(--color-green-3)',
      };
    }
    if (action.includes('rejected')) {
      return {
        icon: <XCircle size={iconSize} />,
        color: 'var(--color-red-10)',
        bgColor: 'var(--color-red-3)',
      };
    }
    if (action.includes('score') || action.includes('evaluation')) {
      return {
        icon: <Calculator size={iconSize} />,
        color: 'var(--color-purple-10)',
        bgColor: 'var(--color-purple-3)',
      };
    }
    return {
      icon: <Shield size={iconSize} />,
      color: 'var(--color-blue-10)',
      bgColor: 'var(--color-blue-3)',
    };
  }

  if (category === 'security') {
    return {
      icon: <Shield size={iconSize} />,
      color: 'var(--color-orange-10)',
      bgColor: 'var(--color-orange-3)',
    };
  }

  if (category === 'admin') {
    return {
      icon: <Settings size={iconSize} />,
      color: 'var(--color-purple-10)',
      bgColor: 'var(--color-purple-3)',
    };
  }

  // Action-based icons
  switch (action.toLowerCase()) {
    case 'create':
    case 'add':
      return {
        icon: <Plus size={iconSize} />,
        color: 'var(--color-green-10)',
        bgColor: 'var(--color-green-3)',
      };
    case 'update':
    case 'edit':
      return {
        icon: <Edit size={iconSize} />,
        color: 'var(--color-yellow-10)',
        bgColor: 'var(--color-yellow-3)',
      };
    case 'delete':
    case 'remove':
    case 'soft_delete':
      return {
        icon: <Trash2 size={iconSize} />,
        color: 'var(--color-red-10)',
        bgColor: 'var(--color-red-3)',
      };
    case 'view_project':
    case 'view':
      return {
        icon: <Eye size={iconSize} />,
        color: 'var(--color-gray-10)',
        bgColor: 'var(--color-gray-3)',
      };
    case 'export_data':
      return {
        icon: <Download size={iconSize} />,
        color: 'var(--color-blue-10)',
        bgColor: 'var(--color-blue-3)',
      };
    default:
      if (action.includes('document')) {
        return {
          icon: <FileText size={iconSize} />,
          color: 'var(--color-blue-10)',
          bgColor: 'var(--color-blue-3)',
        };
      }
      return {
        icon: <Info size={iconSize} />,
        color: 'var(--color-gray-10)',
        bgColor: 'var(--color-gray-3)',
      };
  }
}

/**
 * Get severity badge style
 */
function getSeverityStyle(severity: string): { color: string; bgColor: string } {
  switch (severity.toLowerCase()) {
    case 'critical':
      return { color: 'var(--color-red-11)', bgColor: 'var(--color-red-3)' };
    case 'high':
      return { color: 'var(--color-orange-11)', bgColor: 'var(--color-orange-3)' };
    case 'medium':
      return { color: 'var(--color-yellow-11)', bgColor: 'var(--color-yellow-3)' };
    default:
      return { color: 'var(--color-gray-11)', bgColor: 'var(--color-gray-3)' };
  }
}

/**
 * Activity entry component
 */
function ActivityEntry({ activity }: { activity: ProjectActivityEntry }) {
  const { relative, absolute } = formatTimestamp(activity.timestamp);
  const style = getActivityStyle(activity.action, activity.category);
  const severityStyle = getSeverityStyle(activity.severity);

  const showChangedFields = activity.changed_fields && activity.changed_fields.length > 0;
  const showSeverity = activity.severity && activity.severity !== 'low' && activity.severity !== 'info';

  return (
    <Row
      style={{
        alignItems: 'flex-start',
        gap: 12,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: style.bgColor,
          color: style.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {style.icon}
      </div>

      {/* Content */}
      <Stack style={{ flex: 1, minWidth: 0, gap: 4 }}>
        {/* Description */}
        <Text style={{ fontSize: 14, color: 'var(--color-gray-12)', fontWeight: 500 }}>
          {activity.description}
        </Text>

        {/* User and time */}
        <Row style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {(activity.user_name || activity.user_email) && (
            <Row style={{ gap: 4, alignItems: 'center' }}>
              <User size={12} color="var(--color-gray-9)" />
              <Text style={{ fontSize: 12, color: 'var(--color-gray-10)' }}>
                {activity.user_name || activity.user_email}
              </Text>
            </Row>
          )}
          <Text
            style={{ fontSize: 12, color: 'var(--color-gray-9)' }}
            title={absolute}
          >
            {relative}
          </Text>
          {showSeverity && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: 4,
                color: severityStyle.color,
                backgroundColor: severityStyle.bgColor,
              }}
            >
              {activity.severity}
            </span>
          )}
        </Row>

        {/* Changed fields */}
        {showChangedFields && (
          <Text style={{ fontSize: 12, color: 'var(--color-gray-9)', marginTop: 4 }}>
            Fields: {activity.changed_fields?.join(', ')}
          </Text>
        )}
      </Stack>
    </Row>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <Stack style={{ gap: 0 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Row
          key={i}
          style={{
            alignItems: 'flex-start',
            gap: 12,
            paddingTop: 12,
            paddingBottom: 12,
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'var(--color-gray-3)',
            }}
          />
          <Stack style={{ flex: 1, gap: 6 }}>
            <div
              style={{
                height: 16,
                backgroundColor: 'var(--color-gray-3)',
                borderRadius: 4,
                width: '75%',
              }}
            />
            <div
              style={{
                height: 12,
                backgroundColor: 'var(--color-gray-3)',
                borderRadius: 4,
                width: '40%',
              }}
            />
          </Stack>
        </Row>
      ))}
    </Stack>
  );
}

/**
 * Main component
 */
export function ProjectActivityLog({
  activities,
  loading = false,
  error = null,
  hasMore = false,
  onLoadMore,
  onRefresh,
  emptyMessage = 'No activity recorded for this project yet',
}: ProjectActivityLogProps) {
  const handleLoadMore = useCallback(() => {
    if (onLoadMore) {
      onLoadMore();
    }
  }, [onLoadMore]);

  // Error state
  if (error) {
    return (
      <Card style={{ padding: 24 }}>
        <Stack style={{ alignItems: 'center', gap: 12 }}>
          <XCircle size={32} color="var(--color-red-10)" />
          <Text style={{ fontSize: 14, color: 'var(--color-red-11)', textAlign: 'center' }}>
            {error}
          </Text>
          {onRefresh && (
            <Button
              color="gray"
              size="sm"
              iconStart={RefreshCw}
              onPress={onRefresh}
            >
              Retry
            </Button>
          )}
        </Stack>
      </Card>
    );
  }

  // Loading state (initial)
  if (loading && activities.length === 0) {
    return (
      <Card style={{ padding: 16 }}>
        <Stack style={{ gap: 12 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-gray-11)' }}>
              Activity Log
            </Text>
          </Row>
          <LoadingSkeleton />
        </Stack>
      </Card>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <Card style={{ padding: 24 }}>
        <Stack style={{ alignItems: 'center', gap: 12 }}>
          <Info size={32} color="var(--color-gray-9)" />
          <Text style={{ fontSize: 14, color: 'var(--color-gray-10)', textAlign: 'center' }}>
            {emptyMessage}
          </Text>
          <Text style={{ fontSize: 12, color: 'var(--color-gray-9)', textAlign: 'center' }}>
            Activity will appear here as changes are made to the project
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 16 }}>
      <Stack style={{ gap: 12 }}>
        {/* Header */}
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-gray-11)' }}>
            Activity Log ({activities.length}{hasMore ? '+' : ''})
          </Text>
          {onRefresh && (
            <Button
              color="gray"
              variant="text"
              size="sm"
              iconStart={RefreshCw}
              onPress={onRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          )}
        </Row>

        {/* Activity list */}
        <Stack style={{ gap: 0 }}>
          {activities.map((activity) => (
            <ActivityEntry key={activity.id} activity={activity} />
          ))}
        </Stack>

        {/* Load more */}
        {hasMore && (
          <Row style={{ justifyContent: 'center', paddingTop: 8 }}>
            <Button
              color="gray"
              size="sm"
              onPress={handleLoadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </Row>
        )}
      </Stack>
    </Card>
  );
}

export default ProjectActivityLog;
