/**
 * AdminFeedbackHeader - Header icon with badge for admin feedback notifications
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Stack, Button, Text } from '@unicornlove/beyond-ui';
import { trpc } from '../../lib/trpc';

export function AdminFeedbackHeader() {
  const navigate = useNavigate();

  // Fetch admin stats for badge
  const { data: stats } = trpc.feedback.admin.getStats.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const badgeCount = stats?.totalBadge || 0;

  return (
    <Button
      onPress={() => navigate('/admin/feedback')}
      variant="ghost"
      style={{
        padding: 8,
        borderRadius: 8,
        position: 'relative',
      }}
      aria-label={`Feedback${badgeCount > 0 ? ` (${badgeCount} items need attention)` : ''}`}
    >
      <MessageSquare size={20} color="var(--color-gray-11)" />

      {/* Badge */}
      {badgeCount > 0 && (
        <Stack
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            backgroundColor: 'var(--color-red-9)',
            borderRadius: '50%',
            minWidth: 16,
            height: 16,
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 4,
            paddingRight: 4,
            border: '2px solid var(--color-background)',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 10,
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </Stack>
      )}
    </Button>
  );
}

export default AdminFeedbackHeader;
