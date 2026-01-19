/**
 * FeedbackConversation - Chat thread view for a feedback item
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  HelpCircle,
  MessageCircle,
  Archive,
  Upload,
  Send,
  Loader2,
  X,
} from 'lucide-react';
import { Stack, Row, Text, Button } from '@unicornlove/beyond-ui';
import { toast } from 'sonner';
import { trpc } from '../../lib/trpc';
import { FeedbackMessage } from './FeedbackMessage';
import { PageScreenshot } from './PageScreenshot';

interface AttachmentPreview {
  id: string;
  file: File;
  blob?: Blob;
  preview?: string;
}

interface FeedbackConversationProps {
  feedbackId: string;
  onBack: () => void;
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

export function FeedbackConversation({ feedbackId, onBack }: FeedbackConversationProps) {
  const [replyContent, setReplyContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [sending, setSending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Fetch feedback data
  const { data: feedback, isLoading, error } = trpc.feedback.get.useQuery({ feedbackId });

  // Mutations
  const replyMutation = trpc.feedback.reply.useMutation();
  const archiveMutation = trpc.feedback.archive.useMutation();
  const getUploadUrlMutation = trpc.feedback.getUploadUrl.useMutation();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedback?.messages]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}`, { description: 'Maximum file size is 2MB' });
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      setAttachments((prev) => [...prev, { id, file, preview }]);
    }

    e.target.value = '';
  }, []);

  // Handle screenshot capture
  const handleScreenshotCapture = useCallback((blob: Blob, fileName: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const file = new File([blob], fileName, { type: 'image/png' });
    const preview = URL.createObjectURL(blob);
    setAttachments((prev) => [...prev, { id, file, blob, preview }]);
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  // Handle reply
  const handleReply = async () => {
    if (!replyContent.trim() && attachments.length === 0) {
      return;
    }

    setSending(true);

    try {
      // Upload attachments
      const uploadedAttachments: { fileName: string; filePath: string; fileSize: number; mimeType: string }[] = [];

      for (const att of attachments) {
        try {
          const { signedUrl, path } = await getUploadUrlMutation.mutateAsync({
            feedbackId,
            fileName: att.file.name,
            mimeType: att.file.type || 'application/octet-stream',
          });

          await fetch(signedUrl, {
            method: 'PUT',
            body: att.file,
            headers: { 'Content-Type': att.file.type || 'application/octet-stream' },
          });

          uploadedAttachments.push({
            fileName: att.file.name,
            filePath: path,
            fileSize: att.file.size,
            mimeType: att.file.type || 'application/octet-stream',
          });
        } catch (uploadError) {
          console.error('Failed to upload:', uploadError);
        }
      }

      // Send reply
      await replyMutation.mutateAsync({
        feedbackId,
        content: replyContent.trim() || '(attachment)',
        attachments: uploadedAttachments,
      });

      // Clear form
      setReplyContent('');
      setAttachments([]);

      // Refresh data
      await utils.feedback.get.invalidate({ feedbackId });
      await utils.feedback.list.invalidate();
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  // Handle archive
  const handleArchive = async () => {
    setArchiving(true);
    try {
      await archiveMutation.mutateAsync({ feedbackId });
      await utils.feedback.list.invalidate();
      toast.success('Feedback archived');
      onBack();
    } catch (error) {
      console.error('Failed to archive:', error);
      toast.error('Failed to archive feedback');
    } finally {
      setArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <Stack style={{ padding: 24, alignItems: 'center' }}>
        <Text style={{ color: 'var(--color-gray-9)' }}>Loading...</Text>
      </Stack>
    );
  }

  if (error || !feedback) {
    return (
      <Stack style={{ padding: 24, alignItems: 'center', gap: 12 }}>
        <Text style={{ color: 'var(--color-red-9)' }}>Failed to load feedback</Text>
        <Button onPress={onBack} variant="ghost">Go Back</Button>
      </Stack>
    );
  }

  const typeConfig = TYPE_CONFIG[feedback.type as keyof typeof TYPE_CONFIG];
  const statusConfig = STATUS_CONFIG[feedback.status as keyof typeof STATUS_CONFIG];
  const Icon = typeConfig?.icon || MessageCircle;
  const isArchived = !!feedback.user_archived_at;

  return (
    <Stack style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Stack
        style={{
          padding: 12,
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Button onPress={onBack} variant="ghost" style={{ padding: 4 }}>
            <ArrowLeft size={20} color="var(--color-gray-10)" />
          </Button>
          <Icon size={18} color={typeConfig?.color} />
          <Text
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--color-gray-12)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {feedback.subject}
          </Text>
        </Row>

        <Row style={{ alignItems: 'center', gap: 8, paddingLeft: 32 }}>
          <Stack
            style={{
              backgroundColor: statusConfig?.bg,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 500, color: statusConfig?.color }}>
              {statusConfig?.label}
            </Text>
          </Stack>

          {!isArchived && (
            <Button
              onPress={handleArchive}
              variant="ghost"
              disabled={archiving}
              style={{ marginLeft: 'auto', padding: 4, gap: 4 }}
            >
              <Archive size={14} color="var(--color-gray-9)" />
              <Text style={{ fontSize: 12, color: 'var(--color-gray-9)' }}>Archive</Text>
            </Button>
          )}
        </Row>
      </Stack>

      {/* Messages */}
      <Stack
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          gap: 8,
        }}
      >
        {feedback.messages.map((msg) => (
          <FeedbackMessage
            key={msg.id}
            content={msg.content}
            senderName={msg.senderName}
            senderType={msg.sender_type as 'user' | 'admin'}
            createdAt={msg.created_at}
            attachments={msg.attachments}
            isCurrentUser={msg.sender_type === 'user'}
          />
        ))}
        <div ref={messagesEndRef} />
      </Stack>

      {/* Reply input */}
      {!isArchived && (
        <Stack
          style={{
            padding: 12,
            borderTop: '1px solid var(--color-border)',
            flexShrink: 0,
            gap: 8,
          }}
        >
          {/* Attachment previews */}
          {attachments.length > 0 && (
            <Row style={{ gap: 8, flexWrap: 'wrap' }}>
              {attachments.map((att) => (
                <Stack
                  key={att.id}
                  style={{
                    position: 'relative',
                    width: 48,
                    height: 48,
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid var(--color-gray-4)',
                  }}
                >
                  {att.preview ? (
                    <img
                      src={att.preview}
                      alt={att.file.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Stack
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'var(--color-gray-3)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Upload size={16} color="var(--color-gray-9)" />
                    </Stack>
                  )}
                  <Button
                    onPress={() => removeAttachment(att.id)}
                    variant="ghost"
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 18,
                      height: 18,
                      padding: 0,
                      backgroundColor: 'var(--color-gray-12)',
                      borderRadius: '50%',
                    }}
                  >
                    <X size={10} color="white" />
                  </Button>
                </Stack>
              ))}
            </Row>
          )}

          <Row style={{ gap: 8 }}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your reply..."
              rows={2}
              disabled={sending}
              style={{
                flex: 1,
                resize: 'none',
                padding: 10,
                fontSize: 14,
                borderRadius: 8,
                border: '1px solid var(--color-gray-6)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-gray-12)',
                fontFamily: 'inherit',
                outline: 'none',
                opacity: sending ? 0.6 : 1,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-blue-8)';
                e.target.style.boxShadow = '0 0 0 2px var(--color-blue-4)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-gray-6)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Row>

          <Row style={{ gap: 8, justifyContent: 'space-between' }}>
            <Row style={{ gap: 8 }}>
              <PageScreenshot onCapture={handleScreenshotCapture} disabled={sending} />
              <Button
                variant="ghost"
                onPress={() => document.getElementById('reply-file-input')?.click()}
                disabled={sending}
                style={{ padding: 8 }}
              >
                <Upload size={16} />
              </Button>
              <input
                id="reply-file-input"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Row>

            <Button
              onPress={handleReply}
              variant="default"
              disabled={sending || (!replyContent.trim() && attachments.length === 0)}
              style={{ gap: 6 }}
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              <Text>Send</Text>
            </Button>
          </Row>
        </Stack>
      )}
    </Stack>
  );
}

export default FeedbackConversation;
