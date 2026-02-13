/**
 * FeedbackButton - Floating feedback icon with unread badge
 * Replaces the ThemeSwitcher in bottom-right corner
 */

import React from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Stack, Button, Text } from '@scaffald/ui';
import { trpc } from '../../lib/trpc';

interface FeedbackButtonProps {
  onClick: () => void;
}

export function FeedbackButton({ onClick }: FeedbackButtonProps) {
  // Fetch unread count for badge
  const { data: unreadData } = trpc.feedback.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = unreadData?.count || 0;

  return (
    <Stack
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 50,
      }}
    >
      <Button
        onPress={onClick}
        variant="ghost"
        style={{
          backgroundColor: 'var(--color-background-hover)',
          borderRadius: '50%',
          padding: 16,
          boxShadow: '0 8px 20px var(--color-shadow)',
          border: '2px solid var(--color-border)',
          position: 'relative',
        }}
        aria-label={`Open feedback${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <MessageSquarePlus size={24} color="var(--color-blue-10)" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <Stack
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: 'var(--color-red-9)',
              borderRadius: '50%',
              minWidth: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: 6,
              paddingRight: 6,
              border: '2px solid var(--color-background)',
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </Stack>
        )}
      </Button>
    </Stack>
  );
}

export default FeedbackButton;
