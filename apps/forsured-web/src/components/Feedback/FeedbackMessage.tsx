/**
 * FeedbackMessage - Single message bubble in feedback conversation
 */

import React from 'react';
import { Stack, Row, Text } from '@scaffald/ui';
import { FeedbackAttachment } from './FeedbackAttachment';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size?: number | null;
  mime_type?: string | null;
}

interface FeedbackMessageProps {
  content: string;
  senderName: string;
  senderType: 'user' | 'admin';
  createdAt: string;
  attachments?: Attachment[];
  isCurrentUser?: boolean;
}

export function FeedbackMessage({
  content,
  senderName,
  senderType,
  createdAt,
  attachments = [],
  isCurrentUser = false,
}: FeedbackMessageProps) {
  const isUser = senderType === 'user';
  const alignRight = isCurrentUser || isUser;

  // Format timestamp
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

    return date.toLocaleDateString();
  };

  // Check if this is a system message (reassignment, etc.)
  const isSystemMessage = content.startsWith('[System]');

  if (isSystemMessage) {
    return (
      <Stack
        style={{
          alignItems: 'center',
          padding: 8,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: 'var(--color-gray-9)',
            fontStyle: 'italic',
          }}
        >
          {content.replace('[System] ', '')}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack
      style={{
        alignItems: alignRight ? 'flex-end' : 'flex-start',
        marginBottom: 12,
      }}
    >
      {/* Sender name and time */}
      <Row
        style={{
          gap: 8,
          marginBottom: 4,
          flexDirection: alignRight ? 'row-reverse' : 'row',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--color-gray-11)',
          }}
        >
          {senderName}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: 'var(--color-gray-9)',
          }}
        >
          {formatTime(createdAt)}
        </Text>
      </Row>

      {/* Message bubble */}
      <Stack
        style={{
          maxWidth: '80%',
          backgroundColor: alignRight
            ? 'var(--color-blue-3)'
            : 'var(--color-gray-3)',
          borderRadius: 12,
          borderTopRightRadius: alignRight ? 4 : 12,
          borderTopLeftRadius: alignRight ? 12 : 4,
          padding: 12,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: 'var(--color-gray-12)',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}
        >
          {content}
        </Text>

        {/* Attachments */}
        {attachments.length > 0 && (
          <Stack style={{ marginTop: 8, gap: 4 }}>
            {attachments.map((att) => (
              <FeedbackAttachment
                key={att.id}
                fileName={att.file_name}
                filePath={att.file_path}
                fileSize={att.file_size}
                mimeType={att.mime_type}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

export default FeedbackMessage;
