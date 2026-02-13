/**
 * FeedbackList - User's feedback items list view
 */

import React from 'react';
import { Bug, Lightbulb, HelpCircle, MessageCircle, ChevronRight, Inbox } from 'lucide-react';
import { Stack, Row, Text, Button } from '@scaffald/ui';
import { trpc } from '../../lib/trpc';

interface FeedbackListProps {
  onSelect: (feedbackId: string) => void;
  onNewFeedback: () => void;
}

const TYPE_CONFIG = {
  bug: { icon: Bug, label: 'Bug Report', color: 'var(--color-red-9)' },
  feature: { icon: Lightbulb, label: 'Feature Request', color: 'var(--color-yellow-9)' },
  support: { icon: HelpCircle, label: 'Support Request', color: 'var(--color-blue-9)' },
  general: { icon: MessageCircle, label: 'General Feedback', color: 'var(--color-gray-9)' },
} as const;

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'var(--color-blue-9)', bg: 'var(--color-blue-3)' },
  in_progress: { label: 'In Progress', color: 'var(--color-yellow-9)', bg: 'var(--color-yellow-3)' },
  resolved: { label: 'Resolved', color: 'var(--color-green-9)', bg: 'var(--color-green-3)' },
  archived: { label: 'Archived', color: 'var(--color-gray-9)', bg: 'var(--color-gray-3)' },
} as const;

export function FeedbackList({ onSelect, onNewFeedback }: FeedbackListProps) {
  const { data: items, isLoading, error } = trpc.feedback.list.useQuery({
    includeArchived: false,
  });

  // Format relative time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Stack style={{ padding: 24, alignItems: 'center', gap: 12 }}>
        <Text style={{ color: 'var(--color-gray-9)' }}>Loading...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack style={{ padding: 24, alignItems: 'center', gap: 12 }}>
        <Text style={{ color: 'var(--color-red-9)' }}>Failed to load feedback</Text>
      </Stack>
    );
  }

  return (
    <Stack style={{ height: '100%' }}>
      {/* Header */}
      <Row
        style={{
          padding: 16,
          borderBottom: '1px solid var(--color-border)',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
          My Feedback
        </Text>
        <Button onPress={onNewFeedback} variant="default" size="sm">
          New Feedback
        </Button>
      </Row>

      {/* List */}
      <Stack style={{ flex: 1, overflowY: 'auto' }}>
        {(!items || items.length === 0) ? (
          <Stack style={{ padding: 32, alignItems: 'center', gap: 12 }}>
            <Inbox size={48} color="var(--color-gray-6)" />
            <Text style={{ color: 'var(--color-gray-9)', textAlign: 'center' }}>
              No feedback yet
            </Text>
            <Text style={{ fontSize: 13, color: 'var(--color-gray-8)', textAlign: 'center' }}>
              Click "New Feedback" to submit a bug report, feature request, or get support.
            </Text>
          </Stack>
        ) : (
          items.map((item) => {
            const typeConfig = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG];
            const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
            const Icon = typeConfig?.icon || MessageCircle;

            return (
              <Button
                key={item.id}
                onPress={() => onSelect(item.id)}
                variant="ghost"
                style={{
                  padding: 16,
                  borderBottom: '1px solid var(--color-border)',
                  borderRadius: 0,
                  justifyContent: 'flex-start',
                  position: 'relative',
                }}
              >
                <Row style={{ gap: 12, alignItems: 'flex-start', flex: 1 }}>
                  {/* Type icon */}
                  <Stack
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: 'var(--color-gray-3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color={typeConfig?.color || 'var(--color-gray-9)'} />
                  </Stack>

                  {/* Content */}
                  <Stack style={{ flex: 1, gap: 4 }}>
                    <Row style={{ alignItems: 'center', gap: 8 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: 'var(--color-gray-12)',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.subject}
                      </Text>

                      {/* Unread indicator */}
                      {item.unreadCount > 0 && (
                        <Stack
                          style={{
                            backgroundColor: 'var(--color-red-9)',
                            borderRadius: 10,
                            paddingLeft: 6,
                            paddingRight: 6,
                            paddingTop: 2,
                            paddingBottom: 2,
                          }}
                        >
                          <Text style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>
                            {item.unreadCount}
                          </Text>
                        </Stack>
                      )}
                    </Row>

                    <Row style={{ alignItems: 'center', gap: 8 }}>
                      {/* Status badge */}
                      <Stack
                        style={{
                          backgroundColor: statusConfig?.bg || 'var(--color-gray-3)',
                          paddingLeft: 6,
                          paddingRight: 6,
                          paddingTop: 2,
                          paddingBottom: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: statusConfig?.color || 'var(--color-gray-9)',
                          }}
                        >
                          {statusConfig?.label || item.status}
                        </Text>
                      </Stack>

                      {/* Time */}
                      <Text style={{ fontSize: 12, color: 'var(--color-gray-9)' }}>
                        {formatTime(item.updated_at)}
                      </Text>
                    </Row>
                  </Stack>

                  {/* Arrow */}
                  <ChevronRight size={16} color="var(--color-gray-8)" />
                </Row>
              </Button>
            );
          })
        )}
      </Stack>
    </Stack>
  );
}

export default FeedbackList;
